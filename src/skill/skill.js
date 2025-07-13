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

const GenreIntents = require("./genre-intent.js");

/*********************************************************************************
 * Error Handler
 */

const ErrorHandler = {
    canHandle: () => true,
    handle: function (handlerInput, error)
    {
        const {responseBuilder, requestEnvelope} = handlerInput;

        if (!error && requestEnvelope.request)
            error = requestEnvelope.request.error;

        const type = Alexa.getRequestType(handlerInput.requestEnvelope);

        console.error(`Error handled: ${type}`);
        console.error(error);

        return responseBuilder.getResponse();
    }
};

/*********************************************************************************
 * Create Skill
 */

const skill = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        ControlHandlers.LaunchHandler,
        ControlHandlers.PlaybackFailedHandler,
        ControlHandlers.PlaybackNearlyFinishedHandler,
        ControlHandlers.PlaybackFinishedHandler,
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
        ControlIntents.ClearQueueIntent,

        AlbumIntents.PlayAlbumIntent,
        ArtistIntents.PlayArtistIntent,
        PlaylistIntents.PlayPlaylistIntent,
        SongIntents.PlaySongIntent,
        GenreIntents.PlayGenreIntent,

        AlbumIntents.ShuffleAlbumIntent,
        ArtistIntents.ShuffleArtistIntent,
        PlaylistIntents.ShufflePlaylistIntent,
        GenreIntents.ShuffleGenreIntent,

        AlbumIntents.QueueAlbumIntent,
        ArtistIntents.QueueArtistIntent,
        PlaylistIntents.QueuePlaylistIntent,
        SongIntents.QueueSongIntent,
        GenreIntents.QueueGenreIntent,

        ErrorHandler
    ).addErrorHandlers(
        ErrorHandler
    ).create();

/*********************************************************************************
 * Exports
 */

module.exports = skill;