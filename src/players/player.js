const AudioPlayer = require("./audio-player.js");

const VisualPlayer = require("./visual-player.js");

const SupportsAPL = function(handlerInput)
{
    return handlerInput.requestEnvelope.context.System.device.supportedInterfaces['Alexa.Presentation.APL'];
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

module.exports = {
    SupportsAPL,
    PlayItem,
    EnqueueItem,
    StopPlayback
};