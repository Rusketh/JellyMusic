const Config = require("/data/config.json");

const Alexa = require('ask-sdk-core');

const JellyFin = require("../jellyfin-api");

const AlexaQueue = require("../queue/alexa-queque.js");

const { CreateIntent } = require("./alexa-helper.js");

/*********************************************************************************
 * Process Intent: Get Genre Intent
 */

const ProcessIntent = async function(handlerInput, action = "play") 
{
    const { requestEnvelope } = handlerInput;
    const intent = requestEnvelope.request.intent;
    const slots = intent.slots;

    if (!slots.genre || !slots.genre.value)
    {
        const speach = `I didn't catch the genre of music.`;
        return {status: false, speach};
    }

    console.log(`Requesting Genre: ${slots.genre.value}`);

    const genres = await JellyFin.MusicGenres.Search(slots.genre.value);
        
    if (!genres.status || !genres.items[0])
    {
        const speach = `I didn't find a genre called ${slots.genre.value}.`;
        return {status: false, speach};
    }

    const songs = await JellyFin.Music({genres: genres.items.map(item => item.Name).join("|"), limit: 100});
    
    if (!songs.status || !songs.items[0])
    {
        const speach = `No songs of ${slots.genre.value} where found.`;
        return {status: false, speach};
    }

    return {status: true, genres: genres.items, songs: songs.items};
};

/*********************************************************************************
 * Create Genre Intent Handler
 */

const CreateGenreIntent = function(intent, action, callback)
{
    return CreateIntent(
        intent,
        async function (handlerInput)
        {
            const { responseBuilder } = handlerInput;

            const result = await ProcessIntent(handlerInput, action);

            if (!result.status)
            {
                var {speach, prompt} = result;
                
                if (speach && prompt)
                {
                    console.warn(`Intent("${intent}"): ${speach}`);
                    return responseBuilder.speak(speach).reprompt(prompt).getResponse();
                }

                if (speach)
                {
                    console.warn(`Intent("${intent}"): ${speach}`);
                    return responseBuilder.speak(speach).getResponse();
                }

                console.warn(`Intent("${intent}"): No response.`);
                return responseBuilder.getResponse();
            }

            return await callback(handlerInput, result);
        }
    );
};

/*********************************************************************************
 * Play Playlist Intent
 */

const PlayGenreIntent = CreateGenreIntent(
    "PlayGenreIntent", "play",
    async function (handlerInput, {genres, songs})
    {

        var speach = `Playing ${genres[0].Name}, on ${Config.skill.name}`;

        if (genres.length > 1)
            var speach = `Playing ${genres[0].Name} and simular genre's, on ${Config.skill.name}`;

        return await AlexaQueue.InjectItems(handlerInput, songs, speach);
    }
);

/*********************************************************************************
 * Play Playlist Intent
 */

const ShuffleGenreIntent = CreateGenreIntent(
    "ShuffleGenreIntent", "shuffling",
    async function (handlerInput, {genres, songs})
    {
        var speach = `Shuffling ${genres[0].Name}, on ${Config.skill.name}`;

        if (genres.length > 1)
            var speach = `Shuffling ${genres[0].Name} and simular genre's, on ${Config.skill.name}`;

        return await AlexaQueue.SetQueueShuffled(handlerInput, songs, speach);
    }
);

/*********************************************************************************
 * Queue Playlist Intent
 */

const QueueGenreIntent = CreateGenreIntent(
    "QueueGenreIntent", "queue",
    async function (handlerInput, {genres, songs})
    {
        var speach = `Added ${songs.length}, ${genres[0].Name} songs, to the queue.`;

        if (genres.length > 1)
            var speach = `Added ${songs.length}, ${genres[0].Name} and simular songs, to the queue.`;
        
        return await AlexaQueue.QueueItems(handlerInput, songs, speach);
    }
);


/*********************************************************************************
 * Exports
 */

module.exports = {
    PlayGenreIntent,
    ShuffleGenreIntent,
    QueueGenreIntent
};