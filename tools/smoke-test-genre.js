// Simple smoke test for PlayGenreIntent

process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'TRACE';

// Minimal CONFIG for local testing
global.CONFIG = {
    jellyfin: {
        host: 'http://localhost',
        key: 'FAKE_KEY',
        limit: 10,
        genreCacheTtl: 1000 * 60
    },
    skill: { name: 'Jelly Music' }
};

const Log = require('../src/logger.js');
const JellyFin = require('../src/jellyfin-api.js');
const { PlayGenreIntent } = require('../src/skill/genre-intent.js');

// Monkeypatch JellyFin helpers for testing
JellyFin.MusicGenres.ResolveIdByName = async function(name) {
    Log.info(`[TestStub] ResolveIdByName called with '${name}'`);
    if (name.toLowerCase().includes('dance')) return 'genre-dance-1';
    return null;
};

JellyFin.Music = async function(params) {
    Log.info('[TestStub] Music called with params:', params);
    if (String(params.genreIds).includes('genre-dance-1')) {
        return { status: true, items: [ { Id: 'song-1', Name: 'Test Dance Song', Album: 'Test Album', Artist: 'DJ Test' } ], index: 0, count: 1 };
    }
    return { status: true, items: [], index: 0, count: 0 };
};

// Minimal fake handlerInput
const handlerInput = {
    requestEnvelope: {
        request: {
            type: 'IntentRequest',
            intent: {
                name: 'PlayGenreIntent',
                slots: {
                    genre: { value: 'dance' }
                }
            }
        },
        context: {
            System: {
                device: { deviceId: 'test-device-1' }
            }
        }
    },
    responseBuilder: {
        speech: null,
        directive: null,
        speak: function(text) { this.speech = text; return this; },
        reprompt: function(text) { this.reprompt = text; return this; },
        addAudioPlayerPlayDirective: function() { this.directive = true; return this; },
        getResponse: function() { return { speech: this.speech, directive: this.directive, reprompt: this.reprompt }; }
    }
};

(async function(){
    try {
        // Success case
        const res = await PlayGenreIntent.handle(handlerInput);
        console.log('SMOKE TEST RESULT:', res);

        // Failure case: unknown genre
        const handlerInput2 = JSON.parse(JSON.stringify(handlerInput));
        handlerInput2.requestEnvelope.request.intent.slots.genre.value = 'no-such-genre';
        // restore responseBuilder functions after JSON clone
        handlerInput2.responseBuilder = handlerInput.responseBuilder;
        const res2 = await PlayGenreIntent.handle(handlerInput2);
        console.log('SMOKE TEST RESULT (no match):', res2);
    } catch (e) {
        console.error('SMOKE TEST ERROR:', e);
    }
})();
