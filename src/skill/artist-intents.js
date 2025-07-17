const Config = require("/data/config.json");

const {limit} = Config.jellyfin;

const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api.js");

const Devices = require("../playlist/devices.js");

const { CreateQueueIntent } = require("./alexa-helper.js");

/*********************************************************************************
 * Process Intent: Get Arist Intent
 */

const Processer = async function(handlerInput, action = "play", buildQueue, submit) 
{
    const { requestEnvelope } = handlerInput;
    const intent = requestEnvelope.request.intent;
    const slots = intent.slots;

    if (!slots.artistname || !slots.artistname.value)
    {
        const speach = `I didn't catch the artist name.`;
        return [{status: false, speach}];
    }

    console.log(`Requesting Artist: ${slots.artistname.value}`);

    const artists = await JellyFin.Artists.Search(slots.artistname.value);
        
    if (!artists.status || !artists.items[0])
    {
        const speach = `I didn't find an artist called ${slots.artistname.value}.`;
        return [{status: false, speach}];
    }

    const artist = artists.items[0];

    const songs = await JellyFin.Music({limit, artistIds: artist.Id});

    if (!songs.status || !songs.items[0])
    {
        const speach = `I didn't find an music by the artist ${slots.artistname.value}.`;
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

        var speach = `Playing songs by artist ${artist.Name}, on ${Config.skill.name}`;

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
        
        //TODO: Shuffle this first set of items.

        [data.first, data.last] = playlist.prefixItems(items);

        const directive = playlist.getPlayDirective();

        var speach = `Shuffling songs by artist ${artist.Name}, on ${Config.skill.name}`;
        
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

        var speach = `Added ${count} songs by artist ${artist.Name}, to the queue.`;

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
