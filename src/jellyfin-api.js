const Log = require('./logger.js');
/*********************************************************************************
 * Request Items from API
 *      https://api.jellyfin.org/
 */

const Request = async function(endpoint, params, ...args)
{
    const url = new URL(endpoint, CONFIG.jellyfin.host);
    
    if (params)
    {
        params = Object.assign({}, params, ...args);

        for (const key in params)
        {
            const value = params[key];

            if (value instanceof Array)
                value.forEach(item => url.searchParams.append(key, String(item)));
            else
                url.searchParams.append(key, String(value));
        }
    }

    // DEBUG: Log outgoing Jellyfin request (endpoint and query only; never log tokens).
    Log.debug('[Jellyfin] GET', Log.redactUrl(url.toString()));

    const started = Date.now();

    let response;
    try {
        response = await fetch(
        url,
        {
            method: 'GET',
            headers:
            {
                Authorization: `MediaBrowser Token="${CONFIG.jellyfin.key}"`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }
    );
    } catch (err) {
        Log.error('[Jellyfin] Network error:', err);
        return {status: false, error: String(err)};
    }

    Log.debug(`[Jellyfin] Response ${response.status} (${Date.now() - started}ms) for`, url.pathname);

    if (!response.ok) {
        // capture body safely for diagnostics, but avoid throwing
        let body;
        try { body = await response.text(); } catch (e) { body = '<failed-to-read-body>'; }
        Log.warn(`[Jellyfin] Non-OK response ${response.status} for ${url.pathname}:`, body);
        return {status: false, statusCode: response.status, error: body};
    }

    var result = await response.json();

    // TRACE: show result summary
    Log.trace('[Jellyfin] Result summary:', {
        startIndex: result.StartIndex,
        total: result.TotalRecordCount,
        returned: Array.isArray(result.Items) ? result.Items.length : undefined
    });
    Log.debug('[Jellyfin] ' + Log.summarizeItems(result.Items, 8));
    
    return {status: true, items: result.Items, index: result.StartIndex, count: result.TotalRecordCount };
};

/*********************************************************************************
 * Paged Items.
 * Returns the first page and process a function for all pages.
 */

/*const PagedItems = async function(callback, api, limit, ...args)
{
    const result = await api(...args, {limit})

    if (!result.status) return result;

    if (callback)
    {
        callback(res);

        for (let i = result.index; i < result.count; i += limit)
            api(...args, {limit, startIndex: i}).then(callback);
    };

    return result;
};*/

/*********************************************************************************
 * Request Artists
 */

const Artists = async (...params) => await Request("/Artists", ...params);

Artists.ByName = async (artist, ...params) => await Request(`/Artists/${artist}`, ...params);

Artists.AlbumArtists = async (...params) => await Request("/Artists/AlbumArtists", ...params);

/*********************************************************************************
 * Music Genres (new helper)
 * Supports the dedicated /MusicGenres endpoint which returns an array.
 * Implements server-side SearchTerm/Limit and a ResolveIdByName helper with caching.
 */

const MusicGenres = async function(params) {
    const url = new URL("/MusicGenres", CONFIG.jellyfin.host);

    if (params && typeof params === 'object') {
        for (const k in params) url.searchParams.append(k, String(params[k]));
    }

    // Debug: log request
    Log.debug('[Jellyfin] GET', Log.redactUrl(url.toString()));

    const started = Date.now();

    let response;
    try {
        response = await fetch(
            url,
            {
                method: 'GET',
                headers:
                {
                    Authorization: `MediaBrowser Token="${CONFIG.jellyfin.key}"`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            }
        );
    } catch (err) {
        Log.error('[Jellyfin] Network error:', err);
        return {status: false, error: String(err)};
    }

    Log.debug(`[Jellyfin] Response ${response.status} (${Date.now() - started}ms) for`, url.pathname);

    if (!response.ok) {
        let body;
        try { body = await response.text(); } catch (e) { body = '<failed-to-read-body>'; }
        Log.warn(`[Jellyfin] Non-OK response ${response.status} for ${url.pathname}:`, body);
        return {status: false, statusCode: response.status, error: body};
    }

    const result = await response.json();

    // Normalize result: /MusicGenres may return an array directly
    let items = [];
    if (Array.isArray(result)) items = result;
    else if (Array.isArray(result.Items)) items = result.Items;

    Log.trace('[Jellyfin] MusicGenres result count:', items.length);
    Log.debug('[Jellyfin] ' + Log.summarizeItems(items, 8));

    return { status: true, items, index: 0, count: items.length };
};

// Search helper using server-side SearchTerm & Limit
MusicGenres.Search = async function(query, opts = {}) {
    const params = Object.assign({}, opts, { SearchTerm: query });
    if (!params.Limit) params.Limit = CONFIG.jellyfin.limit || 25;
    return await MusicGenres(params);
};

// Simple in-memory cache for genre name -> id
const _genreCache = { };
const _genreCacheTtl = Number(process.env.GENRE_CACHE_TTL) || (CONFIG.jellyfin.genreCacheTtl || 30 * 60 * 1000);

// Resolve best matching genre Id by name with ranking
// Prioridad: exacto (case-insensitive) > startsWith > includes > first
MusicGenres.ResolveIdByName = async function(name) {
    if (!name) return null;

    const key = String(name).trim().toLowerCase();

    // Cache hit
    const cached = _genreCache[key];
    if (cached && cached.expires > Date.now()) {
        Log.debug(`[Genres] Cache hit for '${key}' -> ${cached.id}`);
        return cached.id;
    }

    Log.info(`[Genres] Resolving genre name: '${name}'`);

    const res = await MusicGenres.Search(name);

    if (!res.status) {
        Log.warn(`[Genres] Search failed for '${name}':`, res.error || res);
        return null;
    }

    const items = res.items || [];

    Log.debug('[Genres] Search returned:', Log.summarizeItems(items, 12));

    if (!items.length) {
        Log.info(`[Genres] No genres found for '${name}'`);
        return null;
    }

    const norm = s => String(s || '').trim().toLowerCase();

    // Ranking phases
    let selected = null;

    // exact
    for (const it of items) if (norm(it.Name) === key) { selected = it; Log.info(`[Genres] Exact match -> ${it.Name} (${it.Id})`); break; }

    // startsWith
    if (!selected) for (const it of items) if (norm(it.Name).startsWith(key)) { selected = it; Log.info(`[Genres] StartsWith match -> ${it.Name} (${it.Id})`); break; }

    // includes
    if (!selected) for (const it of items) if (norm(it.Name).includes(key)) { selected = it; Log.info(`[Genres] Includes match -> ${it.Name} (${it.Id})`); break; }

    // fallback first
    if (!selected) { selected = items[0]; Log.info(`[Genres] Fallback to first -> ${selected.Name} (${selected.Id})`); }

    // Cache the selection
    if (selected) {
        _genreCache[key] = { id: selected.Id, expires: Date.now() + _genreCacheTtl };
        Log.debug(`[Genres] Cached '${key}' -> ${selected.Id} (ttl=${_genreCacheTtl}ms)`);
        return selected.Id;
    }

    return null;
};

/*********************************************************************************
 * Request Items
 */

const Items = async (...params) => await Request("/Items", { Recursive:true }, ...params);

Items.Artists = Artists;
Items.Music = async (...params) => await Items({includeItemTypes: "Audio"}, ...params);
Items.Albums = async (...params) => await Items({includeItemTypes: "MusicAlbum"}, ...params);
Items.MusicGenres = async (...params) => await Items({includeItemTypes: "MusicGenre"}, ...params);

// Ensure the high-level MusicGenres helpers are available on the exported Items namespace
// (ResolveIdByName & Search are implemented above on the internal MusicGenres helper)
if (typeof MusicGenres !== 'undefined') {
    Items.MusicGenres.ResolveIdByName = MusicGenres.ResolveIdByName;
    Items.MusicGenres.Search = MusicGenres.Search;
}

Items.Playlists = async (...params) => await Items({includeItemTypes: "Playlist"}, ...params);


/*********************************************************************************
 * Search Function (server-side)
 */
const Search = async function (api, field, query, ...params) {
    if (!query || !String(query).trim()) {
        return { status: false, error: "Empty query" };
    }

    // Ask Jellyfin to do the search; do NOT fetch the entire library.
    const result = await api(
        {
            SearchTerm: String(query).trim(),
            Limit: 25,
            Recursive: true,
        },
        ...params
    );

    if (!result.status) return result;

    // Optional: tighten results client-side if you want (case-insensitive contains on 'field')
    const q = String(query).toLowerCase();
    result.items = (result.items || []).filter(it => {
        const v = (it && it[field]) ? String(it[field]).toLowerCase() : "";
        return v.includes(q);
    });

    return result;
};

Items.Music.Search = async (query, ...params) => await Search(Items.Music, "Name", query, ...params);
Items.Albums.Search = async (query, ...params) => await Search(Items.Albums, "Name", query, ...params);
Items.Artists.Search = async (query, ...params) => await Search(Items.Artists, "Name", query, ...params);
Items.MusicGenres.Search = async (query, ...params) => await Search(Items.MusicGenres, "Name", query, ...params);
Items.Playlists.Search = async (query, ...params) => await Search(Items.Playlists, "Name", query, ...params);

/*********************************************************************************
 * Find Albums
 */

Items.Albums.ByGenre = async function(query, ...params)
{
    const result = await Items.MusicGenres.Search(query);

    if (!result.status) return result;

    const result2 = await Items.Albums({genres: result.items.map(item => item.Name).join("|")}, ...params);

    if (!result2.status) return result2;

    result2.genres = result.items;

    return result2;
};

Items.Albums.ByArist = async function(query, ...params)
{
    const result = await Items.Artists.Search(query);

    if (!result.status) return result;

    const result2 = await Items.Albums({artistIds: result.items.map(item => item.Id).join("|")}, ...params);

    if (!result2.status) return result2;

    result2.albums = result.items;

    return result2;
};

/*********************************************************************************
 * Find Artist
 */

Items.Artists.ByGenre = async function(query, ...params)
{
    const result = await Items.MusicGenres.Search(query);

    if (!result.status) return result;

    const result2 = await Items.Artists({genres: result.items.map(item => item.Name).join("|")}, ...params);

    if (!result2.status) return result2;

    result2.artists = result.items;

    return result2;
};

/*********************************************************************************
 * Find Songs
 */

Items.Music.ByGenre = async function(query, ...params)
{
    const result = await Items.MusicGenres.Search(query);

    if (!result.status) return result;

    const result2 = await Items.Music({genres: result.items.map(item => item.Name).join("|")}, ...params);

    if (!result2.status) return result2;

    result2.genres = result.items;

    return result2;
};

Items.Music.ByArist = async function(query, ...params)
{
    const result = await Items.Artists.Search(query);

    if (!result.status) return result;

    const result2 = await Items.Music({artistIds: result.items.map(item => item.Id).join("|")}, ...params);

    if (!result2.status) return result2;

    result2.artists = result.items;

    return result2;
};

Items.Music.ByAlbum = async function(query, ...params)
{
    const result = await Items.Albums.Search(query);

    if (!result.status) return result;

    const result2 = await Items.Music({albumIds: result.items.map(item => item.Id).join("|")}, ...params);

    if (!result2.status) return result2;

    result2.albums = result.items;

    return result2;
};

/*********************************************************************************
 * Find Songs by playlist
 */

/*Items.Music.ByPlayList = async function(query, ...params)
{
    const result = await Items.Playlists.Search(query, {fields: "ItemIds"});

    if (!result.status) return result;

    const items = { };

    for(item of result.items)
    {
        const result2 = await Items({parentId: item.Id}, ...params);

        if (!result2.status) continue;

        result2.items.forEach(item => items[item.Id] = item);
    }

    result.playlists = result.items;

    result.items = Object.values(items);

    return result;
};*/

/*********************************************************************************
 * Exports
 */

module.exports = Items;