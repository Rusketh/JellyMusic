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

    if (slots.artistname && slots.artistname.value)
    {
        const speach1 = `Which artist would you like to ${action}?`;
        const speach2 = `I didn't catch the artist name. ${speach1}`;
        return {status: false, speach1, speach2};
    }

    const artists = await JellyFin.Artists.Search(slots.artistname.value);
        
    if (!artists.status || !artists.items[0])
    {
        const speach1 = `Which album would you like to ${action}?`;
        const speach2 = `I didn't find an artist called ${slots.artistname.value}. ${speach1}`;
        return {status: false, speach1, speach2};
    }

    const artist = artists.items[0];

    const songs = await JellyFin.Music({artistIds: artist.Id});

    if (!songs.status || !songs.items[0])
    {
        const speach1 = `Which album would you like to ${action}?`;
        const speach2 = `I didn't find an music by the artist ${slots.artistname.value}. ${speach1}`;
        return {status: false, speach1, speach2};
    }

    return {status: true, artist, songs: songs.items};
};
/*********************************************************************************
 * Create Album Intent Handler
 */

const CreateArtistIntent = function(intent, action, callback)
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

const PlayArtistIntent = CreateArtistIntent(
    "PlayAlbumIntent", "play",
    async function (handlerInput, {artist, album, songs})
    {
        const { responseBuilder } = handlerInput;
        
        MusicQueue.Clear();

        for(var item of songs)
            MusicQueue.Push(item);

        const {url, id} = MusicQueue.Current();

        console.log("Playing: ", url);

        var speach = `Playing songs by artist ${artist.Name}, on ${Config.name}`;

        return responseBuilder.speak(speach).addAudioPlayerPlayDirective('REPLACE_ALL', url, id, 0).getResponse();
    }
);

/*********************************************************************************
 * Exports
 */

module.exports = { PlayArtistIntent };
