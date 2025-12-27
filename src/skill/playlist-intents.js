const {limit} = CONFIG.jellyfin;

const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api");

const Devices = require("../playlist/devices.js");

const Player = require("../players/player.js");

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
        const speech = LANGUAGE.Value("PLAYLIST_NO_NAME");

        return [{status: false, speech}];
    }

    const playlists = await JellyFin.Playlists.FuzzySearch(slots.playlistname.value);
        
    if (!playlists.status || !playlists.items[0])
    {
        const speech = LANGUAGE.Parse("PLAYLIST_NOTFOUND_BY_NAME", {playlist_name: slots.playlistname.value});

        return [{status: false, speech}];
    }

    const playlist = playlists.items[0];

    const songs = await JellyFin.Music({parentId: playlist.Id, limit});

    if (!songs.status || !songs.items[0])
    {
        const speech = LANGUAGE.Parse("PLAYLIST_NO_MUSIC", {playlist_name: slots.playlistname.value});

        return [{status: false, speech}];
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

        const item = _playlist.getCurrentItem();

        if (!Player.PlayItem(handlerInput, _playlist, item))
            return responseBuilder.getResponse();

        Logger.Info(`[Device ${_playlist.Id}]`, `Playing ${item.Item.Name} by ${item.Item.AlbumArtist}`);

        const speech = LANGUAGE.Parse("PLAYLIST_PLAYING", {playlist_name: playlist.Name});

        return responseBuilder.speak(speech).getResponse();
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
        
        items = _playlist.shuffleItems(items);

        [data.first, data.last] = _playlist.prefixItems(items);

        const item = _playlist.getCurrentItem();

        if (!Player.PlayItem(handlerInput, _playlist, item))
            return responseBuilder.getResponse();

        Logger.Info(`[Device ${_playlist.Id}]`, `Playing ${item.Item.Name} by ${item.Item.AlbumArtist}`);

        const speech = LANGUAGE.Parse("PLAYLIST_SHUFFLE", {playlist_name: playlist.Name});
        
        return responseBuilder.speak(speech).getResponse();
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

        const item = _playlist.getCurrentItem();

        if (Player.PlayItem(handlerInput, _playlist, item))
            Logger.Info(`[Device ${playlist.Id}]`, `Playing ${item.Item.Name} by ${item.Item.AlbumArtist}`);

        const speech = LANGUAGE.Parse("PLAYLIST_SHUFFLE", {playlist_name: playlist.Name, count});

        return responseBuilder.speak(speech).getResponse();
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