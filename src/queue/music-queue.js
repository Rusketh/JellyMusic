const Config = require("../config.json").jellyfin;

const JellyFin = require("../jellyfin-api.js");

const Queue = require("./db-queue.js");

/*********************************************************************************
 * Convert song to URL
 */

const asStreamURL = function(item)
{
    const url = new URL(`/Items/${item.Id}/Download`, Config.host);

    url.searchParams.append("api_key", String(Config.key));
    
    return url.toString();
};

/*********************************************************************************
 * Clear Queue
 */

const Clear = function(deviceID)
{
    return Queue.ClearQueue(deviceID);
};

/*********************************************************************************
 * Add to queue
 */

const AddItem = async function (deviceID, item)
{
    const {status, queueID, itemID} = await Queue.AddToQueue(deviceID, item.Id);

    if (!result.status) return undefined;

    return { queueID, deviceID, itemID, item, url: asStreamURL(item) };
};

/*********************************************************************************
 * Add all to queue
 */

const AddItems = async function(deviceID, items)
{
    const added = [];

    for(let item of items)
    {
        const result = await Queue.AddToQueue(deviceID, item.Id);
        
        if (result) added.push(result);
    }

    return added;
};

/*********************************************************************************
 * Get Current Item
 */


const GetItem = async function(deviceID, isQueued = false, offset = 0)
{
    const {status, itemID, queueID} = await Queue.GetTrack(deviceID, isQueued, offset);

    if (!status) return undefined;

    const result = await JellyFin.Music({ids: itemID});

    if (!result || !result.items[0])
    {
        await Queue.RemoveFromQueue(deviceID, queueID); //this probably does not need to be awaited.
        return undefined;
    }

    const item = result.items[0];

    return { queueID, deviceID, itemID, item, url: asStreamURL(item) };
};

/*********************************************************************************
 * Get Current/Next/Previous Item
 */

const GetCurrentItem = (deviceID) => GetItem(deviceID, false, 0);

const GetNextItem = (deviceID) => GetItem(deviceID, true, 0);

const GetPreviousItem = (deviceID) => GetItem(deviceID, false, 1);

/*********************************************************************************
 * Next:
 * Remove current item from the queue
 * Flag next item as not queued.
 */

const Next = async function(deviceID)
{
    const current = await GetCurrentItem(deviceID);

    const next = await GetNextItem(deviceID);

    if (next) Queue.SetQueuedStatus(deviceID, next.queueID, false);

    return [current, next];
};

/*********************************************************************************
 * Previous
 */

const Previous = async function(deviceID)
{
    const current = await GetCurrentItem(deviceID);

    if (current) Queue.SetQueuedStatus(deviceID, current.queueID, true);

    const previous = await GetPreviousItem(deviceID);

    return [current, previous];
};

/*********************************************************************************
 * Exports
 */

module.exports = {
    Clear,
    AddItem,
    AddItems,
    GetCurrentItem,
    GetNextItem,
    GetPreviousItem,
    Next,
    Previous
};