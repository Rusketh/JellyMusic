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
    PreviousButtonHandler
};