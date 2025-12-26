const {limit} = CONFIG.jellyfin;

const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api");

const Devices = require("../playlist/devices.js");

const { CreateQueueIntent } = require("./alexa-helper.js");
const Log = require('../logger.js');
const { tFor } = require('./i18n');

/*********************************************************************************
 * Process Intent: Get Album by name & Artist
 */

const Processer = async function(handlerInput, action = "play", buildQueue, submit) 
{
    const { requestEnvelope } = handlerInput;
    const intent = requestEnvelope.request.intent;
    const slots = intent.slots;

    Log.debug('[NLU] Intent: Album intents');
    Log.debug('[NLU] Raw slots:', Object.fromEntries(Object.entries(slots || {}).map(([k,v]) => [k, {value: v?.value, resolved: v?.resolutions?.resolutionsPerAuthority?.[0]?.values?.[0]?.value?.name}])));

    if (!slots.albumname || !slots.albumname.value)
    {
        const speach1 = tFor(handlerInput, 'MISSING_ALBUM_NAME', { action });
        const speach2 = speach1;
        return [{status: false, speach1, speach2}];
    }

    Log.info(`Requesting Album: ${slots.albumname.value}`);

    const albums = await JellyFin.Albums.Search(slots.albumname.value);

    try { Log.info('[Search] Album results:', Log.summarizeItems(albums.items, 8)); Log.trace('[Search] Full album search result:', albums); } catch (e) { }
    
    if (!albums.status || !albums.items[0])
    {
        const speach = tFor(handlerInput, 'ALBUM_NOT_FOUND', { album: slots.albumname.value });
        return [{status: false, speach}];
    }

    var artist = undefined;
    var album = albums.items[0];

    if (slots.artistname && slots.artistname.value)
    {
        Log.info(`Requesting Artist for Album: ${slots.artistname.value}`);

        const artists = await JellyFin.Artists.Search(slots.artistname.value);
        
        if (!artists.status || !artists.items[0])
        {
            const speach = tFor(handlerInput, 'ALBUM_ARTIST_NOT_FOUND', { artist: slots.artistname.value });
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

                    const speach = tFor(handlerInput, 'ALBUM_SUGGESTION', { album: slots.albumname.value, artist: artist.name || slots.artistname.value, suggestion });
                    
                    return [{status: false, speach}];
                }
                else
                {
                    const speach = tFor(handlerInput, 'ALBUM_NOT_FOUND_BY_ARTIST', { album: slots.albumname.value, artist: artist.name || slots.artistname.value });
                    return [{status: false, speach}];
                }
            }
        }
    }

    const songs = await JellyFin.Music({limit, albumIds: album.Id});

    try { Log.info('[Search] Songs in album:', Log.summarizeItems(songs.items, 8)); Log.trace('[Search] Full songs in album result:', songs); } catch (e) { }

    if (!songs.status || !songs.items[0])
    {
        const speach = tFor(handlerInput, 'NO_MUSIC_IN_ALBUM', { album: slots.albumname.value });
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

        var speach = tFor(handlerInput, 'PLAYING_ALBUM', { album: album.Name, skill: CONFIG.skill.name });
        
        if (album.AlbumArtist) speach = tFor(handlerInput, 'PLAYING_ALBUM_BY_ARTIST', { album: album.Name, artist: album.AlbumArtist, skill: CONFIG.skill.name });

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

        var speach = tFor(handlerInput, 'SHUFFLE_ALBUM', { album: album.Name, skill: CONFIG.skill.name });
        
        if (album.AlbumArtist) speach = tFor(handlerInput, 'SHUFFLE_ALBUM_BY_ARTIST', { album: album.Name, artist: album.AlbumArtist, skill: CONFIG.skill.name });

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

        var speach = tFor(handlerInput, 'ADDED_ALBUM_TO_QUEUE', { album: album.Name });
        
        if (album.AlbumArtist) speach = tFor(handlerInput, 'ADDED_ALBUM_TO_QUEUE', { album: album.Name });

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