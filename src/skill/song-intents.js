const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api");

const Devices = require("../playlist/devices.js");

const { CreateQueueIntent } = require("./alexa-helper.js");
const Log = require('../logger.js');

/*********************************************************************************
 * Process Intent: Get Song Intent
 */

const Processor = async function(handlerInput, action = "play") 
{
    const { requestEnvelope } = handlerInput;
    const intent = requestEnvelope.request.intent;
    const slots = intent.slots;

    Log.debug('[NLU] Intent: PlaySongIntent/QueueSongIntent');
    Log.debug('[NLU] Raw slots:', Object.fromEntries(Object.entries(slots || {}).map(([k,v]) => [k, {value: v?.value, resolved: v?.resolutions?.resolutionsPerAuthority?.[0]?.values?.[0]?.value?.name}])));

    if (!slots.songname || !slots.songname.value)
    {
        const speach = `I didn't catch the song name.`;
        return [{status: false, speach}];
    }

    Log.info(`Requesting Song: ${slots.songname.value}`);

    const songs = await JellyFin.Music.Search(slots.songname.value);

    // Log search results for debugging
    try { Log.info('[Search] Song results:', Log.summarizeItems(songs.items, 8)); Log.trace('[Search] Full song search result:', songs); } catch (e) { }

    if (!songs.status || !songs.items[0])
    {
        const speach = `I didn't find a song called ${slots.songname.value}.`;
        return [{status: false, speach}];
    }

    var artist = undefined;
    var song = songs.items[0];

    if (slots.artistname && slots.artistname.value)
    {
        Log.info(`Requesting Artist for Song: ${slots.artistname.value}`);

        const artists = await JellyFin.Artists.Search(slots.artistname.value);

        try { Log.info('[Search] Artist results:', Log.summarizeItems(artists.items, 6)); Log.trace('[Search] Full artist search result:', artists); } catch (e) { }
        
        if (!artists.status || !artists.items[0])
        {
            const speach = `I didn't find an artist called ${slots.artistname.value}.`;
            return [{status: false, speach}];
        }

        artist = artists.items[0];

        if (song.AlbumArtist && song.AlbumArtist.toLowerCase() != artist.Name.toLowerCase())
        {

            song = undefined;

            for (var item of songs.items)
            {
                if (item.AlbumArtist && item.AlbumArtist.toLowerCase() == artist.Name.toLowerCase())
                {
                    Log.info("Found ", item.Name);
                    album = item;
                    break;
                }
            }

            if (!song)
            {
                song = songs.items[0];
                
                if (song && song.AlbumArtist)
                {
                    const suggestion = `${song.Name} by ${song.AlbumArtist}`;

                    const speach = `I didn't find a track called ${slots.songname.value} by ${artist.name || slots.artistname.value}, you might have meant ${suggestion}.`;
                    
                    return [{status: false, speach}];
                }
                else
                {
                    const speach = `I didn't find a track called ${slots.albumname.value} by ${artist.name || slots.artistname.value}.`;
                    return [{status: false, speach}];
                }
            }
        }
    }

    return [{status: true, artist, items: [song]}];
};

/*********************************************************************************
 * Play Song Intent
 */

const PlaySongIntent = CreateQueueIntent(
    "PlaySongIntent", "play", Processor,
    function (handlerInput, {items})
    {
        const { responseBuilder, requestEnvelope } = handlerInput;
        
        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.clear();

        playlist.prefixItems(items);

        const directive = playlist.getPlayDirective();

        var speach = `Playing ${items[0].Name}, on ${CONFIG.name}`;
        
        if (items[0].AlbumArtist) speach = `Playing ${items[0].Name} by ${items[0].AlbumArtist}, on ${CONFIG.skill.name}`;

        return responseBuilder.speak(speach).addAudioPlayerPlayDirective(...directive).getResponse();
    }
);

/*********************************************************************************
 * Queue Song Intent
 */

const QueueSongIntent = CreateQueueIntent(
    "QueueSongIntent", "queue", Processor,
    function (handlerInput, {items})
    {
        const { responseBuilder, requestEnvelope } = handlerInput;
        
        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.appendItems(items);

        const directive = playlist.getPlayDirective();

        var speach = `Added ${items[0].Name}, to the queue.`;
        
        if (items[0].AlbumArtist) speach = `Added ${items[0].Name} by ${items[0].AlbumArtist}, to the queue.`;

        return responseBuilder.speak(speach).addAudioPlayerPlayDirective(...directive).getResponse();
    }
);

/*********************************************************************************
 * Exports
 */

module.exports = {
    PlaySongIntent,
    QueueSongIntent
};
