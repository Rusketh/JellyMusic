const Config = require("../config.json");

const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api");

const MusicQueue = require("../music-queue.js");

const { CreateIntent } = require("./alexa-helper.js");

/*********************************************************************************
 * Process Intent: Get Arist Intent
 */

const ProcessIntent = async function(handlerInput, action = "play") 
{
    const { requestEnvelope } = handlerInput;
    const intent = requestEnvelope.request.intent;
    const slots = intent.slots;

    if (slots.songname && slots.songname.value)
    {
        const speach1 = `Which song would you like to ${action}?`;
        const speach2 = `I didn't catch the song name. ${speach1}`;
        return {status: false, speach1, speach2};
    }

    const songs = await JellyFin.Music(slots.songname.value);

    if (!songs.status || !songs.items[0])
    {
        const speach1 = `Which song would you like to ${action}?`;
        const speach2 = `I didn't find a song called ${slots.songname.value}. ${speach1}`;
        return {status: false, speach1, speach2};
    }

    return {status: true, song: songs.items[0]};
};
/*********************************************************************************
 * Create Album Intent Handler
 */

const CreateSongIntent = function(intent, action, callback)
{
    return CreateIntent(
        intent,
        async function (handlerInput)
        {
            const { responseBuilder } = handlerInput;

            const result = await ProcessIntent(handlerInput, action);

            if (!result.status)
            {
                var {speach1, speach2} = result;
                
                if (speach1 && speach2)
                {
                    console.warn(`Intent("${intent}"): ${speach2}`);
                    return responseBuilder.speak(speach2).reprompt(speach1).getResponse();
                }

                if (speach1)
                {
                    console.warn(`Intent("${intent}"): ${speach1}`);
                    return responseBuilder.speak(speach1).getResponse();
                }

                console.warn(`Intent("${intent}"): No response.`);
                return responseBuilder.getResponse();
            }

            return await callback(handlerInput, result);
        }
    );
};

/*********************************************************************************
 * Play Artist Intent
 */

const PlaySongIntent = CreateSongIntent(
    "PlaySongIntent", "play",
    async function (handlerInput, {song})
    {
        const { responseBuilder } = handlerInput;
        
        MusicQueue.Clear();

        MusicQueue.Push(song);

        const {url, id} = MusicQueue.Current();

        console.log("Playing: ", url);

        var speach = `Playing ${song.Name}, on ${Config.name}`;
        if (song.AlbumArtist) speach = `Playing ${song.Name} by ${song.AlbumArtist}, on ${Config.skill.name}`;

        return responseBuilder.speak(speach).addAudioPlayerPlayDirective('REPLACE_ALL', url, id, 0).getResponse();
    }
);

/*********************************************************************************
 * Exports
 */

module.exports = { PlaySongIntent };
