const Config = require("./config.json").jellyfin;

const Crypto = require("node:crypto");

/*********************************************************************************
 * Convert song to URL
 */

const asStreamURL = function(song)
{
    const url = new URL(`/Items/${song.Id}/Download`, Config.host);

    url.searchParams.append("api_key", String(Config.key));
    
    return url.toString();
};

/*********************************************************************************
 * Create a Playlist
 */

var queue = [ ];

/*********************************************************************************
 * Clear Queue
 */

const Clear = function()
{
    queue = [ ];
};

/*********************************************************************************
 * Add to queue
 */

const Push = function(item)
{
    const entry = {item, id: Crypto.randomUUID(), url: asStreamURL(item)};

    queue.push(entry)

    return entry;
};

/*********************************************************************************
 * Next
 */

const Current = function()
{
    return queue[0];
};

/*********************************************************************************
 * Next
 */

const Next = function()
{
    return { current : queue.shift(), next: queue[0] };
};

/*********************************************************************************
 * Exports
 */

module.exports = {
    Current,
    Clear,
    Push,
    Next
};