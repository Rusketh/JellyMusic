const Config = require("/data/config.json").jellyfin;

const Alexa = require('ask-sdk-core');

const Queue = require("./db-queue.js");

const MusicQueue = require("./music-queue.js");

/*********************************************************************************
 * Meta Data for Screen enabled Devices
 * E.G: The app
 */

const GetImage = function(id, tag)
{
    if (!id) return null;

    const url = new URL(`Items/${id}/Images/Primary`, Config.host);
    if (tag) url.searchParams.append("tag", tag);

    return { sources: [ { url: url.toString() } ] };
};

const GetMetaData = function(item)
{
    if (!item) return null;

    const mt = {
        title: item.Name,
        subtitle: item.AlbumArtist
    };
    
    if (item.AlbumId && item.AlbumPrimaryImageTag)
        mt.art = GetImage(item.AlbumId, item.AlbumPrimaryImageTag);
    
    return mt;
};

/*********************************************************************************
 * ClearQueue
 */

const Launch = async function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    await MusicQueue.Clear(deviceID);
    
    console.log(`Launched: ${deviceID}`);

    return responseBuilder.addAudioPlayerClearQueueDirective("CLEAR_ALL").getResponse();
};

/*********************************************************************************
 * ClearQueue
 */

const ClearQueue = async function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    await MusicQueue.Clear(deviceID);
    
    console.log(`cleared queue on Alexa: ${deviceID}`);

    return responseBuilder.addAudioPlayerClearQueueDirective("CLEAR_ALL").getResponse();
};

/*********************************************************************************
 * Stop
 */

const Finished = async function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const current = await MusicQueue.GetCurrentItem(deviceID);

    if (current)
    {
        console.log(`Finished music on Alexa: ${current.item.Name} on ${deviceID}`);

        return responseBuilder.getResponse();
    }

    console.log(`Finished music on Alexa: ${deviceID}`);
};

/*********************************************************************************
 * Stop
 */

const Stop = async function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const current = await MusicQueue.GetCurrentItem(deviceID);

    if (current)
    {
        console.log(`Stopped music on Alexa: ${current.item.Name} on ${deviceID}`);

        return responseBuilder.getResponse();
    }

    console.log(`Stopped music on Alexa: ${deviceID}`);
};

/*********************************************************************************
 * Start
 */

const Start = async function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const current = await MusicQueue.GetCurrentItem(deviceID);

    if (current)
    {
        await Queue.SetPlayback(deviceID, current.queueID, 0);

        console.log(`Started music on Alexa: ${current.item.Name} on ${deviceID}`);

        return responseBuilder.getResponse();
    }

    console.log(`Started music on Alexa: ${deviceID}`);
};


/*********************************************************************************
 * Resume
 */

const Resume = async function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const current = await MusicQueue.GetCurrentItem(deviceID);

    if (current)
    {
        var time = 0;

        const {status, queueID, miliseconds} = await Queue.GetPlayback(deviceID);

        if (status && queueID == current.queueID)
            time = miliseconds;
        
        console.log(`Resuming music on Alexa: ${current.item.Name} on ${deviceID}`);

        return responseBuilder.addAudioPlayerPlayDirective('REPLACE_ALL', current.url, current.queueID, time, null, GetMetaData(current.item)).getResponse();
    }

    const speach = "There is currently no track playing.";
    return responseBuilder.speak(speach).getResponse();
};

/*********************************************************************************
 * Pause
 */

const Pause = async function(handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const current = await MusicQueue.GetCurrentItem(deviceID);

    if (current)
    {
        if (requestEnvelope.context.AudioPlayer)
            await Queue.SetPlayback(deviceID, current.queueID, requestEnvelope.context.AudioPlayer.offsetInMilliseconds || 0);
        
        console.log(`Pasuing music on Alexa: ${current.item.Name} on ${deviceID}`);
    }

    return responseBuilder.addAudioPlayerStopDirective().getResponse();
};

/*********************************************************************************
 * Queue Next
 */

const QueueNext = async function (handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const [current, next] = await MusicQueue.Next(deviceID);

    console.log(`Next Song Requested by Alexa: ${deviceID}`);

    if (current && next)
    {
        console.log(`Adding Item to Alexa Queue: ${next.item.Name} on ${deviceID}`);

        return responseBuilder.addAudioPlayerPlayDirective('ENQUEUE', next.url, next.queueID, 0, current.queueID, GetMetaData(next.item)).getResponse();
    }

    if (next)
    {
        console.log(`Playin Item on Alexa: ${next.item.Name} on ${deviceID}`);

        return responseBuilder.addAudioPlayerPlayDirective('REPLACE_ALL', next.url, next.queueID, 0, null, GetMetaData(next.item)).getResponse();
    }

    return responseBuilder.getResponse();
};

/*********************************************************************************
 * Play Next
 */

const PlayNext = async function (handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const [current, next] = await MusicQueue.Next(deviceID);

    if (current && next)
    {
        console.log(`Playin Item on Alexa: ${next.item.Name} on ${deviceID}`);

        return responseBuilder.addAudioPlayerPlayDirective('REPLACE_ALL', next.url, next.queueID, 0, null, GetMetaData(next.item)).getResponse();
    }

    if (Current)
    {
        const speach = "There is currently no tracks queued.";
        return responseBuilder.speak(speach).addAudioPlayerStopDirective().getResponse();
    }

    const speach = "There is currently no tracks queued.";
    return responseBuilder.speak(speach).getResponse();
};


/*********************************************************************************
 * Play Previous
 */

const PlayPrevious = async function (handlerInput)
{
    const { responseBuilder, requestEnvelope } = handlerInput;

    const deviceID = Alexa.getDeviceId(requestEnvelope);

    const [current, previous] = await MusicQueue.Previous(deviceID);

    if (current && previous)
    {
        console.log(`Playin Item on Alexa: ${previous.item.Name} on ${deviceID}`);

        return responseBuilder.addAudioPlayerPlayDirective('REPLACE_ALL', previous.url, previous.queueID, 0, null, GetMetaData(previous.item)).getResponse();
    }

    if (Current)
    {
        const speach = "There is currently no tracks queued.";
        return responseBuilder.speak(speach).addAudioPlayerStopDirective().getResponse();
    }

    const speach = "There is currently no tracks queued.";
    return responseBuilder.speak(speach).getResponse();
};

/*********************************************************************************
 * Queue Items
 */

const QueueItems = async function (handlerInput, items, speach)
{
    var { responseBuilder, requestEnvelope } = handlerInput;
    
    const deviceID = Alexa.getDeviceId(requestEnvelope);
    
    console.log(`queueing ${items.length} items on Alexa: ${deviceID}`);

    await MusicQueue.AddItems(deviceID, items);

    if (speach)
        responseBuilder = responseBuilder.speak(speach);
     
    return responseBuilder.getResponse();
};

/*********************************************************************************
 * Inject Items
 */

const InjectItems = async function (handlerInput, items, speach)
{
    var { responseBuilder, requestEnvelope } = handlerInput;
    
    const deviceID = Alexa.getDeviceId(requestEnvelope);
    
    console.log(`Playing ${items.length} items on Alexa: ${deviceID}`);

    await MusicQueue.InjectItems(deviceID, items);

    const [current, next] = await MusicQueue.Next(deviceID);

    if (!next) //In theory will never happen.
        return responseBuilder.getResponse();

    if (speach)
        responseBuilder = responseBuilder.speak(speach);
     
    return responseBuilder.addAudioPlayerPlayDirective('REPLACE_ALL', next.url, next.queueID, 0, null, GetMetaData(next.item)).getResponse();
};

/*********************************************************************************
 * Set Queue
 */

const SetQueue = async function (handlerInput, items, speach)
{
    var { responseBuilder, requestEnvelope } = handlerInput;
    
    const deviceID = Alexa.getDeviceId(requestEnvelope);
    
    console.log(`setting queue on Alexa: ${deviceID}`);

    await MusicQueue.Clear(deviceID);

    await MusicQueue.AddItems(deviceID, items);

    const [current, next] = await MusicQueue.Next(deviceID);

    if (!next) //In theory will never happen.
        return responseBuilder.getResponse();

    if (speach)
        responseBuilder = responseBuilder.speak(speach);
     
    return responseBuilder.addAudioPlayerPlayDirective('REPLACE_ALL', next.url, next.queueID, 0, null, GetMetaData(next.item)).getResponse();
};

/*********************************************************************************
 * Set Queue Shuffled
 */

const SetQueueShuffled = async function (handlerInput, items, speach)
{
    var { responseBuilder, requestEnvelope } = handlerInput;
    
    const deviceID = Alexa.getDeviceId(requestEnvelope);
    
    console.log(`setting queue on Alexa: ${deviceID}`);

    await MusicQueue.Clear(deviceID);

    await MusicQueue.AddShuffledItems(deviceID, items);

    const [current, next] = await MusicQueue.Next(deviceID);

    if (!next) //In theory will never happen.
        return responseBuilder.getResponse();

    if (speach)
        responseBuilder = responseBuilder.speak(speach);
     
    return responseBuilder.addAudioPlayerPlayDirective('REPLACE_ALL', next.url, next.queueID, 0, null, GetMetaData(next.item)).getResponse();
};

/*********************************************************************************
 * Exports
 */

module.exports = {
    Launch,
    ClearQueue,
    Finished,
    Stop,
    Start,
    Resume,
    Pause,
    QueueNext,
    PlayNext,
    PlayPrevious,
    QueueItems,
    InjectItems,
    SetQueue,
    SetQueueShuffled
};
