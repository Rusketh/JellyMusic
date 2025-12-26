const PlayList = require("./playlist.js");

const Alexa = require('ask-sdk-core');

const fs = require("fs");
const Log = require('../logger.js');

/*********************************************************************************
 * Device Playlists
 */

const devices = { };

const All = () => Object.values(devices);

const getPlayList = function(device)
{
    if (devices[device]) return devices[device];

    Log.debug(`Registering new device: ${device}`);

    const playlist = PlayList.new(device);

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

    console.debug("Playback nearly finished!");

    const directive = playlist.getPlayNextDirective(handlerInput);

    if (!directive || !playlist.Validate(directive, handlerInput)) return responseBuilder.getResponse();

    return responseBuilder.addAudioPlayerPlayDirective(...directive).getResponse();
};

/*********************************************************************************
 * 
 */

const onQueueFinished = function(handlerInput, speak)
{
    const { responseBuilder } = handlerInput;

    console.debug("Playback queue finished!");

    if (speak)
    {
        const speach = "There are no more songs left in the queue.";
        
        return responseBuilder.speak(speach).getResponse();
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

    var directive = playlist.getPlayDirective(handlerInput);

    console.debug("Playback failed!");

    if (!directive) return responseBuilder.getResponse();

    if (playlist.Validate(directive, handlerInput))
        return responseBuilder.addAudioPlayerPlayDirective(...directive).getResponse();
        
    console.debug("Moving to next song.");

    const next = playlist.getNextItem();

    if (!next) return onQueueFinished(handlerInput); //responseBuilder.getResponse();

    directive = next.getPlayDirective(directive, handlerInput);

    if (!directive || !playlist.Validate(directive, handlerInput)) return responseBuilder.getResponse();

    return responseBuilder.addAudioPlayerPlayDirective(...directive).getResponse();
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

    console.debug("Playback started!");

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

    console.debug("Playback finished!");

    const directive = playlist.getPlayNextDirective(handlerInput);

    if (!playlist.nextItem()) //Moves up the queue.
        return onQueueFinished(handlerInput);

    if (!directive || !playlist.Validate(directive, handlerInput)) return responseBuilder.getResponse();

    return responseBuilder.addAudioPlayerPlayDirective(...directive).getResponse();
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

    console.debug("Playback stopped!");

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

    return responseBuilder.getResponse();
};

/*********************************************************************************
 * 
 */

const doPause = function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const playlist = getPlayList(deviceID);

    playlist.pause(requestEnvelope.context.AudioPlayer.offsetInMilliseconds);

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

    const directive = playlist.getPlayDirective();

    if (!directive) return responseBuilder.getResponse();

    return responseBuilder.addAudioPlayerPlayDirective(...directive).getResponse();
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

    return responseBuilder.addAudioPlayerStopDirective().getResponse();
};


/*********************************************************************************
 * 
 */

const doPlayCurrent = function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const playlist = getPlayList(deviceID);

    const current = playlist.getCurrentItem();

    if (!current) return responseBuilder.getResponse();

    const directive = current.getPlayDirective();

    return responseBuilder.addAudioPlayerPlayDirective(...directive).getResponse();
};

/*********************************************************************************
 * 
 */

const doPlayNext = function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const playlist = getPlayList(deviceID);

    const next = playlist.getNextItem();

    if (!next || !playlist.nextItem())
        return onQueueFinished(handlerInput, true); //responseBuilder.getResponse();

    const directive = next.getPlayDirective();

    return responseBuilder.addAudioPlayerPlayDirective(...directive).getResponse();
};

/*********************************************************************************
 * 
 */

const doPlayPrevious = function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const playlist = getPlayList(deviceID);

    const previous = playlist.getPreviousItem();

    if (!previous || !playlist.previousItem())
        return responseBuilder.getResponse();

    const directive = previous.getPlayDirective();

    return responseBuilder.addAudioPlayerPlayDirective(...directive).getResponse();
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
    doPlayPrevious
};