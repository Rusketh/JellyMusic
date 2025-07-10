const Config = require("/data/config.json");

const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api");

const AlexaQueue = require("../queue/alexa-queque.js");

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

    console.log(`Requesting Album: ${slots.albumname.value}`);

    const albums = await JellyFin.Albums.Search(slots.albumname.value);
    
    if (!albums.status || !albums.items[0])
    {
        const speach = `I didn't find an album called ${slots.albumname.value}`;
        return {status: false, speach};
    }

    var artist = undefined;
    var album = albums.items[0];

    if (slots.artistname && slots.artistname.value)
    {
        console.log(`Requesting Artist for Album: ${slots.artistname.value}`);

        const artists = await JellyFin.Artists.Search(slots.artistname.value);
        
        if (!artists.status || !artists.items[0])
        {
            const speach2 = `I didn't find an artist called ${slots.artistname.value}.`;
            return {status: false, speach};
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

                    const speach = `I didn't find an album called ${slots.albumname.value} by ${artist.name || slots.artistname.value}, you might have meant ${suggestion}.`;
                    
                    return {status: false, speach};
                }
                else
                {
                    const speach = `I didn't find an album called ${slots.albumname.value} by ${artist.name || slots.artistname.value}.`;
                    return {status: false, speach};
                }
            }
        }
    }

    const songs = await JellyFin.Music({albumIds: album.Id});

    if (!songs.status || !songs.items[0])
    {
        const speach = `I didn't find an music in the album ${slots.albumname.value}.`;
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
                var {speach, prompt} = result;
                
                if (speach && prompt)
                {
                    console.warn(`Intent("${intent}"): ${speach}`);
                    return responseBuilder.speak(speach).reprompt(prompt).getResponse();
                }

                if (speach)
                {
                    console.warn(`Intent("${intent}"): ${speach}`);
                    return responseBuilder.speak(speach).getResponse();
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
    async function (handlerInput, {album, songs})
    {
        var speach = `Playing album ${album.Name}, on ${Config.name}`;
        
        if (album.AlbumArtist) speach = `Playing album ${album.Name} by ${album.AlbumArtist}, on ${Config.skill.name}`;

        return await AlexaQueue.InjectItems(handlerInput, songs, speach);
    }
);

/*********************************************************************************
 * Shuffle Album Intent
 */

const ShuffleAlbumIntent = CreateAlbumIntent(
    "ShuffleAlbumIntent", "shuffling",
    async function (handlerInput, {album, songs})
    {
        var speach = `Shuffling album ${album.Name}, on ${Config.name}`;
        
        if (album.AlbumArtist) speach = `Shuffling album ${album.Name} by ${album.AlbumArtist}, on ${Config.skill.name}`;

        return await AlexaQueue.SetQueueShuffled(handlerInput, songs, speach);
    }
);

/*********************************************************************************
 * Queue Album Intent
 */

const QueueAlbumIntent = CreateAlbumIntent(
    "QueueAlbumIntent", "queue",
    async function (handlerInput, {album, songs})
    {
        var speach = `Added album ${album.Name}, to the queue.`;
        
        if (album.AlbumArtist) speach = `Added album ${album.Name} by ${album.AlbumArtist}, to the queue.`;

        return await AlexaQueue.QueueItems(handlerInput, songs, speach);
    }
);

/*********************************************************************************
 * Exports
 */

module.exports = {
    PlayAlbumIntent,
    ShuffleAlbumIntent,
    QueueAlbumIntent
};