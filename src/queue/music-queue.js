const Config = require("../config.json").jellyfin;

const JellyFin = require("../jellyfin-api.js");

const Queue = require("./db-queue.js");

const GAP = 10;

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

const AddItem = async function (deviceID, item, position)
{
    if (!position)
        position = (await Queue.GetLastPosition(deviceID)).position + GAP;

    const {status, queueID, itemID} = await Queue.AddToQueue(deviceID, item.Id, position);

    if (!result.status) return undefined;

    return { position, queueID, deviceID, itemID, item, url: asStreamURL(item) };
};

/*********************************************************************************
 * Add all to queue
 */

const AddItems = async function(deviceID, items, position)
{
    if (!position)
        position = (await Queue.GetLastPosition(deviceID)).position + GAP;

    const added = [];

    for(let item of items)
    {
        const result = await Queue.AddToQueue(deviceID, item.Id, position);
        
        if (result) 
        {
            position += GAP;
            added.push(result);
        }
    }

    return added;
};

/*********************************************************************************
 * Inject items (at the start of the queue).
 */

const InjectItems = async function(deviceID, items, position)
{
    if (items.length == 0)
        return {status: true};

    if (!position)
    {
        const {status, position} = await Queue.GetTrack(deviceID, true, 0);
        position = status && next ? next.position : 1;
    }
    
    var {status} = await Queue.ShiftQueue(deviceID, position, items.length);
    
    if (!status) return {status: false};
    
    var {status} = await AddItems(deviceID, items, position);
    
    if (!status) return {status: false};
    
    return {status: true};
};


/*********************************************************************************
 * Add all to queue
 */

const AddShuffledItems = async function(deviceID, items, position)
{
    if (!position)
        position = (await Queue.GetLastPosition(deviceID)).position + GAP;

    for(let item of items)
    {
        item.position = position;
        position += GAP;
    }

    Queue.ShuffleItems(items);

    const added = [];

    for(let item of items)
    {
        const result = await Queue.AddToQueue(deviceID, item.Id, item.position);
        if (result)  added.push(result);
    }

    return added;
};

/*********************************************************************************
 * Shuffle Queue
 */

const ShuffleQueue = Queue.ShuffleQueue;

/*********************************************************************************
 * Get Current Item
 */

const GetItem = async function(deviceID, isQueued = false, offset = 0)
{
    const {status, position, itemID, queueID} = await Queue.GetTrack(deviceID, isQueued, offset);

    if (!status) return undefined;

    const result = await JellyFin.Music({ids: itemID});

    if (!result || !result.items[0])
    {
        await Queue.RemoveFromQueue(deviceID, queueID);
        return undefined;
    }

    const item = result.items[0];

    return { position, queueID, deviceID, itemID, item, url: asStreamURL(item) };
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
    InjectItems,
    AddShuffledItems,
    ShuffleQueue,
    GetCurrentItem,
    GetNextItem,
    GetPreviousItem,
    Next,
    Previous
};