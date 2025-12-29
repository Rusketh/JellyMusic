const https = require('https');

/*********************************************************************************
 * API Request
 */

const Agent = new https.Agent({ keepAlive: true });

const RequestOptions = {
    method: 'GET',
    agent: Agent,
    timeout: 5000,
    headers:
    {
        Authorization: `MediaBrowser Token="${CONFIG.jellyfin.key}"`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

const MakeAPIRequest = async function (url, { ids, query, albums, artists, genres, parent }, startIndex, limit) {

    url.searchParams.append("limit", limit || CONFIG.jellyfin.limit);

    if (query) url.searchParams.append("searchTerm", query);
    if (startIndex) url.searchParams.append("startIndex", startIndex);
    if (ids) url.searchParams.append("ids", ids.join(","));
    if (albums) url.searchParams.append("albumIds", albums.join(","));
    if (artists) url.searchParams.append("artistIds", artists.join(","));
    if (genres) url.searchParams.append("genreIds", genres.join(","));
    if (parent) url.searchParams.append("parentId", parent);

    Logger.Debug("[JellyFin API]", `Requesting ${url.pathname} with ${url.searchParams.toString()}.`);

    try {
        const response = await fetch(url, RequestOptions);

        if (!response.ok) {
            Logger.Error("[JellyFin API]", `No Response from Server (path: ${url.pathname}) ${await response.text()}.`);
            return { status: false };
        }

        var result = await response.json();

        Logger.Debug("[JellyFin API]", `Response returned ${result.Items.length} items.`);

        return { status: true, items: result.Items, index: result.StartIndex, count: result.TotalRecordCount };
    }
    catch (error) {
        if (error.name == "SyntaxError")
            Logger.Error("[JellyFin API]", `Failed to parse response from Server (path: ${url.pathname}).`);
        else
            Logger.Error("[JellyFin API]", `Failed to parse response from Server (path: ${url.pathname}).`);

        return { status: false };
    }
};

/*********************************************************************************
 * Query Endpoints
 */

const Music = async function (query, startIndex, limit) {
    const url = new URL("/Items", CONFIG.jellyfin.local);

    url.searchParams.append("Recursive", true);
    url.searchParams.append("includeItemTypes", "Audio");
    url.searchParams.append("fields", "Id,Name,RunTimeTicks,Artists,Album,AlbumId,PrimaryImageTag,IndexNumber,Genres");


    return await MakeAPIRequest(url, query, startIndex, limit);
};

const Artists = async function (query, startIndex, limit) {
    const url = new URL("/Artists", CONFIG.jellyfin.local);

    url.searchParams.append("fields", "Id,Name,PrimaryImageTag,Genres");

    return await MakeAPIRequest(url, query, startIndex, limit);
};

const Albums = async function (query, startIndex, limit) {
    const url = new URL("/Items", CONFIG.jellyfin.local);

    url.searchParams.append("includeItemTypes", "MusicAlbum");
    url.searchParams.append("fields", "Id,Name,PrimaryImageTag,Genres");

    return await MakeAPIRequest(url, query, startIndex, limit);
};

const MusicGenres = async function (query, startIndex, limit) {
    const url = new URL("/MusicGenres", CONFIG.jellyfin.local);

    url.searchParams.append("fields", "Id,Name");

    return await MakeAPIRequest(url, query, startIndex, limit);
};

const Playlists = async function (query, startIndex, limit) {
    const url = new URL("/Items", CONFIG.jellyfin.local);

    url.searchParams.append("fields", "Id,Name");
    url.searchParams.append("includeItemTypes", "Playlist");

    return await MakeAPIRequest(url, query, startIndex, limit);
};

/*********************************************************************************
 * Exports
 */

module.exports = {
    Music,
    Artists,
    Albums,
    MusicGenres,
    Playlists
};