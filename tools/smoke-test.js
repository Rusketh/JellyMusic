// Smoke test for logging and intent processors (non-Alexa environment)
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'TRACE';

// Minimal CONFIG for skill logic
global.CONFIG = {
  skill: { id: 'test-skill', name: 'Jelly Music' },
  jellyfin: { host: 'http://fake', key: 'FAKE', limit: 20 },
  name: 'Jelly Music'
};

const Log = require('../src/logger.js');
const Jelly = require('../src/jellyfin-api.js');

(async () => {
  Log.info('--- Smoke test start ---');

  // Stub search functions to deterministic results
  Jelly.Music = Jelly.Music || {};
  Jelly.Music.Search = async (query) => ({ status: true, items: [ { Name: 'Imagine', Id: 'song-1', AlbumArtist: 'John Lennon', Type: 'Audio' } ], index: 0, count: 1 });

  Jelly.Artists = Jelly.Artists || {};
  Jelly.Artists.Search = async (query) => ({ status: true, items: [ { Name: 'John Lennon', Id: 'artist-1' } ], index: 0, count: 1 });

  Jelly.Albums = Jelly.Albums || {};
  Jelly.Albums.Search = async (query) => ({ status: true, items: [ { Name: 'Imagine', Id: 'album-1', AlbumArtist: 'John Lennon' } ], index: 0, count: 1 });

  Jelly.MusicGenres = Jelly.MusicGenres || {};
  Jelly.MusicGenres.Search = async (query) => ({ status: true, items: [ { Name: 'Rock', Id: 'genre-1' } ], index: 0, count: 1 });

  // Fake Alexa request envelope for PlaySongIntent
  const envelope = {
    request: {
      type: 'IntentRequest',
      locale: 'en-US',
      intent: {
        name: 'PlaySongIntent',
        slots: {
          songname: { value: 'Imagine' },
          artistname: { value: 'John Lennon' }
        }
      }
    },
    context: { System: { device: { deviceId: 'dev-123' } } }
  };

  Log.info('[Alexa Request]', Log.requestSummary(envelope));

  // Simulate a search
  const songs = await Jelly.Music.Search('Imagine');
  Log.info('[Search] Song results:', Log.summarizeItems(songs.items, 8));
  Log.trace('[Search] Full song search result:', songs);

  // Simulate response that the skill would send
  const response = {
    outputSpeech: { type: 'PlainText', text: 'Playing Imagine by John Lennon, on Jelly Music' },
    directives: [ { type: 'AudioPlayer.Play', playBehavior: 'REPLACE_ALL', audioItem:{stream:{token:'song-1', offsetInMilliseconds:0}} } ],
    shouldEndSession: true
  };

  Log.info('[Alexa Response]', Log.responseSummary(response));

  Log.info('--- Smoke test finished ---');
})();
