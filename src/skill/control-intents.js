const Alexa = require('ask-sdk-core');

const { CreateIntent } = require("./alexa-helper.js");

const Devices = require("../playlist/devices.js");
const Log = require('../logger.js');

/*********************************************************************************
 * Cancel Intent
 */

const CancelIntent = CreateIntent(
    "AMAZON.CancelIntent",
    function({ responseBuilder })
    {
        return responseBuilder.getResponse();
    }
);

/*********************************************************************************
 * Stop Intent
 */

const StopIntent = CreateIntent(
    "AMAZON.StopIntent",
    Devices.doStop
);

/*********************************************************************************
 * Resume Intent
 */

const ResumeIntent = CreateIntent(
    "AMAZON.ResumeIntent",
    Devices.doResume
);

/*********************************************************************************
 * Pause Intent
 */

const PauseIntent = CreateIntent(
    "AMAZON.PauseIntent",
    Devices.doPause
);

/*********************************************************************************
 * Next Intent
 */

const NextIntent = CreateIntent(
    "AMAZON.NextIntent",
    Devices.doPlayNext
);

/*********************************************************************************
 * Previous Intent
 */

const PreviousIntent = CreateIntent(
    "AMAZON.PreviousIntent",
    Devices.doPlayPrevious
);

/*********************************************************************************
 * Previous Intent
 */

const ClearQueueIntent = CreateIntent(
    "ClearQueueIntent",
    Devices.doClear
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