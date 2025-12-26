const fuzzball = require('fuzzball');

/*********************************************************************************
 * Request Items from API
 *      https://api.jellyfin.org/
 */

const Request = async function(endpoint, params, ...args)
{
    const url = new URL(endpoint, CONFIG.jellyfin.local);
    
    if (params)
    {
        params = Object.assign({}, params, ...args);

        for (const key in params)
        {
            const value = params[key];

            if (value == null)
                continue;
            else if (value instanceof Array)
                value.forEach(item => url.searchParams.append(key, String(item)));
            else
                url.searchParams.append(key, String(value));
        }
    }

    const response = await fetch(
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

    if (!response.ok)
    {
        Logger.Error("[JellyFin API]", `No Response from Server (path: ${url.pathname}).`);
        
        //TODO: Trace Error Message?
        
        return {status: false, error: await response.text()};
    }

    var result = await response.json();
    
    return {status: true, items: result.Items, index: result.StartIndex, count: result.TotalRecordCount };
};

/*********************************************************************************
 * Request Artists
 */

const Artists = async (...params) => await Request("/Artists", ...params);

Artists.ByName = async (artist, ...params) => await Request(`/Artists/${artist}`, ...params);

Artists.AlbumArtists = async (...params) => await Request("/Artists/AlbumArtists", ...params);

/*********************************************************************************
 * Request Items
 */

const Items = async (...params) => await Request("/Items", { Recursive:true }, ...params);

Items.Artists = Artists;

Items.Music = async (...params) => await Items({includeItemTypes: "Audio"}, ...params);

Items.Albums = async (...params) => await Items({includeItemTypes: "MusicAlbum"}, ...params);

Items.MusicGenres = async (...params) => await Request("/MusicGenres", ...params);

Items.Playlists = async (...params) => await Items({includeItemTypes: "Playlist"}, ...params);

/*********************************************************************************
 * Search Function
 */

const Search = async function(api, field, query, ...perams)
{
    const result = await api(...perams);

    if (!result.status) return result;

    query = query.toLowerCase();

    const collator = new Intl.Collator(undefined, {sensitivity: "accent", usage: "search"});

    result.items = result.items.filter((item) => {
        const value = item[field];

        if (value == null) return false;

        if (typeof value === 'string')
            return collator.compare(value.toLowerCase(), query) === 0 || value.toLowerCase().includes(query);
        
        if (value instanceof Array)
            for(v of value)
                if (collator.compare(v.toLowerCase(), query) === 0 || v.toLowerCase().includes(query)) return true;

        return false;
    });


    return result;
};

Items.Music.Search = async (query, ...params) => await Search(Items.Music, "Name", query, ...params);

Items.Albums.Search = async (query, ...params) => await Search(Items.Albums, "Name", query, ...params);

Items.Artists.Search = async (query, ...params) => await Search(Items.Artists, "Name", query, ...params);

Items.MusicGenres.Search = async (query, ...params) => await Search(Items.MusicGenres, "Name", query, ...params);

Items.Playlists.Search = async (query, ...params) => await Search(Items.Playlists, "Name", query, ...params);

/*********************************************************************************
 * Fuzzy Search Function: Warning this is SLOW!
 */

const FuzzySearch = async function(api, field, query, ...perams)
{
    const result = await api(perams);

    if (!result.status) return result;

    result.items.forEach(item => item.score = fuzzball.token_sort_ratio(query, item[field]));
    result.items = result.items.filter((item) => item.score > 60);
    result.items.sort((a, b) => b.score - a.score);

    return result;
};

Items.Music.FuzzySearch = async (query, ...params) => await FuzzySearch(Items.Music, "Name", query, ...params);

Items.Albums.FuzzySearch = async (query, ...params) => await FuzzySearch(Items.Albums, "Name", query, ...params);

Items.Artists.FuzzySearch = async (query, ...params) => await FuzzySearch(Items.Artists, "Name", query, ...params);

Items.MusicGenres.FuzzySearch = async (query, ...params) => await FuzzySearch(Items.MusicGenres, "Name", query, ...params);

Items.Playlists.FuzzySearch = async (query, ...params) => await FuzzySearch(Items.Playlists, "Name", query, ...params);

/*********************************************************************************
 * Find Albums
 */

Items.Albums.ByGenre = async function(query, ...params)
{
    const result = await Items.MusicGenres.FuzzySearch(query);

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
    const result = await Items.MusicGenres.FuzzySearch(query);

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
    const result = await Items.MusicGenres.FuzzySearch(query);

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
 * Exports
 */

module.exports = Items;