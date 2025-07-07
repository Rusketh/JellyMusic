const Alexa = require('ask-sdk-core');

const MusicQueue = require("../music-queue.js");

const { CreateHandler } = require("./alexa-helper.js");

/*********************************************************************************
 * Playback Nearly Finished
 */

const PlaybackNearlyFinishedHandler = CreateHandler(
    "AudioPlayer.PlaybackNearlyFinished",
    async function (handlerInput)
    {
        const { responseBuilder } = handlerInput;

        const {current, next} = MusicQueue.Next();

        if (current && next)
        {
            console.log("Enqueueing: ", next.url);
            return responseBuilder.addAudioPlayerPlayDirective('ENQUEUE', next.url, next.id, 0, current.id).getResponse();
        }

        if (next)
        {
            console.log("Playing: ", next.url);
            return responseBuilder.addAudioPlayerPlayDirective('REPLACE_ALL', next.url, next.id, 0).getResponse();
        }

        return responseBuilder.getResponse();
    }
);

/*********************************************************************************
 * Exports
 */

module.exports = { PlaybackNearlyFinishedHandler };