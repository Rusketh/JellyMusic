const https = require('https');

const fuzzball = require('fuzzball');

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

    //isFavorite
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
            Logger.Error("[JellyFin API]", `Error getting response from Server (path: ${url.pathname}).`, error);

        return { status: false };
    }
};

/*********************************************************************************
 * Fuzzy API Request
 */

// Alexa's speech recognition often returns a slightly different spelling from the
// library (e.g. US "rumors" for the album "Rumours"), which Jellyfin's search does not
// match. When a name search finds nothing, fetch the full list of names and keep those
// that score at least FUZZY_MIN_SCORE (0-100) against what Alexa heard, best first.

const FUZZY_MIN_SCORE = 85;

const FUZZY_MAX_ITEMS = 10000;

const FuzzyAPIRequest = async function (makeURL, query, startIndex, limit) {
    const result = await MakeAPIRequest(makeURL(), query, startIndex, limit);

    if (!result.status || result.items.length || !query || !query.query || startIndex)
        return result;

    const all = await MakeAPIRequest(makeURL(), { ...query, query: undefined }, 0, FUZZY_MAX_ITEMS);

    if (!all.status)
        return result;

    const items = all.items
        .map(item => ({ item, score: fuzzball.WRatio(query.query, item.Name || "") }))
        .filter(({ score }) => score >= FUZZY_MIN_SCORE)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit || CONFIG.jellyfin.limit)
        .map(({ item }) => item);

    Logger.Debug("[JellyFin API]", `No match for "${query.query}"; fuzzy search of ${all.items.length} names found ${items.length}` + (items[0] ? `, best "${items[0].Name}".` : "."));

    return { status: true, items, index: 0, count: items.length };
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
    const makeURL = function () {
        const url = new URL("/Artists", CONFIG.jellyfin.local);

        url.searchParams.append("fields", "Id,Name,PrimaryImageTag,Genres");

        return url;
    };

    return await FuzzyAPIRequest(makeURL, query, startIndex, limit);
};

const Albums = async function (query, startIndex, limit) {
    const makeURL = function () {
        const url = new URL("/Items", CONFIG.jellyfin.local);

        url.searchParams.append("Recursive", true);
        url.searchParams.append("includeItemTypes", "MusicAlbum");
        url.searchParams.append("fields", "Id,Name,PrimaryImageTag,Genres");

        return url;
    };

    return await FuzzyAPIRequest(makeURL, query, startIndex, limit);
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
 * Query Users
 */

const Users = async function (query) {
    const url = new URL("/Users", CONFIG.jellyfin.local);

    const response = await fetch(url, RequestOptions);

    if (!response.ok) {
        Logger.Error("[JellyFin API]", `No Response from Server (path: ${url.pathname}).`);
        return { status: false };
    }

    try {
        var users = await response.json();

        if (query) {
            users.forEach(user => user.score = fuzzball.token_sort_ratio(query, user.Name));
            users = users.filter((user) => user.score > 60);
            users.sort((a, b) => b.score - a.score);
        }

        return { status: true, users };
    }
    catch (error) {
        Logger.Error("[JellyFin API]", `Error getting response from Server (path: ${url.pathname}).`, error);
        return { status: false };
    }
};

const Favourites = async function (userID, startIndex, limit) {
    const url = new URL(`/Users/${userID}/Items`, CONFIG.jellyfin.local);

    url.searchParams.append("isFavorite", true);
    url.searchParams.append("Recursive", true);
    url.searchParams.append("includeItemTypes", "Audio");
    url.searchParams.append("fields", "Id,Name,RunTimeTicks,Artists,Album,AlbumId,PrimaryImageTag,IndexNumber,Genres");

    return await MakeAPIRequest(url, {}, startIndex, limit);
};

/*********************************************************************************
 * Exports
 */

module.exports = {
    Music,
    Artists,
    Albums,
    MusicGenres,
    Playlists,
    Users,
    Favourites
};