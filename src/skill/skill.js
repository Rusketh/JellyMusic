const Alexa = require('ask-sdk-core');

//https://github.com/alexa-samples/skill-sample-nodejs-audio-player/blob/mainline/lambda/index.js

/*********************************************************************************
 * Music Handlers
 */

const {
    PlaybackNearlyFinishedHandler,
    PlayButtonHandler,
    PauseButtonHandler,
    NextButtonHandler,
    PreviousButtonHandler
} = require("./music-handlers.js");

/*********************************************************************************
 * Control Intents
 */

const {
    StopIntent,
    CancelIntent,
    PauseIntent,
    ResumeIntent,
    NextIntent,
    PreviousIntent
} = require("./control-intents.js");

/*********************************************************************************
 * Album Intents
 */

const { PlayAlbumIntent } = require("./album-intents.js");

/*********************************************************************************
 * Artist Intents
 */

const { PlayArtistIntent } = require("./artist-intents.js");

/*********************************************************************************
 * Song Intents
 */

const { PlaySongIntent } = require("./song-intents.js");

/*********************************************************************************
 * Playlist Intents
 */

const { PlayPlaylistIntent } = require("./playlist-intents.js");

/*********************************************************************************
 * Error Handler
 */

const ErrorHandler = {
    canHandle: () => true,
    handle: function ({responseBuilder}, error)
    {
        console.error(`Error handled:`);
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
        PlaybackNearlyFinishedHandler,
        PlayButtonHandler,
        PauseButtonHandler,
        NextButtonHandler,
        PreviousButtonHandler,

        PlayAlbumIntent,

        PlayArtistIntent,

        PlaySongIntent,

        PlayPlaylistIntent,

        StopIntent,
        CancelIntent,
        PauseIntent,
        ResumeIntent,
        NextIntent,
        PreviousIntent
    //).addErrorHandlers(
    //    ErrorHandler
    ).create();

/*********************************************************************************
 * Exports
 */

module.exports = skill;