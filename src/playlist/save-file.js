const {limit} = CONFIG.jellyfin;

const JellyFin = require("../jellyfin-api");

const Devices = require("../playlist/devices.js");

const PlayListItem = require("./item.js");

const PlayList = require("./playlist.js");

const crypto = require("crypto");

const fs = require("fs");

/*********************************************************************************
 * Save Device Queue
 */

const SaveDeviceQueue = async function(playlist)
{
    let queue = [ ];

    for (let item of playlist.Queue)
        queue.push(
            {
                id: item.Item.Id,
                token: item.Playback.Token,
                isPaused: item.Playback.IsPaused,
                offset: item.Playback.Offset
            }
        );

    const hash = crypto.hash('sha1', playlist.Device);
    
    return fs.promises.writeFile(
        `${DATA_DIR}/${hash}.jmp`,
        JSON.stringify(
            {
                deviceID: playlist.Device,
                position: playlist.Position,
                token: playlist.playbackToken,
                queue
            },
            2
        )
    );
};

/*********************************************************************************
 * Save All Device Queues
 */

const Save = function()
{
    const promises = [];

    for(let playlist of Devices.All())
    {
        if (!playlist.Dirty || playlist.Saving)
            continue;

        const promise = SaveDeviceQueue(playlist).then(
            () => {
                console.log("Saved Device Queue: ", playlist.Device);
                playlist.Dirty = false;
                playlist.Saving = false;
            }
        );

        promises.push(promise);
    }

    return Promise.all(promises);
};


/*********************************************************************************
 * Load Device queue
 */

const LoadDeviceQueue = async function({deviceID, position, token, queue})
{
    console.log("Restoring Device Queue: ", deviceID);

    const songs = { };
    const itemIDs = queue.map(({id}) => id);

    for (let i = 0; i < itemIDs.length; i += limit)
    {
        const {status, items} = await JellyFin.Music({ ids: itemIDs.splice(i, i + limit).join(",") });
        
        if (!status)
            continue;

        items.forEach(item => songs[item.Id] = item);
    }

    const playList = Devices.getPlayList(deviceID);
    playList.playbackToken = token;

    for(let {id, token, isPaused, offset} of queue)
    {
        let song = songs[id];

        if (!song)
            continue;

        let queued = PlayListItem.new(song, token);
        queued.Playback.IsPaused = isPaused;
        queued.Playback.Offset = offset;

        if (isPaused || token == playList.playbackToken)
        {
            if (!isPaused)
                queued.Playback.IsPlaying = true;

            playList.Position = playList.Queue.length;
        }

        playList.Queue.push(queued);
    }

    console.log("Device Queue Restored: ", deviceID);
};

/*********************************************************************************
 * Load Device queues
 */

const Load = async function()
{
    const promises = [];
    const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith(".jmp"));
    
    for(let file of files)
    {
        const promise = fs.promises.readFile(`${DATA_DIR}/${file}`).then(
            (data) => LoadDeviceQueue(JSON.parse(data))
        );

        promises.push(promise);
    }

    return Promise.all(promises);
};

/*********************************************************************************
 * Exports
 */

module.exports = {
    Save,
    Load
};
