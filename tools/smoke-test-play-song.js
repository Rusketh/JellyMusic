process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'TRACE';

global.CONFIG = {
  skill: { id: 'test-skill', name: 'Jelly Music' },
  jellyfin: { host: 'http://fake', key: 'FAKE', limit: 20 },
  name: 'Jelly Music'
};

const Log = require('../src/logger.js');
const Jelly = require('../src/jellyfin-api.js');
const SongIntents = require('../src/skill/song-intents.js');

(async () => {
  Log.info('--- Smoke test (play-song) start ---');

  Jelly.Music = Jelly.Music || {};
  Jelly.Music.Search = async (query) => ({ status: true, items: [ { Name: 'Imagine', Id: 'song-1', AlbumArtist: 'John Lennon', Type: 'Audio' } ], index: 0, count: 1 });

  Jelly.Artists = Jelly.Artists || {};
  Jelly.Artists.Search = async (query) => ({ status: true, items: [ { Name: 'John Lennon', Id: 'artist-1' } ], index: 0, count: 1 });

  const handlerInput = {
    requestEnvelope: {
      request: {
        type: 'IntentRequest',
        intent: {
          name: 'PlaySongIntent',
          slots: {
            songname: { value: 'Imagine' },
            artistname: { value: 'John Lennon' }
          }
        },
        locale: 'en-US'
      },
      context: { System: { device: { deviceId: 'dev-123' } } }
    },
    responseBuilder: {
      _speech: null,
      _reprompt: null,
      _directives: [],
      speak: function (text) { this._speech = text; return this; },
      reprompt: function (text) { this._reprompt = text; return this; },
      addAudioPlayerPlayDirective: function() { return this; },
      getResponse: function () { return { outputSpeech: this._speech ? { type: 'PlainText', text: this._speech } : undefined, reprompt: this._reprompt ? { outputSpeech: { type: 'PlainText', text: this._reprompt } } : undefined, directives: this._directives }; }
    }
  };

  const response = await SongIntents.PlaySongIntent.handle(handlerInput);

  Log.info('[Test] Response:', response);

  Log.info('--- Smoke test (play-song) finished ---');
})();