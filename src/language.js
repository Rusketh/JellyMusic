const assert = require("node:assert");

const fs = require("node:fs");

/******************************************************************************************
 * Validate Language File
 */

const LANG_FILE = `./languages/${CONFIG.language}.json`;

assert(fs.existsSync(LANG_FILE), `Invalid language selected (${CONFIG.language})\nThis can set in CONFIG under "language" or as enviroment value LANGUAGE.`)

/******************************************************************************************
 * Load Language Files
 */

const Language = require(LANG_FILE);

if (CONFIG.language != "EN")
    Object.apply(Language, require(`./languages/EN.json`));

/******************************************************************************************
 * Get Value
 */

const Value = (key) => Language[key] || "Unkown response";

/******************************************************************************************
 * Parse
 */

const Parse = function(key, values)
{
    var result = Value(key);

    result = result.replace("%skill_name%", CONFIG.skill.name);
    
    for (const key in values)
        result = result.replace(`%${key}%`, values[key]);

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