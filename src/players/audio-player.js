const PlayItem = function(handlerInput, playlist, item)
{
    if (!item || !item.Playback.Token) return false;

    Logger.Debug(`[Device ${playlist.Id}]`, `PlayItem: ${item.Playback.Token} vs ${playlist.playbackToken}.`);

    if (playlist.playbackToken && playlist.playbackToken == item.Playback.Token)
    {
        Logger.Debug(`[Device ${playlist.Id}]`, `Playback token ${item.Playback.Token} is already playing.`);
        return false;
    }    

    handlerInput.responseBuilder.addAudioPlayerPlayDirective(
        'REPLACE_ALL',
        item.getStreamURL(),
        item.Playback.Token,
        item.Playback.Offset,
        null,
        item.getMetaData()
    );

    playlist.playbackToken = item.Playback.Token;
    Logger.Debug(`[Device ${playlist.Id}]`, `Playing playback token ${item.Playback.Token}.`);

    return true;
};

const EnqueueItem = function(handlerInput, playlist, item)
{
    if (!item || !item.Playback.Token) return false;

    Logger.Debug(`[Device ${playlist.Id}]`, `EnqueueItem: ${item.Playback.Token} vs ${playlist.playbackToken}.`);

    if (playlist.playbackToken && playlist.playbackToken == item.Playback.Token) {
        Logger.Debug(`[Device ${playlist.Id}]`, `Playback token ${item.Playback.Token} is already enqueued.`);
        return false;
    }

    handlerInput.responseBuilder.addAudioPlayerPlayDirective(
        'ENQUEUE',
        item.getStreamURL(),
        item.Playback.Token,
        item.Playback.Offset,
        playlist.playbackToken,
        item.getMetaData()
    );

    playlist.playbackToken = item.Playback.Token;
    Logger.Debug(`[Device ${playlist.Id}]`, `Enqueued playback token ${item.Playback.Token}.`);

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