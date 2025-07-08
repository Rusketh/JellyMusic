const Alexa = require('ask-sdk-core');

const MusicQueue = require("../music-queue.js");

const { CreateHandler } = require("./alexa-helper.js");

/*********************************************************************************
 * Playback Nearly Finished
 */

const PlaybackNearlyFinishedHandler = CreateHandler(
    "AudioPlayer.PlaybackNearlyFinished",
    async function (handlerInput)
    {
        const { responseBuilder } = handlerInput;

        const {current, next} = MusicQueue.Next();

        if (current && next)
        {
            console.log("Enqueueing: ", next.url);
            return responseBuilder.addAudioPlayerPlayDirective('ENQUEUE', next.url, next.id, 0, current.id).getResponse();
        }

        if (next)
        {
            console.log("Playing: ", next.url);
            return responseBuilder.addAudioPlayerPlayDirective('REPLACE_ALL', next.url, next.id, 0).getResponse();
        }

        return responseBuilder.getResponse();
    }
);


/*********************************************************************************
 * Play Button Handler
 */

const PlayButtonHandler = CreateHandler(
    "PlaybackController.PlayCommandIssued",
    async function(handlerInput)
    {
        const { responseBuilder } = handlerInput;
        
        const {id, url} = MusicQueue.Current();

        if (id && url)
        {
            console.log("Resuming Music");
            return responseBuilder.addAudioPlayerPlayDirective('REPLACE_ALL', url, id, 0).getResponse();
        }

        const speach = "There are currently no track playing.";
        return responseBuilder.speak(speach).getResponse();
    }
);

/*********************************************************************************
 * Pause Button Handler
 */

const PauseButtonHandler = CreateHandler(
    "PlaybackController.PauseCommandIssued",
    async function(handlerInput)
    {
        const { responseBuilder } = handlerInput;

        console.log("Pasuing Music");

        return responseBuilder .addAudioPlayerStopDirective() .getResponse();
    }
);

/*********************************************************************************
 * Next Button Handler
 */

const NextButtonHandler = CreateHandler(
    "PlaybackController.NextCommandIssued",
    async function(handlerInput)
    {
        const { responseBuilder } = handlerInput;
        
        const {next} = MusicQueue.Next();

        if (next)
        {
            console.log("Playing: ", next.url);
            return responseBuilder.addAudioPlayerPlayDirective('REPLACE_ALL', next.url, next.id, 0).getResponse();
        }

        return responseBuilder.getResponse();
    }
);

/*********************************************************************************
 * Previous Button Handler
 */

const PreviousButtonHandler = CreateHandler(
    "PlaybackController.PreviousCommandIssued",
    async function(handlerInput)
    {
        const { responseBuilder } = handlerInput;

        const {previous} = MusicQueue.Previous();

        if (previous)
        {
            console.log("Playing: ", previous.url);
            return responseBuilder.addAudioPlayerPlayDirective('REPLACE_ALL', previous.url, previous.id, 0).getResponse();
        }

        return responseBuilder.getResponse();
    }
);

/*********************************************************************************
 * Exports
 */

module.exports = {
    PlaybackNearlyFinishedHandler,
    PlayButtonHandler,
    PauseButtonHandler,
    NextButtonHandler,
    PreviousButtonHandler
};