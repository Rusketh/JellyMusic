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

var history = [ ];

var queue = [ ];

/*********************************************************************************
 * Clear Queue
 */

const Clear = function()
{
    history = [ ];
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
    const current = queue.shift();

    if (current) history.push(current);

    return { current, next: queue[0] };
};

/*********************************************************************************
 * Previous
 */

const Previous = function()
{
    const current = queue[0];

    const previous = history.pop();

    queue.unshift(previous);

    return { current, previous };
}

/*********************************************************************************
 * Exports
 */

module.exports = {
    Current,
    Clear,
    Push,
    Next,
    Previous
};