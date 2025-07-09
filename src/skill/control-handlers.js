const AlexaQueue = require("../queue/alexa-queque.js");

const { CreateHandler } = require("./alexa-helper.js");

/*********************************************************************************
 * Launch App
 */

const LaunchHandler = CreateHandler(
    "LaunchRequest",
    AlexaQueue.ClearQueue
);

/*********************************************************************************
 * Playback Nearly Finished
 */

const PlaybackNearlyFinishedHandler = CreateHandler(
    "AudioPlayer.PlaybackNearlyFinished",
    AlexaQueue.QueueNext
);

/*********************************************************************************
 * Playback Nearly Finished
 */

const PlaybackStoppedHandler = CreateHandler(
    "AudioPlayer.PlaybackStopped",
    AlexaQueue.Stop
);

/*********************************************************************************
 * Playback Nearly Finished
 */

const PlaybackStartedHandler = CreateHandler(
    "AudioPlayer.PlaybackStarted",
    AlexaQueue.Start
);

/*********************************************************************************
 * Play Button Handler
 */

const PlayButtonHandler = CreateHandler(
    "PlaybackController.PlayCommandIssued",
    AlexaQueue.Resume
);

/*********************************************************************************
 * Pause Button Handler
 */

const PauseButtonHandler = CreateHandler(
    "PlaybackController.PauseCommandIssued",
    AlexaQueue.Pause
);

/*********************************************************************************
 * Next Button Handler
 */

const NextButtonHandler = CreateHandler(
    "PlaybackController.NextCommandIssued",
    AlexaQueue.PlayNext
);

/*********************************************************************************
 * Previous Button Handler
 */

const PreviousButtonHandler = CreateHandler(
    "PlaybackController.PreviousCommandIssued",
    AlexaQueue.PlayPrevious
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