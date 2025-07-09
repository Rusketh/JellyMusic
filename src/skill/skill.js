const Alexa = require('ask-sdk-core');

/*********************************************************************************
 * Load Handler & Intents
 */

const ControlHandlers = require("./control-handlers.js");

const ControlIntents = require("./control-intents.js");

const AlbumIntents = require("./album-intents.js");

const ArtistIntents = require("./artist-intents.js");

const SongIntents = require("./song-intents.js");

const PlaylistIntents = require("./playlist-intents.js");

/*********************************************************************************
 * Error Handler
 */

const ErrorHandler = {
    canHandle: () => true,
    handle: function (handlerInput, error)
    {
        const {responseBuilder} = handlerInput;

        const type = Alexa.getRequestType(handlerInput.requestEnvelope);

        console.error(`Error handled: ${type}`);
        console.error(error);

        const speach = "I'm sorry Dave, but I can't let you do that.";
        return handlerInput.responseBuilder.speak(speach).getResponse();
    }
};

/*********************************************************************************
 * Create Skill
 */

const skill = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        ControlHandlers.LaunchHandler,
        ControlHandlers.PlaybackNearlyFinishedHandler,
        ControlHandlers.PlaybackStoppedHandler,
        ControlHandlers.PlaybackStartedHandler,
        ControlHandlers.PlayButtonHandler,
        ControlHandlers.PauseButtonHandler,
        ControlHandlers.NextButtonHandler,
        ControlHandlers.PreviousButtonHandler,

        ControlIntents.StopIntent,
        ControlIntents.CancelIntent,
        ControlIntents.PauseIntent,
        ControlIntents.ResumeIntent,
        ControlIntents.NextIntent,
        ControlIntents.PreviousIntent,

        AlbumIntents.PlayAlbumIntent,
        ArtistIntents.PlayArtistIntent,
        PlaylistIntents.PlayPlaylistIntent,
        SongIntents.PlaySongIntent,

        AlbumIntents.ShuffleAlbumIntent,
        ArtistIntents.ShuffleArtistIntent,
        PlaylistIntents.ShufflePlaylistIntent,

        AlbumIntents.QueueAlbumIntent,
        ArtistIntents.QueueArtistIntent,
        PlaylistIntents.QueuePlaylistIntent,
        SongIntents.QueueSongIntent

    ).addErrorHandlers(
        ErrorHandler
    ).create();

/*********************************************************************************
 * Exports
 */

module.exports = skill;