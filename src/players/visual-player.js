//For the Love of Sanity - Please sombody rewrite the APL Player for me.

const APLDocument = require("../apl/audio-player.json");

const ShowAPL = function(handlerInput, playlist, item)
{
    //if (playlist.APLOpen)
    //    return false;

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
                        coverImageSource: item.getArtURL(),
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

const PlayItem = function(handlerInput, playlist, item)
{
    if (!item || !item.Playback.Token) return false;

    ShowAPL(handlerInput, playlist, item);

    return true;
};


/*
    I FAILED TO GET THIS TO WORK SO FOR NOW JUST REFRESH
    if (!ShowAPL(handlerInput, playlist, item))
        return true;

    Logger.Debug(`[Device ${playlist.Id}]`, "Updating APL Audioplayer");

    handlerInput.responseBuilder.addDirective(
        {
            type: "Alexa.Presentation.APL.ExecuteCommands",
            token: "musicToken", 
            commands: [
                {
                    "type": "SetValue",
                    "componentId": "Audio_PrimaryText",
                    "property": "text",
                    "value": item.Item.Name
                },
                {
                    "type": "SetValue",
                    "componentId": "Audio_SecondaryText",
                    "property": "text",
                    "value": item.Item.AlbumArtist
                },
                {
                    "type": "PlayMedia",
                    "componentId": "videoPlayer",
                    "source": item.getStreamURL(),
                    "audioTrack": "background"
                },
                {
                    "type": "ControlMedia",
                    "componentId": "videoPlayer",
                    "command": "seek",
                    "value": item.Playback.Offset 
                },
                {
                    "type": "ControlMedia",
                    "componentId": "videoPlayer",
                    "command": "play"
                }
            ]
        }
    );

    return true;
};*/

const EnqueueItem = function(handlerInput, playlist, item)
{
    return false;
};

const StopPlayback = function(handlerInput)
{
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

const EndSession = function(handlerInput, playlist)
{
    playlist.APLOpen = false;

    return true;
};

module.exports = {
    PlayItem,
    EnqueueItem,
    StopPlayback,
    EndSession
};