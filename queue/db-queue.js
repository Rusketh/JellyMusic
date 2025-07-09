const crypto = require("node:crypto");

const { DatabaseSync } = require('node:sqlite');

/*********************************************************************************
 * Create SQLIte DB
 */

const Database = new DatabaseSync("./data/database.db");

/*********************************************************************************
 * Create SQL Table
 */

try
{
    const query = `CREATE TABLE IF NOT EXISTS queue(
        key INTEGER PRIMARY KEY AUTOINCREMENT,
        position INT DEFAULT 0,
        itemID VARCHAR(64),
        queueID VARCHAR(64),
        deviceID VARCHAR(512),
        queued BOOLEAN DEFAULT TRUE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`;

    Database.exec(query);

    console.log("Databse Queue table ensured.");
}
catch (error)
{
    console.error("Failed to create queue table:");
    console.error(error);
}

/*********************************************************************************
 * ClearQueue
 */

const ClearQueue = async function(deviceID)
{
    try
    {
        const query = `DELETE FROM queue WHERE deviceID = ?`;
        
        const result = Database.prepare(query).run(deviceID);

        console.log(`Cleared queue for deviceID: ${deviceID}. Rows affected: ${result.changes || 'unknown'}`);

        return {status: true, changes: result.changes || 0};
    }
    catch (error)
    {
        console.error(`Error clearing queue for deviceID ${deviceID}:`);
        console.error(error);

        return {status: false};
    }
};

/*********************************************************************************
 * Fremove From Queue
 */

const RemoveFromQueue = async function(deviceID, queueID)
{
    try
    {
        const query = `DELETE FROM queue WHERE deviceID = ? AND queueID = ?`;
        
        const result = Database.prepare(query).run(deviceID, queueID);

        console.log(`Removed ${queueID} from queue for deviceID: ${deviceID}. Rows affected: ${result.changes || 'unknown'}`);

        return {status: true, changes: result.changes || 0};
    }
    catch (error)
    {
        console.error(`Error removeing ${queueID} from queue for deviceID ${deviceID}:`);
        console.error(error);

        return {status: false};
    }
};


/*********************************************************************************
 * Get Track From Queue
 */

const GetTrack = async function(deviceID, isQueued = false, offset = 0) {
    try
    {
        const query = `
            SELECT key, itemID, queueID, deviceID, queued, position
            FROM queue
            WHERE
                deviceID = $deviceID AND
                queued = $isQueued
            ORDER BY
                position DESC
            LIMIT 1 OFFSET $offset;`;

        const result = Database.prepare(query).get({
            $deviceID: deviceID,
            $isQueued: isQueued ? 1 : 0,
            $offset: offset
        });

        if (!result)
            return { status: true, track: null };

        const { itemID, queueID, position } = result;

        return { status: true, position, itemID, queueID, deviceID };

    }
    catch (error)
    {
        console.error(`Error fetching track for device ${deviceID}, queued: ${isQueued}, offset: ${offset}.`);
        console.error(error);

        return { status: false };
    }
};

/*********************************************************************************
 * AddToQueue
 */

const AddToQueue = async function(deviceID, itemID, position = 0)
{
    try
    {
        const queueID = crypto.randomUUID();

        const query = `INSERT INTO queue (position, queueID, itemID, deviceID) VALUES (?, ?, ?, ?)`;

        const result = Database.prepare(query).run(position, queueID, itemID, deviceID);

        console.log(`Successfully inserted item ${itemID} into queue. (${result.lastInsertRowid})`);
        
        return {status: true, queueID, deviceID, itemID, key: result.lastInsertRowid};
    }
    catch(error)
    {
        console.error(`Error inserting ${itemID} into queue for ${deviceID}:`);
        console.error(error);

        return {status: false};
    }
};

/*********************************************************************************
 * AddToQueue
 */

const SetQueuedStatus = async function(deviceID, queueID, value)
{
    try
    {
        const query = `
            UPDATE queue
            SET queued = $value
            WHERE deviceID = $deviceID AND queueID = $queueID
        `;

        const result = Database.prepare(query).run({
                $value: value ? 1 : 0,
                $deviceID: deviceID,
                $queueID: queueID
            });

        if (result.changes > 0)
        {
            console.log(`Updated queued status for device ${deviceID}, queueID ${queueID} to ${value}. Rows affected: ${result.changes}`);
            return { status: true, changes: result.changes };
        } 

        console.log(`No rows updated for device ${deviceID}, queueID ${queueID}. Item not found or status already set.`);
        
        return { status: true, changes: 0 };
    }
    catch(error)
    {
        console.error(`Error changing status of ${queueID} into for ${deviceID}:`);
        console.error(error);

        return {status: false};
    }
};

/*********************************************************************************
 * Get Current Queue
 */

const GetQueue = async function(deviceID)
{
    try
    {
        const query = `
        SELECT key, itemID, queueID, deviceID, queued, position
        FROM queue
        WHERE
            deviceID = $deviceID AND
            queued = TRUE
        ORDER BY
            position DESC;`;

        const items = [ ];
        const results = Database.prepare(query).all({ $deviceID: deviceID });

        if (results)
            for(var { position, itemID, queueID } in results)
                items.push({ status: true, position, itemID, queueID, deviceID })
        
        return {status: true, items};
    }
    catch(error)
    {
        console.error(`Error changing status of ${queueID} into for ${deviceID}:`);
        console.error(error);

        return {status: false};
    }
};

/*********************************************************************************
 * Get Top Queue Position
 */

const GetLastPosition = async function(deviceID)
{
    try
    {
        const query = `
            SELECT position
            FROM queue
            WHERE
                deviceID = $deviceID
            ORDER BY
                position DESC
            LIMIT 1;`;

        const result = Database.prepare(query).get({$deviceID: deviceID});

        return { status: true, position: result ? result.position : 0 };

    }
    catch (error)
    {
        console.error(`Error fetching last position for device ${deviceID}.`);
        console.error(error);

        return { status: false, position: 0 };
    }
};

/*********************************************************************************
 * Shuffle Queue
 */

const ShuffleItems = function(items)
{
    const values = items.map((item) => item.position);
        
    for (let i = values.length - 1; i > 0; i--)
    {   //Fisher-Yates Shuffle
        const j = Math.floor(Math.random() * (i + 1))
        [values[i], values[j]] = [values[j], values[i]];
    }

    items.forEach((item) => item.position = values.pop());
    
    items.sort((a, b) => a.position - b.position);

    return items;
};

const ShuffleQueue = async function(deviceID)
{
    try
    {
        const {status, items} = await GetQueue(deviceID);

        if (!status || !items || items.length === 0)
            return {status: false};

        ShuffleItems(items);

        try
        {
            Database.exec("BEGIN;");
            
            const query = `UPDATE queue SET position = $position WHERE deviceID = $deviceID AND queueID = $queueID;`;
            const update = Database.prepare(query);

            for(var {queueID, position} of items)
                update.run({
                    $deviceID: deviceID,
                    $queueID: queueID,
                    $position: position
                });

            Database.exec("COMMIT;");

            return {status: true};
        }
        catch(error)
        {
            Database.exec("ROLLBACK;");
            
            throw error;
        }
    }
    catch (error)
    {
        console.error(`Error shuffling queue for device ${deviceID}.`);
        console.error(error);

        return {status: false};
    }
};

/*********************************************************************************
 * Shift Queue
 */

const ShiftQueue = async function(deviceID, position = 0, offset = 1)
{
    try
    {
        const query = `
            UPDATE queue
            SET
                queued = queued + $offset
            WHERE
                deviceID = $deviceID AND
                position >= $position;
        `;

        Database.prepare(query).run({
            $deviceID: deviceID,
            $position: position,
            $offset: offset
        });

        return {status: true};
    }
    catch(error)
    {
        console.error(`Error shifting queue for device ${deviceID}.`);
        console.error(error);

        return {status: false};
    }
};

/*********************************************************************************
 * Exports
 */

module.exports = {
    ClearQueue,
    RemoveFromQueue,
    GetTrack,
    AddToQueue,
    SetQueuedStatus,
    GetLastPosition,
    ShuffleItems,
    ShuffleQueue,
    ShiftQueue
};