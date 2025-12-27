const Alexa = require('ask-sdk-core');

const AudioPlayer = require("./audio-player.js");

const VisualPlayer = require("./visual-player.js");

const SupportsAPL = function(handlerInput)
{
    return Alexa.getSupportedInterfaces(handlerInput.requestEnvelope)['Alexa.Presentation.APL'];
};

const PlayItem = function(handlerInput, playlist, item)
{
    if (SupportsAPL(handlerInput))
        return VisualPlayer.PlayItem(handlerInput, playlist, item);

    return AudioPlayer.PlayItem(handlerInput, playlist, item);
};

const EnqueueItem = function(handlerInput, playlist, item)
{
    if (SupportsAPL(handlerInput))
        return VisualPlayer.EnqueueItem(handlerInput, playlist, item);

    return AudioPlayer.EnqueueItem(handlerInput, playlist, item);
};

const StopPlayback = function(handlerInput)
{
    if (SupportsAPL(handlerInput))
        return VisualPlayer.StopPlayback(handlerInput);

    return AudioPlayer.StopPlayback(handlerInput);
}

const EndSession = function(handlerInput, playlist)
{
    if (SupportsAPL(handlerInput))
        return VisualPlayer.EndSession(handlerInput, playlist);

    return AudioPlayer.EndSession(handlerInput, playlist);
}

module.exports = {
    SupportsAPL,
    PlayItem,
    EnqueueItem,
    StopPlayback,
    EndSession
};