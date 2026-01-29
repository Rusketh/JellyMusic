//For the Love of Sanity - Please sombody rewrite the APL Player for me.

const APLDocument = require("../apl/audio-player.json");

/*********************************************************************************
 * Show APL Player
 */

const ShowAPL = function (handlerInput, playlist, item) {

    handlerInput.responseBuilder.addDirective(
        {
            type: 'Alexa.Presentation.APL.RenderDocument',
            token: "musicToken",
            document: APLDocument,
            datasources:
            {
                audioPlayerData:
                {
                    type: "object",
                    properties:
                    {
                        backgroundImage: item.getArtURL(),
                        //coverImageSource: item.getArtURL(), //For now this is ugly :D
                        primaryText: item.Item.Name,
                        secondaryText: item.Item.AlbumArtist,
                        audioSources: {
                            url: item.getStreamURL(),
                            offset: item.Playback.Offset,
                            duration: item.Playback.Runtime
                        }
                    }
                }
            }
        }
    );

    Logger.Debug(`[Device ${playlist.Id}]`, "Showing APL Audioplayer");

    playlist.APLOpen = true;

    return false;
}

/*********************************************************************************
 * Player Functions
 */

const PlayItem = function (handlerInput, playlist, item) {
    if (!item || !item.Playback.Token) return false;

    ShowAPL(handlerInput, playlist, item);

    return true;
};

/*********************************************************************************
 * No Queue Support for current APL Player
 */

const EnqueueItem = function (handlerInput, playlist, item) {
    return false;
};

/*********************************************************************************
 * Stop Playback
 */

const StopPlayback = function (handlerInput) {
    handlerInput.responseBuilder.addDirective(
        {
            type: 'Alexa.Presentation.APL.ExecuteCommands',
            token: "musicToken",
            commands: [
                {
                    type: "ControlMedia",
                    componentId: "videoPlayer",
                    command: "pause"
                }
            ]
        }
    );

    return true;
};

/*********************************************************************************
 * End Session
 */

const EndSession = function (handlerInput, playlist) {
    playlist.APLOpen = false;

    return true;
};

/*********************************************************************************
 * Exports
 */

module.exports = {
    PlayItem,
    EnqueueItem,
    StopPlayback,
    EndSession
};