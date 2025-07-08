const Config = require("../config.json");

const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api");

const { SetQueue } = require("../queue/alexa-queque.js");

const { CreateIntent } = require("./alexa-helper.js");

/*********************************************************************************
 * Process Intent: Get Song Intent
 */

const ProcessIntent = async function(handlerInput, action = "play") 
{
    const { requestEnvelope } = handlerInput;
    const intent = requestEnvelope.request.intent;
    const slots = intent.slots;

    if (!slots.songname || !slots.songname.value)
    {
        const speach1 = `Which song would you like to ${action}?`;
        const speach2 = `I didn't catch the song name. ${speach1}`;
        return {status: false, speach1, speach2};
    }

    console.log(`Requesting Song: ${slots.songname.value}`);

    const songs = await JellyFin.Music.Search(slots.songname.value);

    if (!songs.status || !songs.items[0])
    {
        const speach1 = `Which song would you like to ${action}?`;
        const speach2 = `I didn't find a song called ${slots.songname.value}. ${speach1}`;
        return {status: false, speach1, speach2};
    }

    var artist = undefined;
    var song = songs.items[0];

    if (slots.artistname && slots.artistname.value)
    {
        console.log(`Requesting Artist for Song: ${slots.artistname.value}`);

        const artists = await JellyFin.Artists.Search(slots.artistname.value);
        
        if (!artists.status || !artists.items[0])
        {
            const speach1 = `Which song would you like to ${action}?`;
            const speach2 = `I didn't find an artist called ${slots.artistname.value}. ${speach1}`;
            return {status: false, speach1, speach2};
        }

        artist = artists.items[0];

        if (song.AlbumArtist && song.AlbumArtist.toLowerCase() != artist.Name.toLowerCase())
        {

            song = undefined;

            for (var item of songs.items)
            {
                if (item.AlbumArtist && item.AlbumArtist.toLowerCase() == artist.Name.toLowerCase())
                {
                    console.log("Found ", item.Name);
                    album = item;
                    break;
                }
            }

            if (!song)
            {
                song = songs.items[0];
                
                if (song && song.AlbumArtist)
                {
                    const suggestion = `${song.Name} by ${song.AlbumArtist}`;

                    const speach1 = `Which song would you like to ${action}?`;
                    const speach2 = `I didn't find a track called ${slots.songname.value} by ${artist.name || slots.artistname.value}, you might have meant ${suggestion}. ${speach1}`;
                    
                    return {status: false, speach1, speach2};
                }
                else
                {
                    const speach1 = `Which song would you like to ${action}?`;
                    const speach2 = `I didn't find a track called ${slots.albumname.value} by ${artist.name || slots.artistname.value}. ${speach1}`;
                    return {status: false, speach1, speach2};
                }
            }
        }
    }

    return {status: true, artist, song};
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
        var speach = `Playing ${song.Name}, on ${Config.name}`;
        
        if (song.AlbumArtist) speach = `Playing ${song.Name} by ${song.AlbumArtist}, on ${Config.skill.name}`;

        return await SetQueue(handlerInput, songs, speach);
    }
);

/*********************************************************************************
 * Exports
 */

module.exports = { PlaySongIntent };
