const Alexa = require('ask-sdk-core');

const Devices = require("../playlist/devices.js");

const { CreateIntent } = require("./alexa-helper.js");
const Log = require('../logger.js');

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

        var speach = "There is currently no song playing.";

        if (item)
            speach = `The current song is ${item.Item.Name} by ${item.Item.AlbumArtist}`;

        Log.info(speach);
        
        return responseBuilder.speak(speach).getResponse();
    }
);

/*********************************************************************************
 * Exports
 */

module.exports = {
    WhatThisIntent
};