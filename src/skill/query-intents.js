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

        var speach = tFor(handlerInput, 'NO_SONG_PLAYING');

        if (item)
            speach = tFor(handlerInput, 'CURRENT_SONG', { song: item.Item.Name, artist: item.Item.AlbumArtist });

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