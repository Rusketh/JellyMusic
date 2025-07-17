const Config = require("/data/config.json");

const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api");

const Devices = require("../playlist/devices.js");

const { CreateQueueIntent } = require("./alexa-helper.js");

/*********************************************************************************
 * Process Intent: Get Song Intent
 */

const ProcessIntent = async function(handlerInput, action = "play") 
{
    const { requestEnvelope } = handlerInput;
    const intent = requestEnvelope.request.intent;
    const slots = intent.slots;

    if (!slots.songname || !slots.songname.value)
    {
        const speach = `I didn't catch the song name.`;
        return {status: false, speach};
    }

    console.log(`Requesting Song: ${slots.songname.value}`);

    const songs = await JellyFin.Music.Search(slots.songname.value);

    if (!songs.status || !songs.items[0])
    {
        const speach = `I didn't find a song called ${slots.songname.value}.`;
        return {status: false, speach};
    }

    var artist = undefined;
    var song = songs.items[0];

    if (slots.artistname && slots.artistname.value)
    {
        console.log(`Requesting Artist for Song: ${slots.artistname.value}`);

        const artists = await JellyFin.Artists.Search(slots.artistname.value);
        
        if (!artists.status || !artists.items[0])
        {
            const speach = `I didn't find an artist called ${slots.artistname.value}.`;
            return {status: false, speach};
        }

        artist = artists.items[0];

        if (song.AlbumArtist && song.AlbumArtist.toLowerCase() != artist.Name.toLowerCase())
        {

            song = undefined;

            for (var item of songs.items)
            {
                if (item.AlbumArtist && item.AlbumArtist.toLowerCase() == artist.Name.toLowerCase())
                {
                    console.log("Found ", item.Name);
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
                    
                    return {status: false, speach};
                }
                else
                {
                    const speach = `I didn't find a track called ${slots.albumname.value} by ${artist.name || slots.artistname.value}.`;
                    return {status: false, speach};
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
    "PlaySongIntent", "play",
    function (handlerInput, {items})
    {
        const { responseBuilder, requestEnvelope } = handlerInput;
        
        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.clear();

        playlist.prefixItems(items);

        const directive = playlist.getPlayDirective();

        var speach = `Playing ${items[0].Name}, on ${Config.name}`;
        
        if (song.AlbumArtist) speach = `Playing ${items[0].Name} by ${items[0].AlbumArtist}, on ${Config.skill.name}`;

        return responseBuilder.speak(speach).addAudioPlayerPlayDirective(...directive).getResponse();
    }
);

/*********************************************************************************
 * Queue Song Intent
 */

const QueueSongIntent = CreateQueueIntent(
    "QueueSongIntent", "queue",
    function (handlerInput, {items})
    {
        const { responseBuilder, requestEnvelope } = handlerInput;
        
        const deviceID = Alexa.getDeviceId(requestEnvelope);

        const playlist = Devices.getPlayList(deviceID);

        playlist.appendItems(items);

        const directive = playlist.getPlayDirective();

        var speach = `Added ${item[0].Name}, to the queue.`;
        
        if (item[0].AlbumArtist) speach = `Added ${item[0].Name} by ${item[0].AlbumArtist}, to the queue.`;

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
