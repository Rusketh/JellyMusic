/*********************************************************************************
 * Logger (LOG_LEVEL)
 *
 * Controlled via environment variable LOG_LEVEL.
 * Supported levels (least -> most verbose):
 *   ERROR, WARN, INFO, DEBUG, TRACE
 *
 * Notes:
 * - Avoid logging secrets (API keys, tokens, full stream URLs with auth params).
 * - Use Log.redactUrl() for any URL that may contain credentials.
 * - Use Log.summarizeItems() to log compact result lists.
 *********************************************************************************/

const LEVELS = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3, TRACE: 4 };

function normalizeLevel(level) {
    const v = String(level || "INFO").trim().toUpperCase();
    return LEVELS[v] !== undefined ? v : "INFO";
}

const ACTIVE_LEVEL = normalizeLevel(process.env.LOG_LEVEL);
const ACTIVE_NUM = LEVELS[ACTIVE_LEVEL];

function ts() {
    return new Date().toISOString();
}

function shouldLog(level) {
    return LEVELS[level] <= ACTIVE_NUM;
}

// Redact common credential query params and headers that sometimes leak into URLs.
function redactUrl(input) {
    try {
        const u = new URL(String(input));
        const SENSITIVE_KEYS = [
            "api_key", "apikey", "token", "access_token", "signature",
            "X-MediaBrowser-Token", "MediaBrowser", "Authorization"
        ];
        for (const k of SENSITIVE_KEYS) {
            if (u.searchParams.has(k)) u.searchParams.set(k, "REDACTED");
        }
        return u.toString();
    } catch {
        // If it's not a URL, do a conservative string redact.
        return String(input)
            .replace(/(api_key=)[^&\s]+/gi, "$1REDACTED")
            .replace(/(token=)[^&\s]+/gi, "$1REDACTED")
            .replace(/(access_token=)[^&\s]+/gi, "$1REDACTED");
    }
}

// Compact list formatter for Jellyfin items.
function summarizeItems(items, max = 10) {
    if (!items) return "items=<null>";
    if (!Array.isArray(items)) return `items=<non-array:${typeof items}>`;
    if (items.length === 0) return "items=0";
    const shown = items.slice(0, max).map((it) => {
        const name = it?.Name || it?.name || "<no-name>";
        const id = it?.Id || it?.id || "";
        const artist = (it?.AlbumArtist || it?.Artists?.[0] || it?.ArtistItems?.[0]?.Name || "");
        const type = it?.Type || it?.type || "";
        const bits = [name];
        if (artist) bits.push(`by ${artist}`);
        if (type) bits.push(`[${type}]`);
        if (id) bits.push(`(${id})`);
        return bits.join(" ");
    });
    const more = items.length > max ? ` … (+${items.length - max} more)` : "";
    return `items=${items.length}: ${shown.join(" | ")}${more}`;
}

// Compact slots formatter used for request logging
function summarizeSlots(slots) {
    if (!slots) return {};

    const out = {};
    for (const [k, v] of Object.entries(slots)) {
        out[k] = {
            value: v?.value,
            resolved: v?.resolutions?.resolutionsPerAuthority?.[0]?.values?.[0]?.value?.name
        };
    }
    return out;
}

// Summarize an Alexa RequestEnvelope for logging
function requestSummary(envelope) {
    if (!envelope || !envelope.request) return { request: envelope };
    const req = envelope.request;
    const type = req.type;
    const base = { type, locale: req.locale };
    if (type === 'IntentRequest' && req.intent) {
        base.intent = req.intent.name;
        base.slots = summarizeSlots(req.intent.slots);
    }
    if (req.device) base.device = req.device;
    return base;
}

// Summarize an Alexa response object for logging
function responseSummary(response) {
    if (!response) return {response: null};

    const out = {};

    try {
        if (response.outputSpeech) {
            if (response.outputSpeech.type === 'SSML') out.speech = { ssml: response.outputSpeech.ssml };
            else out.speech = { text: response.outputSpeech.text };
        }

        if (response.reprompt && response.reprompt.outputSpeech) {
            out.reprompt = response.reprompt.outputSpeech.type === 'SSML' ? { ssml: response.reprompt.outputSpeech.ssml } : { text: response.reprompt.outputSpeech.text };
        }

        out.directives = (response.directives || []).map(d => ({ type: d.type }));

        out.shouldEndSession = response.shouldEndSession;

        // include a bit more for audio player directives
        out.audioPlay = (response.directives || []).filter(d => d.type && d.type.startsWith('AudioPlayer')).map(d => ({
            type: d.type,
            playBehavior: d.playBehavior,
            token: d.playBehavior ? (d.audioItem?.stream?.token || null) : (d.token || null),
            offset: d.audioItem?.stream?.offsetInMilliseconds || null
        }));
    }
    catch (err) {
        // Best-effort - don't let logging break the skill
        return { error: 'failed to summarize response', err: String(err) };
    }

    return out;
}

function emit(level, ...args) {
    if (!shouldLog(level)) return;
    // keep output parseable
    const prefix = `[${ts()}][${level}]`;
    console.log(prefix, ...args);
}

const Log = {
    level: ACTIVE_LEVEL,

    error: (...args) => emit("ERROR", ...args),
    warn:  (...args) => emit("WARN",  ...args),
    info:  (...args) => emit("INFO",  ...args),
    debug: (...args) => emit("DEBUG", ...args),
    trace: (...args) => emit("TRACE", ...args),

    redactUrl,
    summarizeItems,
    summarizeSlots,
    requestSummary,
    responseSummary
};

module.exports = Log;
