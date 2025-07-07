const Alexa = require('ask-sdk-core');

const MusicQueue = require("../music-queue.js");

const { CreateIntent } = require("./alexa-helper.js");

/*********************************************************************************
 * Stop Intent
 */

const StopIntent = CreateIntent(
    "AMAZON.StopIntent",
    async function(handlerInput)
    {
        const { responseBuilder } = handlerInput;

        MusicQueue.Clear();

        console.log("Stopping and Clearing queue");

        return responseBuilder.addAudioPlayerClearQueueDirective("CLEAR_ALL").getResponse();
    }
);

const CancelIntent = CreateIntent(
    "AMAZON.CancelIntent",
    StopIntent.handle
);

/*********************************************************************************
 * Pause Intent
 */

/*********************************************************************************
 * Resume Intent
 */

/*********************************************************************************
 * Next Intent
 */

const NextIntent = CreateIntent(
    "AMAZON.NextIntent",
    async function(handlerInput)
    {
        const { responseBuilder } = handlerInput;

        const {next} = MusicQueue.Next();

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

module.exports = {
    StopIntent,
    CancelIntent,
    NextIntent
};