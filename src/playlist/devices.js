const Player = require("../players/player.js");

const PlayList = require("./playlist.js");

const Alexa = require('ask-sdk-core');

const fs = require("fs");

/*********************************************************************************
 * Device Playlists
 */

const devices = { };

const All = () => Object.values(devices);

const getPlayList = function(device)
{
    if (devices[device]) return devices[device];

    const playlist = PlayList.new(device);

    Logger.Debug(`[Device ${playlist.Id}]`, "Created new device playlist.");

    devices[device] = playlist;

    return playlist;
};

/*********************************************************************************
 * 
 */

const onLaunch = function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const playlist = getPlayList(deviceID);

    playlist.clear();

    return responseBuilder.getResponse();
};

/*********************************************************************************
 * 
 */

const onPlaybackNearlyFinished = function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const playlist = getPlayList(deviceID);

    Logger.Debug(`[Device ${playlist.Id}]`, "Playback nearly finished!");

    const item = playlist.getNextItem();

    if (!Player.EnqueueItem(handlerInput, playlist, item))
        return responseBuilder.getResponse();

    Logger.Info(`[Device ${playlist.Id}]`, `Queued ${item.Item.Name} by ${item.Item.AlbumArtist}`);

    return responseBuilder.getResponse();
};

/*********************************************************************************
 * 
 */

const onQueueFinished = function(handlerInput, speak)
{
    const { responseBuilder } = handlerInput;

    Logger.Debug(`[Device ${playlist.Id}]`, "Playback queue finished!");

    if (speak)
    {
        const speech = "There are no more songs left in the queue.";
        
        return responseBuilder.speak(speech).getResponse();
    }

    return responseBuilder.getResponse();
};

/*********************************************************************************
 * 
 */

const onPlaybackFailed = function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const playlist = getPlayList(deviceID);

    Logger.Debug(`[Device ${playlist.Id}]`, "Playback failed!");

    var item = playlist.getCurrentItem();

    if (!Player.PlayItem(handlerInput, playlist, item))
    {
        Logger.Debug(`[Device ${playlist.Id}]`, "Moving to next song.");

        item = playlist.getNextItem();

        if (!playlist.nextItem() || !Player.PlayItem(handlerInput, playlist, item))
            return onQueueFinished(handlerInput);
    }

    Logger.Info(`[Device ${playlist.Id}]`, `Playing ${item.Item.Name} by ${item.Item.AlbumArtist}`);

    return responseBuilder.getResponse();
};

/*********************************************************************************
 * 
 */

const onPlaybackStarted = function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const playlist = getPlayList(deviceID);

    playlist.start();

    Logger.Debug(`[Device ${playlist.Id}]`, "Playback started!");

    return responseBuilder.getResponse();
};

/*********************************************************************************
 * 
 */

const onPlaybackFinished = function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const playlist = getPlayList(deviceID);

    playlist.stop();

    Logger.Debug(`[Device ${playlist.Id}]`, "Playback finished!");

    if (!playlist.nextItem())
        return onQueueFinished(handlerInput);

    const item = playlist.getNextItem();

    if (!Player.PlayItem(handlerInput, playlist, item))
        return responseBuilder.getResponse();

    Logger.Info(`[Device ${playlist.Id}]`, `Playing ${item.Item.Name} by ${item.Item.AlbumArtist}`);

    return responseBuilder.getResponse();
};

/*********************************************************************************
 * 
 */

const onPlaybackStopped = function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const playlist = getPlayList(deviceID);

    playlist.stop();

    Logger.Debug(`[Device ${playlist.Id}]`, "Playback stopped!");

    return responseBuilder.getResponse();
};

/*********************************************************************************
 * 
 */

const doClear = function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const playlist = getPlayList(deviceID);

    playlist.clearRemainingItems();

    Logger.Info(`[Device ${playlist.Id}]`, "Playback Queue Cleared.");

    return responseBuilder.getResponse();
};

/*********************************************************************************
 * 
 */

const doPause = function(handlerInput, offset)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const playlist = getPlayList(deviceID);

    playlist.pause(offset || requestEnvelope.context.AudioPlayer.offsetInMilliseconds);
    
    Logger.Info(`[Device ${playlist.Id}]`, "Playback Paused.");

    Player.StopPlayback(handlerInput);

    return responseBuilder.getResponse();
};

/*********************************************************************************
 * 
 */

const doResume = function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const playlist = getPlayList(deviceID);

    const item = playlist.getCurrentItem();

    if (!Player.PlayItem(handlerInput, playlist, item))
        return responseBuilder.getResponse();

    Logger.Info(`[Device ${playlist.Id}]`, `Resuming ${item.Item.Name} by ${item.Item.AlbumArtist}`);

    return responseBuilder.getResponse();
};

/*********************************************************************************
 * 
 */

const doStop = function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;
    
    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const playlist = getPlayList(deviceID);

    playlist.clear();

    Logger.Info(`[Device ${playlist.Id}]`, "Playback Stopped.");

    Player.StopPlayback(handlerInput);

    return responseBuilder.getResponse();
};


/*********************************************************************************
 * 
 */

const doPlayCurrent = function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const playlist = getPlayList(deviceID);

    const item = playlist.getCurrentItem();

    if (!Player.PlayItem(handlerInput, playlist, item))
        return responseBuilder.getResponse();

    Logger.Info(`[Device ${playlist.Id}]`, `Playing ${item.Item.Name} by ${item.Item.AlbumArtist}`);

    return responseBuilder.getResponse();
};

/*********************************************************************************
 * 
 */

const doPlayNext = function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const playlist = getPlayList(deviceID);

    const item = playlist.getNextItem();

    if (!item || !playlist.nextItem())
        return onQueueFinished(handlerInput, true);

    if (!Player.PlayItem(handlerInput, playlist, item))
        return responseBuilder.getResponse();

    Logger.Debug(`[Device ${playlist.Id}]`, "Playing Next Item.");

    Logger.Info(`[Device ${playlist.Id}]`, `Playing ${item.Item.Name} by ${item.Item.AlbumArtist}`);

    return responseBuilder.getResponse();
};

/*********************************************************************************
 * 
 */

const doPlayPrevious = function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const playlist = getPlayList(deviceID);

    const item = playlist.getPreviousItem();

    if (!item || !playlist.previousItem())
        return responseBuilder.getResponse();

    if (!Player.PlayItem(handlerInput, playlist, item))
        return responseBuilder.getResponse();

    Logger.Debug(`[Device ${playlist.Id}]`, "Playing Previous Item.");

    Logger.Info(`[Device ${playlist.Id}]`, `Playing ${item.Item.Name} by ${item.Item.AlbumArtist}`);

    return responseBuilder.getResponse();
};

/*********************************************************************************
 * End the session
 */

const doSessionEnded = function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;
    
    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const playlist = getPlayList(deviceID);

    Player.EndSession(handlerInput, playlist);

    Logger.Debug(`[Device ${playlist.Id}]`, "Session ended.");

    return responseBuilder.getResponse();
};

/*********************************************************************************
 * Exports
 */

module.exports = {
    All,
    onLaunch,
    getPlayList,
    onPlaybackFailed,
    onPlaybackNearlyFinished,
    onPlaybackStarted,
    onPlaybackFinished,
    onPlaybackStopped,
    doClear,
    doPause,
    doResume,
    doStop,
    doPlayCurrent,
    doPlayNext,
    doPlayPrevious,
    doSessionEnded
};