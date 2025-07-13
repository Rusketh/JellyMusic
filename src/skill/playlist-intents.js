const Config = require("/data/config.json");

const {limit} = Config.jellyfin;

const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api");

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

    if (!slots.playlistname || !slots.playlistname.value)
    {
        const speach = `I didn't catch the playlist name.`;
        return [{status: false, speach}];
    }

    const playlists = await JellyFin.Playlists.Search(slots.playlistname.value);
        
    if (!playlists.status || !playlists.items[0])
    {
        const speach = `I didn't find a playlist called ${slots.playlistname.value}.`;
        return [{status: false, speach}];
    }

    const playlist = playlists.items[0];

    const songs = await JellyFin.Music({parentId: playlist.Id, limit});

    if (!songs.status || !songs.items[0])
    {
        const speach = `The playlist ${slots.artistname.value} is empty.`;
        return [{status: false, speach}];
    }

    const then = async function(data)
    {
        if (buildQueue)
            for (let i = songs.index + limit; i < songs.count; i += limit)
                buildQueue(handlerInput, await JellyFin.Music({parentId: playlist.Id, limit, startIndex: i}), data);
        
        if (submit)
            return await submit(handlerInput, data);
    };

    return [{status: true, playlist, items: songs.items}, then];
};

/*********************************************************************************
 * Play Playlist Intent
 */

const PlayPlaylistIntent = CreateQueueIntent(
    "PlayPlaylistIntent", "play", Processer,
    function (handlerInput, {playlist, items}, data)
    {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const _playlist = Devices.getPlayList(deviceID);

        _playlist.clear();

        [data.first, data.last] = _playlist.prefixItems(items);

        const directive = _playlist.getPlayDirective();

        var speach = `Playing songs from playlist ${playlist.Name}, on ${Config.skill.name}`;

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

const ShufflePlaylistIntent = CreateQueueIntent(
    "ShufflePlaylistIntent", "shuffling", Processer,
    function (handlerInput, {playlist, items}, data)
    {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const _playlist = Devices.getPlayList(deviceID);

        _playlist.clear();
        
        //TODO: Shuffle this first set of items.

        [data.first, data.last] = _playlist.prefixItems(items);

        const directive = _playlist.getPlayDirective();

        var speach = `Shuffling songs from playlist ${playlist.Name}, on ${Config.skill.name}`;
        
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

const QueuePlaylistIntent = CreateQueueIntent(
    "QueuePlaylistIntent", "queue", Processer,
    function (handlerInput, {playlist, items, count}, data)
    {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const _playlist = Devices.getPlayList(deviceID);

        _playlist.appendItems(items);

        const directive = _playlist.getPlayDirective();

        var speach = `Added ${count} songs from playlist ${playlist.Name}, to the queue.`;

        return responseBuilder.speak(speach).addAudioPlayerPlayDirective(...directive).getResponse();
    },
    function({ requestEnvelope }, {status, items}, data)
    {
        if (!status) return;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.appendItems(items, data.last + 1);
    }
);

/*********************************************************************************
 * Exports
 */

module.exports = {
    PlayPlaylistIntent,
    ShufflePlaylistIntent,
    QueuePlaylistIntent
};