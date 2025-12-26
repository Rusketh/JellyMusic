const {limit} = CONFIG.jellyfin;

const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api");

const Devices = require("../playlist/devices.js");

const { CreateQueueIntent } = require("./alexa-helper.js");
const Log = require('../logger.js');
const { tFor } = require('./i18n');

/*********************************************************************************
 * Process Intent: Get Genre Intent
 */

const Processer = async function(handlerInput, action = "play", buildQueue, submit) 
{
    const { requestEnvelope } = handlerInput;
    const intent = requestEnvelope.request.intent;
    const slots = intent.slots;

    Log.debug('[NLU] Intent: Genre intents');
    Log.debug('[NLU] Raw slots:', Object.fromEntries(Object.entries(slots || {}).map(([k,v]) => [k, {value: v?.value, resolved: v?.resolutions?.resolutionsPerAuthority?.[0]?.values?.[0]?.value?.name}])));

    if (!slots.genre || !slots.genre.value)
    {
        const speach = tFor(handlerInput, 'MISSING_GENRE');
        return [{status: false, speach}];
    }

    Log.info(`Requesting Genre: ${slots.genre.value}`);

    const genres = await JellyFin.MusicGenres.Search(slots.genre.value);

    try { Log.info('[Search] Genre results:', Log.summarizeItems(genres.items, 8)); Log.trace('[Search] Full genre search result:', genres); } catch (e) { }
        
    if (!genres.status || !genres.items[0])
    {
        const speach = tFor(handlerInput, 'GENRE_NOT_FOUND', { genre: slots.genre.value });
        return [{status: false, speach}];
    }
    const genreIds = genres.items.map(item => item.Id).join("|");

    const songs = await JellyFin.Music({genreIds, limit});
    
    if (!songs.status || !songs.items[0])
    {
        const speach = tFor(handlerInput, 'NO_SONGS_OF_GENRE', { genre: slots.genre.value });
        return [{status: false, speach}];
    }

    const then = async function(data)
    {
        if (buildQueue)
            for (let i = songs.index + limit; i < songs.count; i += limit)
                buildQueue(handlerInput, await JellyFin.Music({genreIds, limit, startIndex: i}), data);

        if (submit)
            return await submit(handlerInput, data);
    };

    return [{status: true, genres: genres.items, items: songs.items}, then];
};

/*********************************************************************************
 * Play Playlist Intent
 */

const PlayGenreIntent = CreateQueueIntent(
    "PlayGenreIntent", "play", Processer,
    function (handlerInput, {genres, items}, data)
    {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.clear();

        [data.first, data.last] = playlist.prefixItems(items);

        const directive = playlist.getPlayDirective();

        var speach = tFor(handlerInput, 'PLAYING_GENRE', { genre: genres[0].Name, skill: CONFIG.skill.name });
        
        if (genres.length > 1)
            var speach = tFor(handlerInput, 'PLAYING_GENRE_AND_SIMILAR', { genre: genres[0].Name, skill: CONFIG.skill.name });

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
 * Play Playlist Intent
 */

const ShuffleGenreIntent = CreateQueueIntent(
    "ShuffleGenreIntent", "shuffling", Processer,
    function (handlerInput, {genres, items}, data)
    {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.clear();
        
        items = playlist.shuffleItems(items);

        [data.first, data.last] = playlist.prefixItems(items);

        const directive = playlist.getPlayDirective();

        var speach = tFor(handlerInput, 'SHUFFLE_GENRE', { genre: genres[0].Name, skill: CONFIG.skill.name });

        if (genres.length > 1)
            var speach = tFor(handlerInput, 'SHUFFLE_GENRE_AND_SIMILAR', { genre: genres[0].Name, skill: CONFIG.skill.name });

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
 * Queue Playlist Intent
 */

const QueueGenreIntent = CreateQueueIntent(
    "QueueGenreIntent", "queue", Processer,
    function (handlerInput, {genres, items, count}, data)
    {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.appendItems(items);

        const directive = playlist.getPlayDirective();

        var speach = tFor(handlerInput, 'ADDED_GENRE_SONGS', { count, genre: genres[0].Name });

        if (genres.length > 1)
            var speach = tFor(handlerInput, 'ADDED_GENRE_SONGS', { count, genre: genres[0].Name });
    
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
    PlayGenreIntent,
    ShuffleGenreIntent,
    QueueGenreIntent
};