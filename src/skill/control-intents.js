const Alexa = require('ask-sdk-core');

const { CreateIntent } = require("./alexa-helper.js");

const AlexaQueue = require("../queue/alexa-queque.js");

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
    AlexaQueue.ClearQueue
);

/*********************************************************************************
 * Resume Intent
 */

const ResumeIntent = CreateIntent(
    "AMAZON.ResumeIntent",
    AlexaQueue.Resume
);

/*********************************************************************************
 * Pause Intent
 */

const PauseIntent = CreateIntent(
    "AMAZON.PauseIntent",
    AlexaQueue.Pause
);

/*********************************************************************************
 * Next Intent
 */

const NextIntent = CreateIntent(
    "AMAZON.NextIntent",
    AlexaQueue.PlayNext
);

/*********************************************************************************
 * Previous Intent
 */

const PreviousIntent = CreateIntent(
    "AMAZON.PreviousIntent",
    AlexaQueue.PlayPrevious
);

/*********************************************************************************
 * Previous Intent
 */

const ClearQueueIntent = CreateIntent(
    "ClearQueueIntent",
    AlexaQueue.ClearQueue
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
    NextIntent,
    ClearQueueIntent
};