const Alexa = require('ask-sdk-core');

const MusicQueue = require("../music-queue.js");

const { CreateIntent } = require("./alexa-helper.js");

/*********************************************************************************
 * Cancel Intent
 */

const CancelIntent = CreateIntent(
    "AMAZON.CancelIntent",
    async function(handlerInput)
    {
        const { responseBuilder } = handlerInput;

        //In theory amazon should handel this.

        return responseBuilder.getResponse();
    }
);

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

/*********************************************************************************
 * Pause Intent
 */

const PauseIntent = CreateIntent(
    "AMAZON.PauseIntent",
    async function(handlerInput)
    {
        const { responseBuilder } = handlerInput;

        console.log("Pasuing Music");

        return responseBuilder .addAudioPlayerStopDirective() .getResponse();
    }
);

/*********************************************************************************
 * Resume Intent
 */

const ResumeIntent = CreateIntent(
    "AMAZON.ResumeIntent",
    async function(handlerInput)
    {
        const { responseBuilder } = handlerInput;

        const {id, url} = MusicQueue.Current();

        if (id && url)
        {
            console.log("Resuming Music");
            return responseBuilder.addAudioPlayerPlayDirective('REPLACE_ALL', url, id, 0).getResponse();
        }

        const speach = "There are currently no track playing.";
        return responseBuilder.speak(speach).getResponse();
    }
);

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
 * Previous Intent
 */

const PreviousIntent = CreateIntent(
    "AMAZON.PreviousIntent",
    async function(handlerInput)
    {
        const { responseBuilder } = handlerInput;

        const {previous} = MusicQueue.Previous();

        if (previous)
        {
            console.log("Playing: ", previous.url);
            return responseBuilder.addAudioPlayerPlayDirective('REPLACE_ALL', previous.url, previous.id, 0).getResponse();
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
    PauseIntent,
    PreviousIntent,
    ResumeIntent,
    NextIntent
};