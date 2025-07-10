const assert = require("node:assert");
const fs = require("node:fs");

/*********************************************************************************
 * Splash
 */

console.log("=====================================================================");
console.log("           Jelly Music");
console.log("=====================================================================");

/*********************************************************************************
 * Create default config
 */

var Config = {
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
 * Load existing config file
 */

try
{
    if (fs.existsSync("/data/config.json"))
    {
        console.log("Loading Config File");
        
        Config = JSON.parse(fs.readFileSync("/data/config.json"));
        
        console.log("Config File loaded sucessfully.");
    }
    else
    {
        console.warn("Config File not found, a new one will be generated using enviroment data.");
    }
}
catch(error)
{
    console.error("Warning: Error loading config.json server will not start.");
    throw error;
}

/*********************************************************************************
 * Validate JellyFin Config
 */

Config.jellyfin.host = process.env.JELLYFIN_HOST || Config.jellyfin.host;

assert(Config.jellyfin.host, `No Jellyfin host address defined.\nThis can set in config under "jellyfin.host" or as enviroment value JELLYFIN_HOST.`);

Config.jellyfin.key = process.env.JELLYFIN_KEY || Config.jellyfin.key;

assert(Config.jellyfin.key, `No Jellyfin api key defined.\nThis can set in config under "jellyfin.key" or as enviroment value JELLYFIN_KEY.`);

/*********************************************************************************
 * Validate Skill Config
 */

Config.skill.name = process.env.SKILL_NAME || Config.skill.name;

assert(Config.skill.name, `No skill name defined.\nThis can set in config under "skill.name" or as enviroment value SKILL_NAME.`);

//TODO: Skill name needs to be 2 words.

//TODO: Config.skill.id maybe needed if I ever add automatic skill building.

/*********************************************************************************
 * Validate Server Config
 */

Config.server.port = process.env.PORT || Config.server.port;

assert(Config.server.port, `No port defined.\nThis can set in config under "server.port" or as enviroment value PORT.`);

/*********************************************************************************
 * Confirm Config
 */

//TODO: Validate Jellyfin API key

/*********************************************************************************
 * Save the config
 */


try
{
    console.log("Saving Config File");
    fs.writeFileSync("/data/config.json", JSON.stringify(Config, undefined, 2));
}
catch(error)
{
    console.error("Warning: Error saving config.json server will not start.");
    throw error;
}


/*********************************************************************************
 * Start the service.
 */

console.log("Loading Server....");

require("./server.js");