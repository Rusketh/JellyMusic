const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api");

const Devices = require("../playlist/devices.js");

const { CreateQueueIntent } = require("./alexa-helper.js");

/*********************************************************************************
 * Process Intent: Get Song Intent
 */

const Processor = async function(handlerInput, action = "play") 
{
    const { requestEnvelope } = handlerInput;
    const intent = requestEnvelope.request.intent;
    const slots = intent.slots;

    if (!slots.songname || !slots.songname.value)
    {
        const speech = `I didn't catch the song name.`;
        return [{status: false, speech}];
    }

    Logger.Debug(`[Music Request]`, `Requesting music ${slots.songname.value}.`);

    const songs = await JellyFin.Music.Search(slots.songname.value);

    if (!songs.status || !songs.items[0])
    {
        Logger.Debug(`[Music Request]`, "Music not found.");

        const speech = `I didn't find a song called ${slots.songname.value}.`;

        return [{status: false, speech}];
    }

    var artist = undefined;
    var song = songs.items[0];

    if (slots.artistname && slots.artistname.value)
    {
        Logger.Debug(`[Music Request]`, `Requesting artist ${slots.artistname.value}.`);

        const artists = await JellyFin.Artists.Search(slots.artistname.value);
        
        if (!artists.status || !artists.items[0])
        {
            Logger.Debug(`[Music Request]`, "No artist found.");

            const speech = `I didn't find an artist called ${slots.artistname.value}.`;

            return [{status: false, speech}];
        }

        artist = artists.items[0];

        if (song.AlbumArtist && song.AlbumArtist.toLowerCase() != artist.Name.toLowerCase())
        {

            song = undefined;

            for (var item of songs.items)
            {
                if (item.AlbumArtist && item.AlbumArtist.toLowerCase() == artist.Name.toLowerCase())
                {
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

                    Logger.Debug(`[Music Request]`, `Returning suggestion ${suggestion}.`);

                    const speech = `I didn't find a track called ${slots.songname.value} by ${artist.name || slots.artistname.value}, you might have meant ${suggestion}.`;
                    
                    return [{status: false, speech}];
                }
                else
                {
                    Logger.Debug(`[Music Request]`, "Music not found.");

                    const speech = `I didn't find a track called ${slots.albumname.value} by ${artist.name || slots.artistname.value}.`;
                    
                    return [{status: false, speech}];
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

        var speech = `Playing ${items[0].Name}, on ${CONFIG.name}`;
        
        if (items[0].AlbumArtist) speech = `Playing ${items[0].Name} by ${items[0].AlbumArtist}, on ${CONFIG.skill.name}`;

        return responseBuilder.speak(speech).addAudioPlayerPlayDirective(...directive).getResponse();
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

        var speech = `Added ${items[0].Name}, to the queue.`;
        
        if (items[0].AlbumArtist) speech = `Added ${items[0].Name} by ${items[0].AlbumArtist}, to the queue.`;

        return responseBuilder.speak(speech).addAudioPlayerPlayDirective(...directive).getResponse();
    }
);

/*********************************************************************************
 * Exports
 */

module.exports = {
    PlaySongIntent,
    QueueSongIntent
};
