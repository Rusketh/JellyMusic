const PlayList = require("./playlist.js");

const Alexa = require('ask-sdk-core');

/*********************************************************************************
 * Device Playlists
 */

const devices = { };

const getPlayList = function(device)
{
    if (devices[device]) return devices[device];

    console.log(`Registering new device: ${device}`);

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

    const directive = playlist.getPlayNextDirective();

    console.debug("Playback nearly finished!");

    if (!directive) return responseBuilder.getResponse();

    return responseBuilder.addAudioPlayerPlayDirective(...directive).getResponse();
};

/*********************************************************************************
 * 
 */

const onPlaybackFailed = function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const playlist = getPlayList(deviceID);

    const directive = playlist.getPlayDirective();

    console.debug("Playback failed!");

    if (!directive) return responseBuilder.getResponse();

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

    const directive = playlist.getPlayNextDirective();

    console.debug("Playback finished!");

    if (!directive) return responseBuilder.getResponse();

    playlist.nextItem();

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
        return responseBuilder.getResponse();

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