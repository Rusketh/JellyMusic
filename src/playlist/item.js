const crypto = require("node:crypto");

const Alexa = require('ask-sdk-core');
const Log = require('../logger.js');

/*********************************************************************************
 * Playlist Item
 */

const PlayListItem = { };

PlayListItem.new = function(item, token)
{
    return Object.assign({
        Item:
        {
            Id: item.Id,
            Name: item.Name,
            Album: item.Albu,
            AlbumId: item.AlbumId,
            AlbumArtist: item.AlbumArtist,
            AlbumPrimaryImageTag: item.AlbumPrimaryImageTag
        },
        Playback:
        {
            Token: token || crypto.randomUUID(),
            IsPlaying: false,
            IsPaused: false,
            Offset: 0
        }
    }, PlayListItem);
};

/*********************************************************************************
 * getStreamURL
 * Gets the streaming url from an items meta data
 */

PlayListItem.getStreamURL = function()
{
    // Universal audio endpoint supports direct play OR transcoding
    const url = new URL(`/Audio/${this.Item.Id}/universal`, CONFIG.jellyfin.host);

    url.searchParams.append("api_key", String(CONFIG.jellyfin.key));

    // Force a widely supported format for Alexa
    url.searchParams.append("AudioCodec", "mp3");
    url.searchParams.append("Container", "mp3");
    url.searchParams.append("TranscodingContainer", "mp3");

    // Optional: cap bitrate (helps stability)
    url.searchParams.append("MaxStreamingBitrate", "192000");

    const finalUrl = url.toString();
    Log.trace('[Stream] Generated stream URL:', Log.redactUrl(finalUrl));
    return finalUrl;
};

/*********************************************************************************
 * getArtURL
 * Gets the art url from an items meta data
 */

PlayListItem.getArtURL = function()
{
    if (!this.Item.AlbumId) return;

    const url = new URL(`Items/${this.Item.AlbumId}/Images/Primary`, CONFIG.jellyfin.host);
    if (this.Item.AlbumPrimaryImageTag) url.searchParams.append("tag", this.Item.AlbumPrimaryImageTag);

    return url.toString();
};

/*********************************************************************************
 * getMetadata
 * Gets the metadata for Alexa
 */

PlayListItem.getMetaData = function()
{
    const object = { };

    object.title = this.Item.Name;
    object.subtitle = this.Item.AlbumArtist;

    if (this.Item.AlbumId)
        object.art = new Alexa.ImageHelper().addImageInstance(this.getArtURL()).getImage();
    
    return object;
};

/*********************************************************************************
 * getPlayDirective
 * Gets the arguments for addAudioPlayerPlayDirective to play now
 */

PlayListItem.getPlayDirective = function()
{
    console.debug(`getPlayDirective: ${this.Item.Name} -> ${this.Playback.Token}`);

    return [
        'REPLACE_ALL',
        this.getStreamURL(),
        this.Playback.Token,
        this.Playback.Offset,
        null,
        this.getMetaData()
    ];
};

/*********************************************************************************
 * getPlayDirective
 * Gets the arguments for addAudioPlayerPlayDirective to play now
 */

PlayListItem.getPlayNextDirective = function({Token})
{
    console.debug(`getPlayNextDirective: ${this.Item.Name} -> ${this.Playback.Token}`);

    return [
        'ENQUEUE',
        this.getStreamURL(),
        this.Playback.Token,
        this.Playback.Offset,
        Token,
        this.getMetaData()
    ];
};

/*********************************************************************************
 * Start Playing
 */

PlayListItem.start = function() 
{
    this.Playback.IsPlaying = true;
    this.Playback.IsPaused = false;
    this.Playback.Offset = 0
};

/*********************************************************************************
 * Stop
 */

PlayListItem.stop = function() 
{
    this.Playback.IsPlaying = false;
    this.Playback.IsPaused = false;
    this.Playback.Offset = 0
};

/*********************************************************************************
 * Pause & Resume Playing
 */

PlayListItem.pause = function(offset) 
{
    this.Playback.IsPaused = true;
    this.Playback.Offset = offset || 0
};

PlayListItem.resume = function() 
{
    this.Playback.IsPaused = false;
};

/*********************************************************************************
 * Exports
 */

module.exports = PlayListItem;