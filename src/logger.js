/*********************************************************************************
 * Global Log Levels
 */

LOGLEVEL_ERROR = 0;
LOGLEVEL_WARN = 1;
LOGLEVEL_INFO = 2;
LOGLEVEL_DEBUG = 3;

/*********************************************************************************
 * Output Loggers
 */

const Outputs = {
    [LOGLEVEL_ERROR]: console.error,
    [LOGLEVEL_WARN]: console.warn,
    [LOGLEVEL_INFO]: console.info,
    [LOGLEVEL_DEBUG]: console.debug
};

/*********************************************************************************
 * 
 */

const Log = function(level = -1, ...args)
{
    //Check Logging Option.
    if (level > CONFIG.log_level || level > LOGLEVEL_DEBUG)
        return;

    //Log to correct output.
    Outputs[level](...args);

    //Future option: Log out errors.txt 
}; 

/*********************************************************************************
 * Logger Wrappers for quicknes
 */

const Error = (...args) => Log(LOGLEVEL_ERROR, ...args)

const Warn = (...args) => Log(LOGLEVEL_WARN, ...args)

const Info = (...args) => Log(LOGLEVEL_INFO, ...args)

const Debug = (...args) => Log(LOGLEVEL_DEBUG, ...args)

/*********************************************************************************
 * Exports
 */

module.exports = {
    Log,
    Error,
    Warn,
    Info,
    Debug
}