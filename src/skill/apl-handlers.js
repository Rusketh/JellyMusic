const { CreateAPLEventHandler } = require("./alexa-helper.js");

const Devices = require("../playlist/devices.js");

/*********************************************************************************
 * APL Handlers: Device Control
 */

const PlaybackPaused = CreateAPLEventHandler(
    "onPlaybackPaused",
    Devices.doPause
);

const PlaybackStarted = CreateAPLEventHandler(
    "onPlaybackStarted",
    Devices.onPlaybackStarted
);

const PlaybackFinished = CreateAPLEventHandler(
    "onPlaybackFinished",
    Devices.onPlaybackFinished
);

const PlaybackFailed = CreateAPLEventHandler(
    "onPlaybackFailed",
    Devices.onPlaybackFailed
);

const PlayPrevious = CreateAPLEventHandler(
    "onPlayPrevious",
    Devices.doPlayPrevious
);

const PlayNext = CreateAPLEventHandler(
    "onPlayNext",
    Devices.doPlayNext
);

//Devices.onPlaybackStopped

/*********************************************************************************
 * Exports
 */

module.exports = {
    PlaybackPaused,
    PlaybackStarted,
    PlaybackFinished,
    PlaybackFailed,
    PlayPrevious,
    PlayNext
};
