const crypto = require("node:crypto");

const Alexa = require('ask-sdk-core');

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
            Album: item.Album,
            AlbumId: item.AlbumId,
            AlbumArtist: item.AlbumArtist,
            AlbumPrimaryImageTag: item.AlbumPrimaryImageTag
        },
        Playback:
        {
            Token: token || crypto.randomUUID(),
            Runtime: item.RunTimeTicks / 10000,
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
    const url = new URL(`/Audio/${this.Item.Id}/stream`, CONFIG.jellyfin.host);

    url.searchParams.append("api_key", String(CONFIG.jellyfin.key));
    url.searchParams.append("container", "mp3");
    url.searchParams.append("audioCodec", "mp3");
    url.searchParams.append("transcodingContainer", "mp3");
    url.searchParams.append("transcodingProtocol", "http");
    url.searchParams.append("maxStreamingBitrate", "192000");

    return url.toString();
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