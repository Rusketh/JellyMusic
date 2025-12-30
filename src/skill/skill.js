const Alexa = require('ask-sdk-core');

/*********************************************************************************
 * Load Handler & Intents
 */

const ControlHandlers = require("./control-handlers.js");

const APLHandlers = require("./apl-handlers.js");

const ControlIntents = require("./control-intents.js");

const AlbumIntents = require("./album-intents.js");

const ArtistIntents = require("./artist-intents.js");

const SongIntents = require("./song-intents.js");

const PlaylistIntents = require("./playlist-intents.js");

const FavouriteIntents = require("./favourite-intents.js");

const GenreIntents = require("./genre-intent.js");

const QueryIntents = require("./query-intents.js");

/*********************************************************************************
 * Error Handlers
 */

const Unhandler = {
    canHandle: () => true,
    handle: function (handlerInput) {
        const { responseBuilder, requestEnvelope } = handlerInput;
        const type = Alexa.getRequestType(requestEnvelope);
        Logger.Warn(`[Alexa Skill] Unhandled request: ${type}`);
        return responseBuilder.getResponse();
    }
};

const ExceptionEncounteredHandler = {
    canHandle: (handlerInput) => Alexa.getRequestType(handlerInput.requestEnvelope) === 'System.ExceptionEncountered',
    handle: (handlerInput) => {
        const { requestEnvelope, responseBuilder } = handlerInput;
        const { cause, error } = requestEnvelope.request;
        Logger.Error(`[Alexa Skill] Exception encountered: ${cause}`);
        Logger.Error(error);
        return responseBuilder.getResponse();
    }
};

const ErrorHandler = {
    canHandle: () => true,
    handle: function (handlerInput, error) {
        Logger.Error(`[Alexa Skill] Error handled: ${error.message}`);
        Logger.Error(error);

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
        ControlHandlers.SessionEndedHandler,

        APLHandlers.PlaybackPaused,
        APLHandlers.PlaybackStarted,
        APLHandlers.PlaybackFinished,
        APLHandlers.PlaybackFailed,
        APLHandlers.PlayPrevious,
        APLHandlers.PlayNext,

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

        FavouriteIntents.PlayFavouritesIntent,
        FavouriteIntents.ShuffleFavouritesIntent,
        FavouriteIntents.QueueFavouritesIntent,

        QueryIntents.WhatThisIntent,
        ExceptionEncounteredHandler,
        Unhandler
    ).addErrorHandlers(
        ErrorHandler
    ).withSkillId(CONFIG.skill.id).create();

/*********************************************************************************
 * Exports
 */

module.exports = skill;