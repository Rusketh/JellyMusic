const Log = require('../../logger.js');

function langFromLocale(locale) {
    if (!locale) return 'en';
    return String(locale).split('-')[0].toLowerCase();
}

const cache = {};

function load(lang) {
    if (cache[lang]) return cache[lang];
    try {
        cache[lang] = require(`./${lang}.json`);
    } catch (e) {
        Log.warn(`[i18n] Missing locale file for '${lang}', falling back to 'en'`);
        cache[lang] = {};
    }
    return cache[lang];
}

function interpolate(template, params = {}) {
    if (typeof template !== 'string') return '';
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => (params[k] !== undefined ? String(params[k]) : ''));
}

function t(localeOrLang, key, params) {
    const lang = (localeOrLang && localeOrLang.indexOf('-') > -1) ? langFromLocale(localeOrLang) : (localeOrLang || 'en');
    const dict = load(lang);
    const fallback = load('en');

    let template = dict[key] || fallback[key];
    if (!template) {
        Log.debug(`[i18n] Missing key '${key}' for lang '${lang}'`);
        return key;
    }
    return interpolate(template, params);
}

function tFor(handlerInput, key, params) {
    try {
        const locale = handlerInput?.requestEnvelope?.request?.locale || handlerInput?.requestEnvelope?.locale || 'en';
        return t(locale, key, params);
    } catch (e) {
        return t('en', key, params);
    }
}

module.exports = { t, tFor };
