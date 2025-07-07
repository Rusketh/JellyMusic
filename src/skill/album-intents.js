const Config = require("../config.json");

const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api");

const MusicQueue = require("../music-queue.js");

const { CreateIntent } = require("./alexa-helper.js");

/*********************************************************************************
 * Process Intent: Get Album by name & Artist
 */

const ProcessIntent = async function(handlerInput, action = "play") 
{
    const { requestEnvelope } = handlerInput;
    const intent = requestEnvelope.request.intent;
    const slots = intent.slots;

    if (!slots.albumname || !slots.albumname.value)
    {
        const speach1 = `Which album would you like to ${action}?`;
        const speach2 = `I didn't catch the album name. ${speach1}`;
        return {status: false, speach1, speach2};
    }

    const albums = await JellyFin.Albums.Search(slots.albumname.value);
    
    if (!albums.status || !albums.items[0])
    {
        const speach1 = `Which album would you like to ${action}?`;
        const speach2 = `I didn't find an album called ${slots.albumname.value}. ${speach1}`;
        return {status: false, speach1, speach2};
    }

    var artist = undefined;
    var album = albums.items[0];

    if (slots.artistname && slots.artistname.value)
    {
        const artists = await JellyFin.Artists.Search(slots.artistname.value);
        
        if (!artists.status || !artists.items[0])
        {
            const speach1 = `Which album would you like to ${action}?`;
            const speach2 = `I didn't find an artist called ${slots.artistname.value}. ${speach1}`;
            return {status: false, speach1, speach2};
        }

        artist = artists.items[0];

        if (album.AlbumArtist && album.AlbumArtist.toLowerCase() != artist.Name.toLowerCase())
        {

            album = undefined;

            for (var item of albums.items)
            {
                if (item.AlbumArtist && item.AlbumArtist.toLowerCase() == artist.Name.toLowerCase())
                {
                    console.log("Found ", item.Name);
                    album = item;
                    break;
                }
            }

            if (!album)
            {
                album = albums.items[0];
                
                if (album && album.AlbumArtist)
                {
                    const suggestion = `${album.Name} by ${album.AlbumArtist}`;

                    const speach1 = `Which album would you like to ${action}?`;
                    const speach2 = `I didn't find an album called ${slots.albumname.value} by ${artist.name || slots.artistname.value}, you might have meant ${suggestion}. ${speach1}`;
                    
                    return {status: false, speach1, speach2};
                }
                else
                {
                    const speach1 = `Which album would you like to ${action}?`;
                    const speach2 = `I didn't find an album called ${slots.albumname.value} by ${artist.name || slots.artistname.value}. ${speach1}`;
                    return {status: false, speach1, speach2};
                }
            }
        }
    }

    const songs = await JellyFin.Music({albumIds: album.Id});

    if (!songs.status || !songs.items[0])
    {
        const speach1 = `Which album would you like to ${action}?`;
        const speach2 = `I didn't find an music in the album ${slots.albumname.value}. ${speach1}`;
        return {status: false, speach1, speach2};
    }

    return {status: true, album, songs: songs.items};
};

/*********************************************************************************
 * Create Album Intent Handler
 */

const CreateAlbumIntent = function(intent, action, callback)
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
 * Play Album Intent
 */

const PlayAlbumIntent = CreateAlbumIntent(
    "PlayAlbumIntent", "play",
    async function (handlerInput, {artist, album, songs})
    {
        const { responseBuilder } = handlerInput;
        
        MusicQueue.Clear();

        for(var item of songs)
            MusicQueue.Push(item);

        const {url, id} = MusicQueue.Current();

        console.log("Playing: ", url);

        var speach = `Playing album ${album.Name}, on ${Config.name}`;
        
        if (album.AlbumArtist) speach = `Playing album ${album.Name} by ${album.AlbumArtist}, on ${Config.skill.name}`;

        return responseBuilder.speak(speach).addAudioPlayerPlayDirective('REPLACE_ALL', url, id, 0).getResponse();
    }
);

/*********************************************************************************
 * Exports
 */

module.exports = { PlayAlbumIntent };


//shuffle album {albumname} on jellyfin music
//queue album {albumname} on jellyfin music



//Album:
//
//Play songs from $ on jellyfin

//Artist:
//Play Artist $ on jellyfin
//Play songs by $ on jellyfin
//Play songs from $  on jellyfin

//Song:
//play song $ on jellyfin

//Genre
//Play genre $ on jellyfin
//Play some $ on jellyfin

//Anythig:
//Play $ on jellyfin -> [Song] [Playlist] [Album] [Aritst] [Genre]

//Other:
//Stop
//Pause
//Resume
//Next
//Previous