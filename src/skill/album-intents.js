const { limit } = CONFIG.jellyfin;

const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api");

const Devices = require("../playlist/devices.js");

const Player = require("../players/player.js");

const { CreateQueueIntent } = require("./alexa-helper.js");

/*********************************************************************************
 * Process Intent: Get Album by name & Artist
 */

const Processer = async function (handlerInput, action = "play", buildQueue, submit) {
    const { requestEnvelope } = handlerInput;
    const intent = requestEnvelope.request.intent;
    const slots = intent.slots;

    if (!slots.albumname || !slots.albumname.value) {
        const speech = LANGUAGE.Value("ALBUM_NO_NAME");

        return [{ status: false, speach1 }];
    }

    Logger.Debug(`[Album Request]`, `Requested album ${slots.albumname.value}`);

    const albums = await JellyFin.Albums({ query: slots.albumname.value });

    if (!albums.status || !albums.items[0]) {
        Logger.Debug(`[Album Request]`, "No album found.");

        const speech = LANGUAGE.Parse("ALBUM_NOTFOUND_BY_NAME", { album_name: slots.albumname.value });

        return [{ status: false, speech }];
    }

    var artist = undefined;
    var album = albums.items[0];

    if (slots.artistname && slots.artistname.value) {
        Logger.Debug(`[Album Request]`, `Requested Artist ${slots.artistname.value}`);

        const artists = await JellyFin.Artists({ query: slots.artistname.value });

        if (!artists.status || !artists.items[0]) {
            Logger.Debug(`[Album Request]`, "No artist found.");

            const speech = LANGUAGE.Parse("ARTIST_NOTFOUND_BY_NAME", { artist_name: slots.artistname.value });

            return [{ status: false, speech }];
        }

        artist = artists.items[0];

        if (album.AlbumArtist && album.AlbumArtist.toLowerCase() != artist.Name.toLowerCase()) {

            album = undefined;

            for (var item of albums.items) {
                if (item.AlbumArtist && item.AlbumArtist.toLowerCase() == artist.Name.toLowerCase()) {
                    album = item;
                    break;
                }
            }

            if (!album) {
                album = albums.items[0];

                if (album && album.AlbumArtist) {
                    Logger.Debug(`[Album Request]`, `Returning suggestion ${album.Name} by ${album.AlbumArtist}`);

                    const speech = LANGUAGE.Parse("ALBUM_NOTFOUND_SUGGEST",
                        {
                            album_name: slots.albumname.value,
                            artist_name: artist.name || slots.artistname.value,
                            suggestion_name: album.Name,
                            suggestion_artist: album.AlbumArtist
                        }
                    );

                    return [{ status: false, speech }];
                }
                else {

                    Logger.Debug(`[Album Request]`, "Album not found.");

                    const speech = LANGUAGE.Parse("ALBUM_NOTFOUND_BY_NAME_AND_ARTIST",
                        {
                            album_name: slots.albumname.value,
                            artist_name: artist.name || slots.artistname.value
                        }
                    );

                    return [{ status: false, speech }];
                }
            }
        }
    }

    const songs = await JellyFin.Music({ limit, albums: [album.Id] });

    if (!songs.status || !songs.items[0]) {
        const speech = LANGUAGE.Parse("ALBUM_NO_MUSIC", { album_name: slots.albumname.value });

        return [{ status: false, speach1, speach2 }];
    }

    const then = async function (data) {
        if (buildQueue)
            for (let i = songs.index + limit; i < songs.count; i += limit)
                buildQueue(handlerInput, await JellyFin.Music({ albums: [album.Id] }, i), data);

        if (submit)
            return await submit(handlerInput, data);
    };

    return [{ status: true, album, items: songs.items }, then];
};

/*********************************************************************************
 * Play Album Intent
 */

const PlayAlbumIntent = CreateQueueIntent(
    "PlayAlbumIntent", "play", Processer,
    function (handlerInput, { album, items }, data) {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.clear();

        [data.first, data.last] = playlist.prefixItems(items);

        const item = playlist.getCurrentItem();

        if (!Player.PlayItem(handlerInput, playlist, item))
            return responseBuilder.getResponse();

        Logger.Info(`[Device ${playlist.Id}]`, `Playing ${item.Item.Name} by ${item.Item.AlbumArtist}`);

        var speech = LANGUAGE.Parse("ALBUM_PLAYING", { album_name: album.Name });

        if (album.AlbumArtist)
            speech = LANGUAGE.Parse("ALBUM_PLAYING_BY_ARTIST",
                {
                    album_name: album.Name,
                    album_artist: album.AlbumArtist
                }
            );

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
 * Shuffle Album Intent
 */

const ShuffleAlbumIntent = CreateQueueIntent(
    "ShuffleAlbumIntent", "shuffling", Processer,
    function (handlerInput, { album, items }, data) {
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

        var speech = LANGUAGE.Parse("ALBUM_SHUFFLE", { album_name: album.Name });

        if (album.AlbumArtist)
            speech = LANGUAGE.Parse("ALBUM_SHUFFLE_BY_ARTIST",
                {
                    album_name: album.Name,
                    album_artist: album.AlbumArtist
                }
            );

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
 * Queue Album Intent
 */

const QueueAlbumIntent = CreateQueueIntent(
    "QueueAlbumIntent", "queue", Processer,
    async function (handlerInput, { album, items }, data) {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.appendItems(items);

        const item = playlist.getCurrentItem();

        if (Player.PlayItem(handlerInput, playlist, item))
            Logger.Info(`[Device ${playlist.Id}]`, `Playing ${item.Item.Name} by ${item.Item.AlbumArtist}`);

        var speech = LANGUAGE.Parse("ALBUM_QUEUED", { album_name: album.Name });

        if (album.AlbumArtist)
            speech = LANGUAGE.Parse("ALBUM_QUEUED_BY_ARTIST",
                {
                    album_name: album.Name,
                    album_artist: album.AlbumArtist
                }
            );

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
    PlayAlbumIntent,
    ShuffleAlbumIntent,
    QueueAlbumIntent
};