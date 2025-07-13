const Config = require("/data/config.json");

const {limit} = Config.jellyfin;

const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api");

const Devices = require("../playlist/devices.js");

const { CreateQueueIntent } = require("./alexa-helper.js");

/*********************************************************************************
 * Process Intent: Get Genre Intent
 */

const Processer = async function(handlerInput, action = "play", buildQueue, submit) 
{
    const { requestEnvelope } = handlerInput;
    const intent = requestEnvelope.request.intent;
    const slots = intent.slots;

    if (!slots.genre || !slots.genre.value)
    {
        const speach = `I didn't catch the genre of music.`;
        return [{status: false, speach}];
    }

    console.log(`Requesting Genre: ${slots.genre.value}`);

    const genres = await JellyFin.MusicGenres.Search(slots.genre.value);
        
    if (!genres.status || !genres.items[0])
    {
        const speach = `I didn't find a genre called ${slots.genre.value}.`;
        return [{status: false, speach}];
    }
    const genreIds = genres.items.map(item => item.Id).join("|");

    const songs = await JellyFin.Music({genreIds, limit});
    
    if (!songs.status || !songs.items[0])
    {
        const speach = `No songs of ${slots.genre.value} where found.`;
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

        var speach = `Playing ${genres[0].Name}, on ${Config.skill.name}`;
        
        if (genres.length > 1)
            var speach = `Playing ${genres[0].Name} and simular genre's, on ${Config.skill.name}`;

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
    function (handlerInput, {genres, songs}, data)
    {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.clear();
        
        //TODO: Shuffle this first set of items.

        [data.first, data.last] = playlist.prefixItems(items);

        const directive = playlist.getPlayDirective();

        var speach = `Shuffling ${genres[0].Name}, on ${Config.skill.name}`;

        if (genres.length > 1)
            var speach = `Shuffling ${genres[0].Name} and simular genre's, on ${Config.skill.name}`;

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

        var speach = `Added ${count}, ${genres[0].Name} songs, to the queue.`;

        if (genres.length > 1)
            var speach = `Added ${count}, ${genres[0].Name} and simular songs, to the queue.`;
    
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