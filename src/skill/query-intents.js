const Alexa = require('ask-sdk-core');

const Devices = require("../playlist/devices.js");

const { CreateIntent } = require("./alexa-helper.js");

/*********************************************************************************
 * Current Track Query
 */

const WhatThisIntent = CreateIntent(
    "WhatThisIntent",
    function(handlerInput)
    {
        const { responseBuilder, requestEnvelope } = handlerInput;

        const deviceID = Alexa.getDeviceId(requestEnvelope);
        
        const playlist = Devices.getPlayList(deviceID);
        
        const item = playlist.getCurrentItem();

        var speech = "There is currently no song playing.";

        if (item)
            speech = `The current song is ${item.Item.Name} by ${item.Item.AlbumArtist}`;
        
        return responseBuilder.speak(speech).getResponse();
    }
);

/*********************************************************************************
 * Exports
 */

module.exports = {
    WhatThisIntent
};