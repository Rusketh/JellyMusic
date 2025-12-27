const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api");

const Devices = require("../playlist/devices.js");

const Player = require("../players/player.js");

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
        const speech = LANGUAGE.Value("SONG_NO_NAME");

        return [{status: false, speech}];
    }

    Logger.Debug(`[Music Request]`, `Requesting music ${slots.songname.value}.`);

    const songs = await JellyFin.Music.Search(slots.songname.value);

    if (!songs.status || !songs.items[0])
    {
        Logger.Debug(`[Music Request]`, "Music not found.");

        const speech = LANGUAGE.Parse("SONG_NOTFOUND_BY_NAME", {song_name: slots.songname.value});

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

            const speech = LANGUAGE.Parse("ARTIST_NOTFOUND_BY_NAME", {artist_name: slots.artistname.value});

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

                    Logger.Debug(`[Music Request]`, `Returning suggestion ${song.Name} by ${song.AlbumArtist}.`);

                    const speech = LANGUAGE.Parse("SONG_NOTFOUND_SUGGEST",
                        {
                            song_name: slots.songname.value,
                            artist_name: artist.name || slots.artistname.value,
                            suggestion_name: song.Name,
                            suggestion_artist: song.AlbumArtist
                        }
                    );
                    
                    return [{status: false, speech}];
                }
                else
                {
                    Logger.Debug(`[Music Request]`, "Music not found.");

                    const speech = LANGUAGE.Parse("SONG_NOTFOUND_BY_NAME_AND_ARTIST",
                        {
                            song_name: slots.songname.value,
                            artist_name: artist.name || slots.artistname.value
                        }
                    );
                    
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

        const item = playlist.getCurrentItem();

        if (!Player.PlayItem(handlerInput, playlist, item))
            return responseBuilder.getResponse();

        Logger.Info(`[Device ${playlist.Id}]`, `Playing ${item.Item.Name} by ${item.Item.AlbumArtist}`);


        var speech = LANGUAGE.Parse("SONG_PLAYING", { song_name: items[0].Name } );
                    
        if (items[0].AlbumArtist)
            speech = LANGUAGE.Parse("SONG_PLAYING_BY_ARTIST",
                {
                    song_name: items[0].Name,
                    song_artist: items[0].AlbumArtist
                }
            );

        return responseBuilder.speak(speech).getResponse();
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

        const item = playlist.getCurrentItem();

        if (Player.PlayItem(handlerInput, playlist, item))
            Logger.Info(`[Device ${playlist.Id}]`, `Playing ${item.Item.Name} by ${item.Item.AlbumArtist}`);

        var speech = LANGUAGE.Parse("SONG_QUEUED", { song_name: items[0].Name } );
                    
        if (items[0].AlbumArtist)
            speech = LANGUAGE.Parse("SONG_QUEUED_BY_ARTIST",
                {
                    song_name: items[0].Name,
                    song_artist: items[0].AlbumArtist
                }
            );

        return responseBuilder.speak(speech).getResponse();
    }
);

/*********************************************************************************
 * Exports
 */

module.exports = {
    PlaySongIntent,
    QueueSongIntent
};
