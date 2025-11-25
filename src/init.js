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

//TODO: CONFIG.skill.id maybe needed if I ever add automatic skill building.

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
    console.log("Saving CONFIG File");
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(CONFIG, undefined, 2));
}
catch(error)
{
    console.error("Warning: Error saving CONFIG.json server will not start.");
    throw error;
}

/*********************************************************************************
 * Start the service.
 */

const { Save, Load } = require("./playlist/save-file.js");

Load().then(
    () => {

        setInterval(Save, 60000);

        console.log("Loading Server....");

        require("./server.js");

    }
);


