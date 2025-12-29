const { limit } = CONFIG.jellyfin;

const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api.js");

const Devices = require("../playlist/devices.js");

const Player = require("../players/player.js");

const { CreateQueueIntent } = require("./alexa-helper.js");

/*********************************************************************************
 * Process Intent: Get Arist Intent
 */

const Processer = async function (handlerInput, action = "play", buildQueue, submit) {
    const { requestEnvelope } = handlerInput;
    const intent = requestEnvelope.request.intent;
    const slots = intent.slots;

    if (!slots.artistname || !slots.artistname.value) {
        const speech = LANGUAGE.Value("ARTIST_NO_NAME");

        return [{ status: false, speech }];
    }

    Logger.Debug(`[Artist Request]`, `Requested Artist ${slots.artistname.value}`);

    const artists = await JellyFin.Artists({ query: slots.artistname.value });

    if (!artists.status || !artists.items[0]) {
        Logger.Debug(`[Artist Request]`, "Artist not found.");

        const speech = LANGUAGE.Parse("ARTIST_NOTFOUND_BY_NAME", { artist_name: slots.artistname.value });

        return [{ status: false, speech }];
    }

    const artist = artists.items[0];

    const songs = await JellyFin.Music({ artists: [artist.Id] });

    if (!songs.status || !songs.items[0]) {
        Logger.Debug(`[Artist Request]`, "No music found.");

        const speech = LANGUAGE.Parse("ARTIST_NO_MUSIC", { artist_name: slots.artistname.value });

        return [{ status: false, speech }];
    }

    const then = async function (data) {
        if (buildQueue)
            for (let i = songs.index + limit; i < songs.count; i += limit)
                buildQueue(handlerInput, await JellyFin.Music({ artists: [artist.Id] }, i), data);

        if (submit)
            return await submit(handlerInput, data);
    };

    return [{ status: true, artist, items: songs.items }, then];
};

/*********************************************************************************
 * Play Artist Intent
 */

const PlayArtistIntent = CreateQueueIntent(
    "PlayArtistIntent", "play", Processer,
    function (handlerInput, { artist, items }, data) {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.clear();

        [data.first, data.last] = playlist.prefixItems(items);

        const item = playlist.getCurrentItem();

        if (!Player.PlayItem(handlerInput, playlist, item))
            return responseBuilder.getResponse();

        Logger.Info(`[Device ${playlist.Id}]`, `Playing ${item.Item.Name} by ${item.Item.AlbumArtist}`);

        var speech = LANGUAGE.Parse("ARTIST_PLAYING", { artist_name: artist.Name });

        return responseBuilder.speak(speech).getResponse();
    },
    function ({ requestEnvelope }, { status, items }, data) {
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
    function (handlerInput, { artist, items }, data) {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.clear();

        items = playlist.shuffleItems(items);

        [data.first, data.last] = playlist.prefixItems(items);

        const item = playlist.getCurrentItem();

        if (!Player.PlayItem(handlerInput, playlist, item))
            return responseBuilder.getResponse();

        Logger.Info(`[Device ${playlist.Id}]`, `Playing ${item.Item.Name} by ${item.Item.AlbumArtist}`);

        var speech = LANGUAGE.Parse("ARTIST_SHUFFLE", { artist_name: artist.Name });

        return responseBuilder.speak(speech).getResponse();
    },
    function ({ requestEnvelope }, { status, items }, data) {
        if (!status) return;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        const [first, last] = playlist.prefixItems(items, data.last + 1);

        data.last = last;
    },
    function ({ requestEnvelope }, { first, last }) {
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
    function (handlerInput, { artist, items, count }, data) {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.appendItems(items);

        const item = playlist.getCurrentItem();

        if (Player.PlayItem(handlerInput, playlist, item))
            Logger.Info(`[Device ${playlist.Id}]`, `Playing ${item.Item.Name} by ${item.Item.AlbumArtist}`);

        var speech = LANGUAGE.Parse("ARTIST_QUEUED", { artist_name: artist.Name, count });

        return responseBuilder.speak(speech).getResponse();
    },
    function ({ requestEnvelope }, { status, items }, data) {
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
