const Config = require("/data/config.json").jellyfin;

/*********************************************************************************
 * Request Items from API
 *      https://api.jellyfin.org/
 */

const Request = async function(endpoint, params, ...args)
{
    const url = new URL(endpoint, Config.host);
    
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

    const response = await fetch(
        url,
        {
            method: 'GET',
            headers:
            {
                Authorization: `MediaBrowser Token="${Config.key}"`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        }
    );

    if (!response.ok)
        return {status: false, error: await response.text()};

    var result = await response.json();
    
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
 * Request Items
 */

const Items = async (...params) => await Request("/Items", { Recursive:true }, ...params);

Items.Artists = Artists;
Items.Music = async (...params) => await Items({includeItemTypes: "Audio"}, ...params);
Items.Albums = async (...params) => await Items({includeItemTypes: "MusicAlbum"}, ...params);
Items.MusicGenres = async (...params) => await Items({includeItemTypes: "MusicGenre"}, ...params);
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