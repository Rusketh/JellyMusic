const assert = require("node:assert");

const path = require("node:path");

const fs = require("node:fs");

/******************************************************************************************
 * Validate Language File
 */

const LANG_FILE = path.join(__dirname, 'languages', `${CONFIG.language}.json`);

assert(fs.existsSync(LANG_FILE), `Invalid language selected (${CONFIG.language})\nThis can set in CONFIG under "language" or as enviroment value LANGUAGE.`)

/******************************************************************************************
 * Load Language Files
 */

const Language = require(LANG_FILE);

if (CONFIG.language != "EN")
    Object.apply({ }, require(`./languages/EN.json`), Language);

/******************************************************************************************
 * Get Value
 */

//const Value = (key) => Language[key] || "Unkown response";

const Value = function(key)
{
    if (Language[key])
        return Language[key];

    Logger.Warn(`Missing language key: ${key}`);
    return "Unkown response";
}

/******************************************************************************************
 * Parse
 */

const Parse = function(key, values)
{
    var result = Value(key);

    result = result.replaceAll("%skill_name%", CONFIG.skill.name);
    
    for (const key in values)
        result = result.replaceAll(`%${key}%`, values[key]);

    return result;
}

/******************************************************************************************
 * Exports
 */

module.exports = {
    Language,
    Value,
    Parse
};