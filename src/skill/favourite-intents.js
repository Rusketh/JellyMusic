const { limit } = CONFIG.jellyfin;

const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api.js");

const Devices = require("../playlist/devices.js");

const Player = require("../players/player.js");

const { CreateQueueIntent } = require("./alexa-helper.js");

/*********************************************************************************
 * Process Intent: Get favourites by user name
 */

const Processer = async function (handlerInput, action = "play", buildQueue, submit) {
    const { requestEnvelope } = handlerInput;
    const intent = requestEnvelope.request.intent;
    const slots = intent.slots;

    if (!slots.username || !slots.username.value) {
        const speech = LANGUAGE.Value("NO_USERNAME");

        return [{ status: false, speech }];
    }

    Logger.Debug(`[Favourite Request]`, `Requested user ${slots.username.value}`);

    const users = await JellyFin.Users(slots.username.value);

    if (!users.status || !users.users[0]) {
        Logger.Debug(`[Favourite Request]`, "No user found.");

        const speech = LANGUAGE.Parse("USER_NOTFOUND_BY_NAME", { username: slots.username.value });

        return [{ status: false, speech }];
    }

    const user = users.users[0];

    const favourites = await JellyFin.Favourites(user.Id);

    const then = async function (data) {
        if (buildQueue)
            for (let i = favourites.index + limit; i < favourites.count; i += limit)
                buildQueue(handlerInput, await JellyFin.Favourites(user.Id, i), data);

        if (submit)
            return await submit(handlerInput, data);
    };

    return [{ status: true, user, items: favourites.items }, then];
};

/*********************************************************************************
 * Play Favourites Intent
 */

const PlayFavouritesIntent = CreateQueueIntent(
    "PlayFavouritesIntent", "play", Processer,
    function (handlerInput, { user, items }, data) {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.clear();

        [data.first, data.last] = playlist.prefixItems(items);

        const item = playlist.getCurrentItem();

        if (!Player.PlayItem(handlerInput, playlist, item))
            return responseBuilder.getResponse();

        Logger.Info(`[Device ${playlist.Id}]`, `Playing ${user.Name}'s favourites.`);

        var speech = LANGUAGE.Parse("FAVOURITES_PLAYING", { user_name: user.Name });

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
 * Shuffle Favourites Intent
 */

const ShuffleFavouritesIntent = CreateQueueIntent(
    "ShuffleFavouritesIntent", "shuffling", Processer,
    function (handlerInput, { user, items }, data) {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.clear();

        items = playlist.shuffleItems(items);

        [data.first, data.last] = playlist.prefixItems(items);

        const item = playlist.getCurrentItem();

        if (!Player.PlayItem(handlerInput, playlist, item))
            return responseBuilder.getResponse();

        Logger.Info(`[Device ${playlist.Id}]`, `Playing ${user.Name}'s favourites.`);

        var speech = LANGUAGE.Parse("FAVOURITES_SHUFFLE", { user_name: user.Name });

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
 * Queue Favourites Intent
 */

const QueueFavouritesIntent = CreateQueueIntent(
    "QueueFavouritesIntent", "queue", Processer,
    function (handlerInput, { user, items, count }, data) {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.appendItems(items);

        const item = playlist.getCurrentItem();

        if (Player.PlayItem(handlerInput, playlist, item))
            Logger.Info(`[Device ${playlist.Id}]`, `Playing ${user.Name}'s favourites.`);

        var speech = LANGUAGE.Parse("FAVOURITES_QUEUED", { count, user_name: user.Name });

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
    PlayFavouritesIntent,
    ShuffleFavouritesIntent,
    QueueFavouritesIntent
};
