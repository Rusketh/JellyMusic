const assert = require("node:assert");
const fs = require("node:fs");
const Log = require('./logger.js');

/*********************************************************************************
 * Splash
 */

Log.info("=====================================================================");
Log.info("           Jelly Music");
Log.info(`Current LOG_LEVEL: ${process.env.LOG_LEVEL || "INFO"}`);
Log.info("=====================================================================");

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
        port: "4141"
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
        Log.info(`Logger initialized (level=${Log.level})`);
        Log.info("Loading CONFIG File");
        
        CONFIG = JSON.parse(fs.readFileSync(CONFIG_FILE));
        
        Log.info("CONFIG File loaded successfully.");
    }
    else
    {
        Log.warn("CONFIG File not found, a new one will be generated using enviroment data.");
    }
}
catch(error)
{
    Log.error("Warning: Error loading CONFIG.json server will not start.");
    throw error;
}

/*********************************************************************************
 * Validate JellyFin CONFIG
 */

CONFIG.jellyfin.host = process.env.JELLYFIN_HOST || CONFIG.jellyfin.host;

assert(CONFIG.jellyfin.host, `No Jellyfin host address defined.\nThis can set in CONFIG under "jellyfin.host" or as enviroment value JELLYFIN_HOST.`);

CONFIG.jellyfin.key = process.env.JELLYFIN_KEY || CONFIG.jellyfin.key;

assert(CONFIG.jellyfin.key, `No Jellyfin api key defined.\nThis can set in CONFIG under "jellyfin.key" or as enviroment value JELLYFIN_KEY.`);

CONFIG.jellyfin.limit = process.env.JELLYFIN_LIMIT || CONFIG.jellyfin.limit || 10;

/*********************************************************************************
 * Validate Skill CONFIG
 */

CONFIG.skill.name = process.env.SKILL_NAME || CONFIG.skill.name;

assert(CONFIG.skill.name, `No skill name defined.\nThis can set in CONFIG under "skill.name" or as enviroment value SKILL_NAME.`);

//TODO: Skill name needs to be 2 words.

CONFIG.skill.id = process.env.SKILL_ID || CONFIG.skill.id;

assert(CONFIG.skill.id, `No skill id defined.\nThis can set in CONFIG under "skill.id" or as enviroment value SKILL_ID.`);

/*********************************************************************************
 * Validate Server CONFIG
 */

CONFIG.server.port = process.env.PORT || CONFIG.server.port;

assert(CONFIG.server.port, `No port defined.\nThis can set in CONFIG under "server.port" or as enviroment value PORT.`);

/*********************************************************************************
 * Confirm CONFIG
 */

//TODO: Validate Jellyfin API key

/*********************************************************************************
 * Save the CONFIG
 */

try
{
    Log.info("Saving CONFIG File");
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(CONFIG, undefined, 2));
}
catch(error)
{
    Log.error("Warning: Error saving CONFIG.json server will not start.");
    throw error;
}

/*********************************************************************************
 * Start the service.
 */

const { Save, Load } = require("./playlist/save-file.js");

Load().then(
    () => {

        setInterval(Save, 60000);

        Log.info("Loading Server....");

        require("./server.js");

    }
);


