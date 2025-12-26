const { CreateHandler } = require("./alexa-helper.js");

const Devices = require("../playlist/devices.js");

/*********************************************************************************
 * Launch App
 */

const LaunchHandler = CreateHandler(
    "LaunchRequest",
    Devices.onLaunch
);

/*********************************************************************************
 * Playback Nearly Finished
 */

const PlaybackFailedHandler = CreateHandler(
    "AudioPlayer.PlaybackFailed",
    Devices.onPlaybackFailed
);

/*********************************************************************************
 * Playback Nearly Finished
 */

const PlaybackNearlyFinishedHandler = CreateHandler(
    "AudioPlayer.PlaybackNearlyFinished",
    Devices.onPlaybackNearlyFinished
);

/*********************************************************************************
 * Playback Started
 */

const PlaybackFinishedHandler = CreateHandler(
    "AudioPlayer.PlaybackFinished",
    Devices.onPlaybackFinished
);

/*********************************************************************************
 * Playback Stopped
 */

const PlaybackStoppedHandler = CreateHandler(
    "AudioPlayer.PlaybackStopped",
    Devices.onPlaybackStopped
);

/*********************************************************************************
 * Playback Started
 */

const PlaybackStartedHandler = CreateHandler(
    "AudioPlayer.PlaybackStarted",
    Devices.onPlaybackStarted
);

/*********************************************************************************
 * Play Button Handler
 */

const PlayButtonHandler = CreateHandler(
    "PlaybackController.PlayCommandIssued",
    Devices.doResume
);

/*********************************************************************************
 * Pause Button Handler
 */

const PauseButtonHandler = CreateHandler(
    "PlaybackController.PauseCommandIssued",
    Devices.doPause
);

/*********************************************************************************
 * Next Button Handler
 */

const NextButtonHandler = CreateHandler(
    "PlaybackController.NextCommandIssued",
    Devices.doPlayNext
);

/*********************************************************************************
 * Previous Button Handler
 */

const PreviousButtonHandler = CreateHandler(
    "PlaybackController.PreviousCommandIssued",
    Devices.doPlayPrevious
);

/*********************************************************************************
 * System Exception Encountered
 *
 * This handler is triggered when Alexa reports a runtime exception that occurred
 * during audio playback or skill execution (for example, AudioPlayer failures).
 *
 * These requests do NOT have a session and do NOT expect speech or directives.
 * The correct behavior is to acknowledge the event and return an empty response
 * to prevent the SDK from throwing "Unable to find a suitable request handler".
 *
 * No recovery or user-facing response is performed here by design.
 */
const ExceptionEncounteredHandler = CreateHandler(
    "System.ExceptionEncountered",
    async (handlerInput) => handlerInput.responseBuilder.getResponse()
);

/*********************************************************************************
 * Session Ended
 *
 * Alexa sends this request when the session is ending (user exits, timeout,
 * or after certain AudioPlayer flows). These requests do not require speech.
 * Returning an empty response prevents "Unable to find a suitable request handler".
 */
const SessionEndedHandler = CreateHandler(
    "SessionEndedRequest",
    async (handlerInput) => handlerInput.responseBuilder.getResponse()
);

/*********************************************************************************
 * Exports
 */

module.exports = {
    LaunchHandler,
    PlaybackFailedHandler,
    PlaybackNearlyFinishedHandler,
    PlaybackFinishedHandler,
    PlaybackStoppedHandler,
    PlaybackStartedHandler,
    PlayButtonHandler,
    PauseButtonHandler,
    NextButtonHandler,
    SessionEndedHandler,
    PreviousButtonHandler
};