const Alexa = require('ask-sdk-core');

const Devices = require("../playlist/devices.js");

const { CreateIntent } = require("./alexa-helper.js");

/*********************************************************************************
 * Current Track Query
 */

const WhatThisIntent = CreateIntent(
    "WhatThisIntent",
    function (handlerInput) {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        const item = playlist.getCurrentItem();

        var speech = LANGUAGE.Value("QUERY_NO_SONG");

        if (item)
            speech = LANGUAGE.Parse("QUERY_SONGNAME",
                {
                    song_name: item.Item.Name,
                    artist_name: item.Item.AlbumArtist
                }
            );

        return responseBuilder.speak(speech).getResponse();
    }
);

/*********************************************************************************
 * Exports
 */

module.exports = {
    WhatThisIntent
};