const { limit } = CONFIG.jellyfin;

const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api");

const Devices = require("../playlist/devices.js");

const Player = require("../players/player.js");

const { CreateQueueIntent } = require("./alexa-helper.js");

/*********************************************************************************
 * Process Intent: Get Genre Intent
 */

const Processer = async function (handlerInput, action = "play", buildQueue, submit) {
    const { requestEnvelope } = handlerInput;
    const intent = requestEnvelope.request.intent;
    const slots = intent.slots;

    if (!slots.genre || !slots.genre.value) {
        const speech = LANGUAGE.Value("GENRE_NO_NAME");

        return [{ status: false, speech }];
    }

    Logger.Debug(`[Genre Request]`, `Requesting genre ${slots.genre.value}.`);

    const genres = await JellyFin.MusicGenres({ query: slots.genre.value });

    if (!genres.status || !genres.items[0]) {
        Logger.Debug(`[Genre Request]`, `Genre not found.`);

        const speech = LANGUAGE.Parse("GENRE_NOTFOUND_BY_NAME", { genre_name: slots.genre.value });

        return [{ status: false, speech }];
    }
    const genreIds = genres.items.map(item => item.Id);

    const songs = await JellyFin.Music({ genres: genreIds });

    if (!songs.status || !songs.items[0]) {
        Logger.Debug(`[Genre Request]`, `No music found.`);

        const speech = LANGUAGE.Parse("GENRE_NO_MUSIC", { genre_name: slots.genre.value });

        return [{ status: false, speech }];
    }

    const then = async function (data) {
        if (buildQueue)
            for (let i = songs.index + limit; i < songs.count; i += limit)
                buildQueue(handlerInput, await JellyFin.Music({ genres: genreIds }, i), data);

        if (submit)
            return await submit(handlerInput, data);
    };

    return [{ status: true, genres: genres.items, items: songs.items }, then];
};

/*********************************************************************************
 * Play Playlist Intent
 */

const PlayGenreIntent = CreateQueueIntent(
    "PlayGenreIntent", "play", Processer,
    function (handlerInput, { genres, items }, data) {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.clear();

        [data.first, data.last] = playlist.prefixItems(items);

        const item = playlist.getCurrentItem();

        if (!Player.PlayItem(handlerInput, playlist, item))
            return responseBuilder.getResponse();

        Logger.Info(`[Device ${playlist.Id}]`, `Playing ${item.Item.Name} by ${item.Item.AlbumArtist}`);


        var speech = LANGUAGE.Parse("GENRE_PLAYING", { genre_name: genres[0].Name });

        if (genres.length > 1)
            var speech = LANGUAGE.Parse("GENRE_PLAYING_SIMULAR", { genre_name: genres[0].Name });

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
 * Play Playlist Intent
 */

const ShuffleGenreIntent = CreateQueueIntent(
    "ShuffleGenreIntent", "shuffling", Processer,
    function (handlerInput, { genres, items }, data) {
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

        var speech = LANGUAGE.Parse("GENRE_SHUFFLE", { genre_name: genres[0].Name });

        if (genres.length > 1)
            var speech = LANGUAGE.Parse("GENRE_SHUFFLE_SIMULAR", { genre_name: genres[0].Name });

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
 * Queue Playlist Intent
 */

const QueueGenreIntent = CreateQueueIntent(
    "QueueGenreIntent", "queue", Processer,
    function (handlerInput, { genres, items, count }, data) {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.appendItems(items);

        const item = playlist.getCurrentItem();

        if (Player.PlayItem(handlerInput, playlist, item))
            Logger.Info(`[Device ${playlist.Id}]`, `Playing ${item.Item.Name} by ${item.Item.AlbumArtist}`);

        var speech = LANGUAGE.Parse("GENRE_QUEUED", { genre_name: genres[0].Name, count });

        if (genres.length > 1)
            var speech = LANGUAGE.Parse("GENRE_QUEUED_SIMULAR", { genre_name: genres[0].Name, count });

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
    PlayGenreIntent,
    ShuffleGenreIntent,
    QueueGenreIntent
};