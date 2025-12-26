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
  Log.info('--- Smoke test (no-results) start ---');

  // Stub search functions to deterministic empty results
  Jelly.Music = Jelly.Music || {};
  Jelly.Music.Search = async (query) => ({ status: true, items: [], index: 0, count: 0 });

  Jelly.Artists = Jelly.Artists || {};
  Jelly.Artists.Search = async (query) => ({ status: false, items: [], index: 0, count: 0 });

  // Mock handlerInput for PlaySongIntent
  const handlerInput = {
    requestEnvelope: {
      request: {
        type: 'IntentRequest',
        intent: {
          name: 'PlaySongIntent',
          slots: {
            songname: { value: 'NoSuchSong' }
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

  // Call the handler
  await SongIntents.PlaySongIntent.handle(handlerInput);

  Log.info('--- Smoke test (no-results) finished ---');
})();