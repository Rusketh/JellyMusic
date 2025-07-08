const Alexa = require('ask-sdk-core');

const { CreateIntent } = require("./alexa-helper.js");

const { ClearQueue, Resume, Pause, PlayNext, PlayPrevious } = require("../queue/alexa-queque.js");

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
    ClearQueue
);

/*********************************************************************************
 * Resume Intent
 */

const ResumeIntent = CreateIntent(
    "AMAZON.ResumeIntent",
    Resume
);

/*********************************************************************************
 * Pause Intent
 */

const PauseIntent = CreateIntent(
    "AMAZON.PauseIntent",
    Pause
);

/*********************************************************************************
 * Next Intent
 */

const NextIntent = CreateIntent(
    "AMAZON.NextIntent",
    PlayNext
);

/*********************************************************************************
 * Previous Intent
 */

const PreviousIntent = CreateIntent(
    "AMAZON.PreviousIntent",
    PlayPrevious
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