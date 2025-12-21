const {limit} = CONFIG.jellyfin;

const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api");

const Devices = require("../playlist/devices.js");

const { CreateQueueIntent } = require("./alexa-helper.js");

/*********************************************************************************
 * Process Intent: Get Album by name & Artist
 */

const Processer = async function(handlerInput, action = "play", buildQueue, submit) 
{
    const { requestEnvelope } = handlerInput;
    const intent = requestEnvelope.request.intent;
    const slots = intent.slots;

    if (!slots.albumname || !slots.albumname.value)
    {
        const speach1 = `Which album would you like to ${action}?`;
        const speach2 = `I didn't catch the album name. ${speach1}`;
        return [{status: false, speach1, speach2}];
    }

    console.log(`Requesting Album: ${slots.albumname.value}`);

    const albums = await JellyFin.Albums.Search(slots.albumname.value);
    
    if (!albums.status || !albums.items[0])
    {
        const speach = `I didn't find an album called ${slots.albumname.value}`;
        return [{status: false, speach}];
    }

    var artist = undefined;
    var album = albums.items[0];

    if (slots.artistname && slots.artistname.value)
    {
        console.log(`Requesting Artist for Album: ${slots.artistname.value}`);

        const artists = await JellyFin.Artists.Search(slots.artistname.value);
        
        if (!artists.status || !artists.items[0])
        {
            const speach = `I didn't find an artist called ${slots.artistname.value}.`;
            return [{status: false, speach}];
        }

        artist = artists.items[0];

        if (album.AlbumArtist && album.AlbumArtist.toLowerCase() != artist.Name.toLowerCase())
        {

            album = undefined;

            for (var item of albums.items)
            {
                if (item.AlbumArtist && item.AlbumArtist.toLowerCase() == artist.Name.toLowerCase())
                {
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
                    
                    return [{status: false, speach}];
                }
                else
                {
                    const speach = `I didn't find an album called ${slots.albumname.value} by ${artist.name || slots.artistname.value}.`;
                    return [{status: false, speach}];
                }
            }
        }
    }

    const songs = await JellyFin.Music({limit, albumIds: album.Id});

    if (!songs.status || !songs.items[0])
    {
        const speach = `I didn't find an music in the album ${slots.albumname.value}.`;
        return [{status: false, speach1, speach2}];
    }

    const then = async function(data)
    {
        if (buildQueue)
            for (let i = songs.index + limit; i < songs.count; i += limit)
                buildQueue(handlerInput, await JellyFin.Music({albumIds: album.Id, limit, startIndex: i}), data);

        if (submit)
            return await submit(handlerInput, data);
    };

    return [{status: true, album, items: songs.items}, then];
};

/*********************************************************************************
 * Play Album Intent
 */

const PlayAlbumIntent = CreateQueueIntent(
    "PlayAlbumIntent", "play", Processer,
    function (handlerInput, {album, items}, data)
    {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.clear();

        [data.first, data.last] = playlist.prefixItems(items);

        const directive = playlist.getPlayDirective();

        var speach = `Playing album ${album.Name}, on ${CONFIG.skill.name}`;
        
        if (album.AlbumArtist) speach = `Playing album ${album.Name} by ${album.AlbumArtist}, on ${CONFIG.skill.name}`;

        return responseBuilder.speak(speach).addAudioPlayerPlayDirective(...directive).getResponse();
    },
    function({ requestEnvelope }, {status, items}, data)
    {
        if (!status) return;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        const [first, last] = playlist.prefixItems(items, data.last + 1);

        data.last = last;
    }
);

/*********************************************************************************
 * Shuffle Album Intent
 */

const ShuffleAlbumIntent = CreateQueueIntent(
    "ShuffleAlbumIntent", "shuffling", Processer,
    function (handlerInput, {album, items}, data)
    {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.clear();
        
        items = playlist.shuffleItems(items);

        [data.first, data.last] = playlist.prefixItems(items);

        const directive = playlist.getPlayDirective();

        var speach = `Shuffling album ${album.Name}, on ${CONFIG.skill.name}`;
        
        if (album.AlbumArtist) speach = `Shuffling album ${album.Name} by ${album.AlbumArtist}, on ${CONFIG.skill.name}`;

        return responseBuilder.speak(speach).addAudioPlayerPlayDirective(...directive).getResponse();
    },
    function({ requestEnvelope }, {status, items}, data)
    {
        if (!status) return;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        const [first, last] = playlist.prefixItems(items, data.last + 1);

        data.last = last;
    },
    function({ requestEnvelope }, {first, last})
    {
        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.shuffleRemainingItems(first, last);
    }
);

/*********************************************************************************
 * Queue Album Intent
 */

const QueueAlbumIntent = CreateQueueIntent(
    "QueueAlbumIntent", "queue", Processer,
    async function (handlerInput, {album, items}, data)
    {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.appendItems(items);

        const directive = playlist.getPlayDirective();

        var speach = `Adding album ${album.Name}, to the queue.`;
        
        if (album.AlbumArtist) speach = `Adding album ${album.Name} by ${album.AlbumArtist}, to the queue.`;

        return responseBuilder.speak(speach).addAudioPlayerPlayDirective(...directive).getResponse();
    },
    function({ requestEnvelope }, {status, items}, data)
    {
        if (!status) return;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.appendItems(items);
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