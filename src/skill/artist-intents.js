const {limit} = CONFIG.jellyfin;

const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api.js");

const Devices = require("../playlist/devices.js");

const { CreateQueueIntent } = require("./alexa-helper.js");
const Log = require('../logger.js');
const { tFor } = require('./i18n');

/*********************************************************************************
 * Process Intent: Get Arist Intent
 */

const Processer = async function(handlerInput, action = "play", buildQueue, submit) 
{
    const { requestEnvelope } = handlerInput;
    const intent = requestEnvelope.request.intent;
    const slots = intent.slots;

    Log.debug('[NLU] Intent: Artist intents');
    Log.debug('[NLU] Raw slots:', Object.fromEntries(Object.entries(slots || {}).map(([k,v]) => [k, {value: v?.value, resolved: v?.resolutions?.resolutionsPerAuthority?.[0]?.values?.[0]?.value?.name}])));

    if (!slots.artistname || !slots.artistname.value)
    {
        const speach = tFor(handlerInput, 'MISSING_ARTIST_NAME');
        return [{status: false, speach}];
    }

    Log.info(`Requesting Artist: ${slots.artistname.value}`);

    const artists = await JellyFin.Artists.Search(slots.artistname.value);

    try { Log.info('[Search] Artist results:', Log.summarizeItems(artists.items, 8)); Log.trace('[Search] Full artist search result:', artists); } catch (e) { }
        
    if (!artists.status || !artists.items[0])
    {
        const speach = tFor(handlerInput, 'ARTIST_NOT_FOUND', { artist: slots.artistname.value });
        return [{status: false, speach}];
    }

    const artist = artists.items[0];

    const songs = await JellyFin.Music({limit, artistIds: artist.Id});

    try { Log.info('[Search] Songs by artist:', Log.summarizeItems(songs.items, 8)); Log.trace('[Search] Full songs by artist result:', songs); } catch (e) { }

    if (!songs.status || !songs.items[0])
    {
        const speach = tFor(handlerInput, 'NO_MUSIC_BY_ARTIST', { artist: slots.artistname.value });
        return [{status: false, speach}];
    }

    const then = async function(data)
    {
        if (buildQueue)
            for (let i = songs.index + limit; i < songs.count; i += limit)
                buildQueue(handlerInput, await JellyFin.Music({artistIds: artist.Id, limit, startIndex: i}), data);

        if (submit)
            return await submit(handlerInput, data);
    };

    return [{status: true, artist, items: songs.items}, then];
};

/*********************************************************************************
 * Play Artist Intent
 */

const PlayArtistIntent = CreateQueueIntent(
    "PlayArtistIntent", "play", Processer,
    function (handlerInput, {artist, items}, data)
    {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.clear();

        [data.first, data.last] = playlist.prefixItems(items);

        const directive = playlist.getPlayDirective();

        var speach = tFor(handlerInput, 'PLAYING_ARTIST', { artist: artist.Name, skill: CONFIG.skill.name });

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
 * Shuffle Artist Intent
 */

const ShuffleArtistIntent = CreateQueueIntent(
    "ShuffleArtistIntent", "shuffling", Processer,
    function (handlerInput, {artist, items}, data)
    {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.clear();
        
        items = playlist.shuffleItems(items);

        [data.first, data.last] = playlist.prefixItems(items);

        const directive = playlist.getPlayDirective();

        var speach = tFor(handlerInput, 'SHUFFLE_ARTIST', { artist: artist.Name, skill: CONFIG.skill.name });
        
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
 * Queue Artist Intent
 */

const QueueArtistIntent = CreateQueueIntent(
    "QueueArtistIntent", "queue", Processer,
    function (handlerInput, {artist, items, count}, data)
    {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.appendItems(items);

        const directive = playlist.getPlayDirective();

        var speach = tFor(handlerInput, 'ADDED_ARTIST_SONGS', { count, artist: artist.Name });

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
    PlayArtistIntent,
    ShuffleArtistIntent,
    QueueArtistIntent
};
