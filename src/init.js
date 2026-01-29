const assert = require("node:assert");
const fs = require("node:fs");

/*********************************************************************************
 * Splash
 */

console.log("=====================================================================");
console.log("           Jelly Music");
console.log("=====================================================================");

/*********************************************************************************
 * Create default CONFIG
 */

CONFIG = {
    jellyfin:
    {
        
    },
    skill:
    {
        id: null,
        name: "Jelly Music"
    },
    server:
    {
        port: "60648"
    }
};

/*********************************************************************************
 * 
 */

DATA_DIR = "/data";

if (!fs.existsSync(DATA_DIR))
{
    DATA_DIR = "./data";
    assert(fs.existsSync(DATA_DIR), "Data directory not found.");
}

/*********************************************************************************
 * Load existing CONFIG file
 */

CONFIG_FILE = `${DATA_DIR}/config.json`;

try
{   
    if (fs.existsSync(CONFIG_FILE))
    {
        console.log("Loading CONFIG File");
        
        CONFIG = JSON.parse(fs.readFileSync(CONFIG_FILE));
        
        console.log("CONFIG File loaded sucessfully.");
    }
    else
    {
        console.warn("CONFIG File not found, a new one will be generated using enviroment data.");
    }
}
catch(error)
{
    console.error("Warning: Error loading CONFIG.json server will not start.");
    throw error;
}

/*********************************************************************************
 * Load Logging Module
 */

Logger = require("./logger.js");

CONFIG.log_level = process.env.LOG_LEVEL || CONFIG.log_level || LOGLEVEL_WARN;

assert(CONFIG.log_level >= LOGLEVEL_ERROR && CONFIG.log_level <= LOGLEVEL_DEBUG, `Invalid log level (must be set between ${LOGLEVEL_ERROR} and ${LOGLEVEL_DEBUG}); This can set in CONFIG under "jellyfin.log_level" or as enviroment value LOG_LEVEL.`)

Logger.Info(`Logging level set to: ${CONFIG.log_level}`);

/*********************************************************************************
 * Language Setting
 */

CONFIG.language = process.env.LANGUAGE || CONFIG.language || "EN";

LANGUAGE = require("./language.js");

/*********************************************************************************
 * Validate JellyFin CONFIG
 */

CONFIG.jellyfin.host = process.env.JELLYFIN_HOST || CONFIG.jellyfin.host;

assert(CONFIG.jellyfin.host, `No Jellyfin host address defined.\nThis can set in CONFIG under "jellyfin.host" or as enviroment value JELLYFIN_HOST.`);

//Used to query the local server over the network and not the internet.
CONFIG.jellyfin.local = process.env.JELLYFIN_LOCAL || CONFIG.jellyfin.local || CONFIG.jellyfin.host;

CONFIG.jellyfin.key = process.env.JELLYFIN_KEY || CONFIG.jellyfin.key;

assert(CONFIG.jellyfin.key, `No Jellyfin api key defined.\nThis can set in CONFIG under "jellyfin.key" or as enviroment value JELLYFIN_KEY.`);

CONFIG.jellyfin.limit = process.env.JELLYFIN_LIMIT || CONFIG.jellyfin.limit || 50;

/*********************************************************************************
 * Validate Skill CONFIG
 */

CONFIG.skill.name = process.env.SKILL_NAME || CONFIG.skill.name;

assert(CONFIG.skill.name, `No skill name defined.\nThis can set in CONFIG under "skill.name" or as enviroment value SKILL_NAME.`);

assert(CONFIG.skill.name.match(/^([a-zA-Z]+) ([a-zA-Z]+)$/), `Skill name must be two words.\nThis can set in CONFIG under "skill.name" or as enviroment value SKILL_NAME.`);

CONFIG.skill.id = process.env.SKILL_ID || CONFIG.skill.id;

assert(CONFIG.skill.id, `No skill id defined.\nThis can set in CONFIG under "skill.id" or as enviroment value SKILL_ID.`);

/*********************************************************************************
 * Validate Server CONFIG
 */

CONFIG.server.port = process.env.PORT || CONFIG.server.port;

assert(CONFIG.server.port, `No port defined.\nThis can set in CONFIG under "server.port" or as enviroment value PORT.`);

/*********************************************************************************
 * Save the CONFIG
 */

try
{
    Logger.Info("[Configuration]", "Saving.");
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(CONFIG, undefined, 2));
}
catch(error)
{
    Logger.Warn("[CRITICAL]", "Error saving CONFIG.json server will not start.");
    throw error;
}

/*********************************************************************************
 * Start the service.
 */

const { Save, Load } = require("./playlist/save-file.js");

Load().then(
    () => {

        setInterval(Save, 60000);

        Logger.Info("[HTTP SERVER]", "Loading");

        require("./server.js");

    }
);


