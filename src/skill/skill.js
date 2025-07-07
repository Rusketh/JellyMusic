const Alexa = require('ask-sdk-core');

//https://github.com/alexa-samples/skill-sample-nodejs-audio-player/blob/mainline/lambda/index.js

/*********************************************************************************
 * Load Handlers
 */

const { PlaybackNearlyFinishedHandler } = require("./music-handlers.js");

/*********************************************************************************
 * Load Intents
 */

const { CancelIntent, StopIntent, NextIntent } = require("./control-intents.js");

const { PlayAlbumIntent } = require("./album-intents.js");

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
        PlayAlbumIntent,
        CancelIntent,
        StopIntent,
        NextIntent
    //).addErrorHandlers(
    //    ErrorHandler
    ).create();

/*********************************************************************************
 * Exports
 */

module.exports = skill;