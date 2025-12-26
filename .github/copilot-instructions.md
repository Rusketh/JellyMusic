# Copilot / AI Agent Instructions for Jelly Music

Quick, actionable guidance to help an AI coding agent be productive in this repository.

## Big picture (what this app does)
- Jelly Music is a self-hosted Alexa Music skill that proxies requests to a Jellyfin server and streams audio to Alexa devices.
- Main runtime pieces: startup/init (src/init.js) → server (src/server.js using ask-sdk + Express) → skill handlers (src/skill/*.js) → per-device playlists (src/playlist/*) → Jellyfin API client (src/jellyfin-api.js).
- Configuration and persistent state live in a data directory (`/data` inside container, `./data` in local runs). Config saved to `config.json`; per-device queues are saved as `*.jmp` files.

## How to run / debug locally
- Requirements: Node (use Node 18+ so `fetch` is supported), set required env vars (see below).
- Start locally: set env vars and run `node src/init.js` (init loads config, restores queues, then starts the Express+Alexa adapter server).
- Docker: README shows an example docker run and GHCR image (ghcr.io/rusketh/jellymusic/jellymusic).

## Required environment variables & important config
- JELLYFIN_HOST — public Jellyfin base URL (required).
- JELLYFIN_KEY — Jellyfin API key (required).
- SKILL_NAME — Alexa invocation name (defaults to "Jelly Music").
- SKILL_ID — Alexa Skill ID (required; skill is created in Alexa console and this value is enforced by SDK).
- PORT — local server port (defaults to 4141); your reverse proxy should handle HTTPS and port 443 externally.
- LOG_LEVEL — optional: ERROR, WARN, INFO, DEBUG, TRACE (see src/logger.js).

Note: `src/init.js` tries to read and write `config.json` in the data directory—ensure the folder is writable and mapped as a volume in containers.

## Project-specific patterns & conventions (read these before editing)
- Global configuration is intentionally stored in the global `CONFIG` object (set in `src/init.js`), and `DATA_DIR` is a global used by persistence code.
- Alexa handlers are modularized under `src/skill/`. Typical handler types:
  - Use `CreateIntent` / `CreateQueueIntent` / `CreateHandler` helpers in `src/skill/alexa-helper.js` to build intents/handlers.
  - Add your new Intent module and wire it into `src/skill/skill.js` (add to `.addRequestHandlers(...)`).
- Per-device state: `src/playlist/devices.js` registers and returns per-device PlayList objects. Use `getPlayList(deviceId)` to access or manipulate a device's queue.
- Jellyfin API helpers: `src/jellyfin-api.js` exposes typed helpers (e.g., `Items.Music.Search(query)`, `Items.Albums.ByGenre(query)`) — prefer these rather than calling raw endpoints.
- Queue persistence: `src/playlist/save-file.js` writes `.jmp` files in the data directory and restores them on startup. Expect batched requests to Jellyfin using `CONFIG.jellyfin.limit`.

## Common code conventions and gotchas
- Error handling pattern: handler callback functions return Alexa responses via `responseBuilder.*` helpers and use `Log.error(...)` for errors.
- Response objects used by processor functions frequently follow a `{status: boolean, speach?: string, prompt?: string}` convention — note the repository uses the `speach` spelling consistently (search/maintain existing usage when editing).
- Avoid logging secrets (API keys / token strings) — logger intentionally warns about this.
- The project relies on `fetch` (global) in `src/jellyfin-api.js` — ensure runtime supports it (Node 18+ or polyfill during development).
- Files in `src/` occasionally have small issues (examples: typos like `speach`, crypto usage in `save-file.js`). If you change these, run the app to validate behavior and adjust tests (none provided).

## How to add a new Intent (example)
1. Create a new file in `src/skill/` that imports helper(s):
   - `const { CreateIntent } = require('./alexa-helper.js');`
2. Implement a processor or responder using existing patterns (see `song-intents.js` for `CreateQueueIntent` usage).
3. Export the intent handler and register it in `src/skill/skill.js` within `addRequestHandlers(...)`.

Example (pattern):
- See `src/skill/song-intents.js` — it uses `CreateQueueIntent("PlaySongIntent", "play", Processor, responder)`; follow this when building queue-based intents.

## Architecture notes for PR reviewers / maintainers
- init.js must run before server.js because it sets global CONFIG and restores queues; changing require order can break startup.
- `src/server.js` mounts Alexa express adapter on POST `/` and a simple GET `/` health check; Alexa skill endpoint must point to the container's public address.

## Tests & CI
- There are no automated tests or CI config in the repo presently. When adding behavior-critical changes, prefer local integration runs (node src/init.js + developer Alexa skill/webhook pointing to a publicly accessible endpoint via ngrok or reverse proxy).

## Where to look for examples / related code
- Intent examples: `src/skill/song-intents.js`, `album-intents.js`, `artist-intents.js`.
- Playback & queue logic: `src/playlist/*.js` and `src/playlist/save-file.js`.
- API calls & search behavior: `src/jellyfin-api.js`.
- Startup/config patterns: `src/init.js` and `ReadMe.md`.

---
If any part of this guide is unclear or you'd like more examples (e.g., a template for a new intent or a short checklist for local debugging), tell me which area to expand and I will iterate.