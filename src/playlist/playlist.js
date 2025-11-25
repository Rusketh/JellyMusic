const PlayListItem = require("./item.js");

/*********************************************************************************
 * Playlist Item
 */

const PlayList = { };

PlayList.new = function(device)
{
    return Object.assign({
        Device: device,
        Dirty: false,
        Position: 0,
        Queue: [ ]
    }, PlayList);
};

/*********************************************************************************
 * Cleare all items
 */

PlayList.clear = function()
{
    this.Dirty = true;
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
    this.Dirty = true;
};

/*********************************************************************************
 * Add items to the end of the queue
 */

PlayList.appendItems = function(items)
{
    items = items.map(item => PlayListItem.new(item));

    const start = this.Queue.length;

    this.Queue.splice(start, 0, ...items);

    this.Dirty = true;

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

    this.Dirty = true;

    return [start, start + items.length - 1];
};

/*********************************************************************************
 * Shuffle the remaining queue
 */

PlayList.shuffleItems = function(items)
{
    for (let i = items.length - 1; i > 0; i--)
    {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }

    return items;
};

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

    this.Dirty = true;

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

PlayList.getPlayDirective = function(handlerInput)
{
    const current = this.getCurrentItem();

    if (!current) return null;

    return current.getPlayDirective();
};

PlayList.getPlayNextDirective = function(handlerInput)
{
    const current = this.getCurrentItem();
    const next = this.getNextItem();

    if (!next) return null;

    if (!current) return next.getPlayDirective();

    return next.getPlayNextDirective(current.Playback);
};

PlayList.getPlayPreviousDirective = function(handlerInput)
{
    const current = this.getCurrentItem();
    const previous = this.getPreviousItem();

    if (!previous) return null;

    if (!current) return previous.getPlayDirective();
    
    return previous.getPlayNextDirective(current.Playback);
};


PlayList.Validate = function(directive, {attributesManager})
{
    var token = directive[2];
    /*let sessionAttributes = attributesManager.getSessionAttributes();

    if (sessionAttributes.playbackToken == token) return false;

    sessionAttributes.playbackToken = token;

    attributesManager.setSessionAttributes(sessionAttributes);*/
    
    if (this.playbackToken && this.playbackToken == token)
    {
        console.log(`Repeating token: ${token}`);
        return false;
    }

    console.log(`None repeating token: ${token}`);

    this.playbackToken = token;
    

    return true;
}

/*********************************************************************************
 * Next & Previous
 */

PlayList.nextItem = function()
{
    var index = this.Position + 1;

    if (index >= this.Queue.length - 1)
    {
        console.debug("Reached end of queue!");
        return false;
    }

    console.debug("Playlist moved up by 1.");

    this.Position = index;

    this.Dirty = true;

    return true;
}

PlayList.previousItem = function()
{
    var index = this.Position - 1;

    if (index < 0)
    {
        console.debug("Reached start of queue!");
        return false;
    }

    console.debug("Playlist moved down by 1.");

    this.Position = index;

    this.Dirty = true;

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

    this.Dirty = true;

    return current.pause(offset);
};

PlayList.resume = function()
{
    const current = this.getCurrentItem();

    if (!current) return false;

    this.Dirty = true;

    return current.resume();
};

/*********************************************************************************
 * Exports
 */

module.exports = PlayList;