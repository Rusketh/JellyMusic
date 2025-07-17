const PlayListItem = require("./item.js");

/*********************************************************************************
 * Playlist Item
 */

const PlayList = { };

PlayList.new = function(device)
{
    return Object.assign({
        Device: device,
        Position: 0,
        Queue: [ ]
    }, PlayList);
};

/*********************************************************************************
 * Cleare all items
 */

PlayList.clear = function()
{
    this.Position = 0;
    this.Queue = [];
};

/*********************************************************************************
 * Cleare items from the rest of the queue
 */

PlayList.clearRemainingItems = function()
{
    const start = this.Position + 1;

    if (start >= this.Queue.length)
        return;
    
    this.Queue = this.Queue.splice(start);
};

/*********************************************************************************
 * Add items to the end of the queue
 */

PlayList.appendItems = function(items)
{
    items = items.map(item => PlayListItem.new(item));

    const start = this.Queue.length;

    this.Queue.splice(start, 0, ...items);

    return [start, this.Queue.length];
};

/*********************************************************************************
 * Add items to the start of the queue
 */

PlayList.prefixItems = function(items, start)
{
    start = start || this.Position + 1;

    if (start >= this.Queue.length - 1) start = this.Queue.length - 1;

    if (start <= 0) start = 0;

    items = items.map(item => PlayListItem.new(item));

    this.Queue.splice(start, 0, ...items);

    return [start, start + items.length - 1];
};

/*********************************************************************************
 * Shuffle the remaining queue
 */

PlayList.shuffleRemainingItems = function(start, stop)
{
    start = start || this.Position + 1;
    stop = stop || this.Queue.length - 1;

    if (start >= this.Position + 1)
        start = this.Position + 1;

    if (stop > this.Queue.length - 1)
        stop = this.Queue.length - 1;

    if (start >= this.Queue.length - 1)
        return;

    for (let i = stop; i > start; i--)
    {
        const j = Math.floor(Math.random() * (i - start + 1)) + start;
        [this.Queue[i], this.Queue[j]] = [this.Queue[j], this.Queue[i]];
    }

    return [start, stop];
};

/*********************************************************************************
 * Get Current Track
 */

PlayList.getCurrentItem = function()
{
    return this.Queue[this.Position];
};

/*********************************************************************************
 * Get Previous Track
 */

PlayList.getPreviousItem = function()
{
    return this.Queue[this.Position - 1];
};

/*********************************************************************************
 * Get Next Track
 */

PlayList.getNextItem = function()
{
    return this.Queue[this.Position + 1];
};

/*********************************************************************************
 * getPlayDirective
 * Gets the arguments for addAudioPlayerPlayDirective to play a track
 */

PlayList.getPlayDirective = function()
{
    const current = this.getCurrentItem();

    if (!current) return null;

    return current.getPlayDirective();
};

PlayList.getPlayNextDirective = function()
{
    const current = this.getCurrentItem();
    const next = this.getNextItem();

    if (!next) return null;

    if (!current) return next.getPlayDirective();

    return next.getPlayNextDirective(current.Playback);
};

PlayList.getPlayPreviousDirective = function()
{
    const current = this.getCurrentItem();
    const previous = this.getPreviousItem();

    if (!previous) return null;

    if (!current) return previous.getPlayDirective();
    
    return previous.getPlayNextDirective(current.Playback);
};

/*********************************************************************************
 * Next & Previous
 */

PlayList.nextItem = function()
{
    var index = this.Position + 1;

    if (index >= this.Queue.length - 1) return false;

    this.Position = index;

    return true;
}

PlayList.previousItem = function()
{
    var index = this.Position - 1;

    if (index < 0) return false;

    this.Position = index;

    return true;
}

/*********************************************************************************
 * Pass Start, Stop, Pause & Resume to playlist item
 */

PlayList.start = function()
{
    const current = this.getCurrentItem();

    if (!current) return false;

    return current.start();
};

PlayList.stop = function()
{
    const current = this.getCurrentItem();

    if (!current) return false;

    return current.stop();
};

PlayList.pause = function(offset)
{
    const current = this.getCurrentItem();

    if (!current) return false;

    return current.pause(offset);
};

PlayList.resume = function()
{
    const current = this.getCurrentItem();

    if (!current) return false;

    return current.resume();
};

/*********************************************************************************
 * Exports
 */

module.exports = PlayList;