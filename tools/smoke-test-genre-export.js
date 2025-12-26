// Quick smoke test to verify ResolveIdByName is exported on Items.MusicGenres

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

const Items = require('../src/jellyfin-api.js');

console.log('typeof Items.MusicGenres:', typeof Items.MusicGenres);
console.log('typeof Items.MusicGenres.ResolveIdByName:', typeof Items.MusicGenres.ResolveIdByName);
console.log('typeof Items.MusicGenres.Search:', typeof Items.MusicGenres.Search);
