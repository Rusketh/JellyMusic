const { ClearQueue, Stop, Start, Resume, Pause, QueueNext, PlayNext, PlayPrevious } = require("../queue/alexa-queque.js");

const { CreateHandler } = require("./alexa-helper.js");

/*********************************************************************************
 * Launch App
 */

const LaunchHandler = CreateHandler(
    "LaunchRequest",
    ClearQueue
);

/*********************************************************************************
 * Playback Nearly Finished
 */

const PlaybackNearlyFinishedHandler = CreateHandler(
    "AudioPlayer.PlaybackNearlyFinished",
    QueueNext
);

/*********************************************************************************
 * Playback Nearly Finished
 */

const PlaybackStoppedHandler = CreateHandler(
    "AudioPlayer.PlaybackStopped",
    Stop
);

/*********************************************************************************
 * Playback Nearly Finished
 */

const PlaybackStartedHandler = CreateHandler(
    "AudioPlayer.PlaybackStarted",
    Start
);

/*********************************************************************************
 * Play Button Handler
 */

const PlayButtonHandler = CreateHandler(
    "PlaybackController.PlayCommandIssued",
    Resume
);

/*********************************************************************************
 * Pause Button Handler
 */

const PauseButtonHandler = CreateHandler(
    "PlaybackController.PauseCommandIssued",
    Pause
);

/*********************************************************************************
 * Next Button Handler
 */

const NextButtonHandler = CreateHandler(
    "PlaybackController.NextCommandIssued",
    PlayNext
);

/*********************************************************************************
 * Previous Button Handler
 */

const PreviousButtonHandler = CreateHandler(
    "PlaybackController.PreviousCommandIssued",
    PlayPrevious
);

/*********************************************************************************
 * Exports
 */

module.exports = {
    LaunchHandler,
    PlaybackNearlyFinishedHandler,
    PlaybackStoppedHandler,
    PlaybackStartedHandler,
    PlayButtonHandler,
    PauseButtonHandler,
    NextButtonHandler,
    PreviousButtonHandler
};