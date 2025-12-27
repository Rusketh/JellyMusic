const PlayItem = function(handlerInput, playlist, item)
{
    if (!item || !item.Playback.Token) return false;

    if (playlist.playbackToken && playlist.playbackToken == item.Playback.Token)
        return false;

    handlerInput.responseBuilder.addAudioPlayerPlayDirective(
        'REPLACE_ALL',
        item.getStreamURL(),
        item.Playback.Token,
        item.Playback.Offset,
        null,
        item.getMetaData()
    );

    playlist.playbackToken = item.Playback.Token;

    return true;
};

const EnqueueItem = function(handlerInput, playlist, item)
{
    if (!item || !item.Token) return false;

    if (playlist.playbackToken && playlist.playbackToken == item.Playback.Token)
        return false;

    handlerInput.responseBuilder.addAudioPlayerPlayDirective(
        'ENQUEUE',
        item.getStreamURL(),
        item.Playback.Token,
        item.Playback.Offset,
        playlist.playbackToken,
        item.getMetaData()
    );

    playlist.playbackToken = item.Playback.Token;

    return true;
};

const StopPlayback = function(handlerInput)
{
    handlerInput.responseBuilder.addAudioPlayerStopDirective();

    return true;
};

const EndSession = function(handlerInput, playlist)
{
    return true;
};

module.exports = {
    PlayItem,
    EnqueueItem,
    StopPlayback,
    EndSession
};