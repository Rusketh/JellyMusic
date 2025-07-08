const Config = require("../config.json");

const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api");

const { SetQueue } = require("../queue/alexa-queque.js");

const { CreateIntent } = require("./alexa-helper.js");

/*********************************************************************************
 * Process Intent: Get Arist Intent
 */

const ProcessIntent = async function(handlerInput, action = "play") 
{
    const { requestEnvelope } = handlerInput;
    const intent = requestEnvelope.request.intent;
    const slots = intent.slots;

    if (!slots.playlistname || !slots.playlistname.value)
    {
        const speach1 = `Which playlist would you like to ${action}?`;
        const speach2 = `I didn't catch the playlist name. ${speach1}`;
        return {status: false, speach1, speach2};
    }

    console.log(`Requesting Playlist: ${slots.playlistname.value}`);

    const playlists = await JellyFin.Playlists.Search(slots.playlistname.value);
        
    if (!playlists.status || !playlists.items[0])
    {
        const speach1 = `Which playlist would you like to ${action}?`;
        const speach2 = `I didn't find a playlist called ${slots.playlistname.value}. ${speach1}`;
        return {status: false, speach1, speach2};
    }

    const playlist = playlists.items[0];

    const songs = await JellyFin.Music.ByPlayList(playlist.Name);

    if (!songs.status || !songs.items[0])
    {
        const speach1 = `Which playlist would you like to ${action}?`;
        const speach2 = `The playlist ${slots.artistname.value} is empty. ${speach1}`;
        return {status: false, speach1, speach2};
    }

    return {status: true, playlist, songs: songs.items};
};

/*********************************************************************************
 * Create Playlist Intent Handler
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

const PlayPlaylistIntent = CreateArtistIntent(
    "PlayPlaylistIntent", "play",
    async function (handlerInput, {playlist, songs})
    {
        var speach = `Playing songs from playlist ${playlist.Name}, on ${Config.skill.name}`;

        return await SetQueue(handlerInput, songs, speach);
    }
);

/*********************************************************************************
 * Exports
 */

module.exports = { PlayPlaylistIntent };