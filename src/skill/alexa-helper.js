const Alexa = require('ask-sdk-core');
const Log = require('../logger.js');
const { tFor } = require('./i18n');

/*********************************************************************************
 * Create Handler
 */

const CreateHandler = function(type, callback)
{
    return {
        canHandle:
            function (handlerInput)
            {
                try
                {
                    const {requestEnvelope} = handlerInput;
                    return Alexa.getRequestType(requestEnvelope) === type;
                }
                catch(err)
                {
                    Log.error(`Error in handler canHandle("${type}"):`);
                    Log.error(err);

                    return false;
                }
            },

        handle:
            async function (handlerInput)
            {
                const { responseBuilder, requestEnvelope } = handlerInput;

                try
                {
                    const result = await callback(handlerInput);

                    try {
                        Log.debug('[Handler] Response Summary:', Log.responseSummary(result));
                    } catch (e) {
                        /* ignore logging errors */
                    }

                    return result;
                }
                catch(err)
                {
                    Log.error(`Error in handler handle("${type}"):`
);
                    Log.error(err);

                    const speach = tFor(handlerInput, 'ERROR_GENERIC');
                    return responseBuilder.speak(speach).getResponse();
                }
            }
    }
};

/*********************************************************************************
 * Create Intent Handler
 */

const CreateIntent = function(intent, callback)
{
    return {
        canHandle:
            function (handlerInput)
            {
                try
                {
                    const {requestEnvelope} = handlerInput;

                    return Alexa.getRequestType(requestEnvelope) === 'IntentRequest' && Alexa.getIntentName(requestEnvelope) === intent;
                }
                catch(err)
                {
                    Log.error(`Error in intent canHandle("${intent}"):`);
                    Log.error(err);

                    return false;
                }
            },

        handle:
            async function (handlerInput)
            {
                const { responseBuilder, requestEnvelope } = handlerInput;

                try
                {
                    // Log canonical intent & slots for easier debugging
                    try {
                        const intentName = requestEnvelope?.request?.intent?.name;
                        const slots = requestEnvelope?.request?.intent?.slots;
                        Log.info(`[Intent] ${intentName}`, Log.summarizeSlots(slots));
                    } catch (e) { /* swallow logging errors */ }

                    const result = await callback(handlerInput);

                    try {
                        Log.debug('[Intent] Response Summary:', Log.responseSummary(result));
                    } catch (e) {
                        /* ignore logging errors */
                    }

                    return result;
                }
                catch(err)
                {
                    Log.error(`Error in intent handle("${intent}"):`);
                    Log.error(err);

                    const speach = tFor(handlerInput, 'ERROR_GENERIC');
                    return responseBuilder.speak(speach).getResponse();
                }
            }
    }
};

/*********************************************************************************
 * Create Queue Intent Handler
 */

const CreateQueueIntent = function(intent, action, processor, responder, buildQueue, submit)
{
    return CreateIntent(
        intent,
        async function (handlerInput)
        {
            const data = { };

            const { responseBuilder } = handlerInput;

            const [result, then] = await processor(handlerInput, action, buildQueue, submit);

            if (!result.status)
            {
                // Log processor failure and what speech we will send back (if any)
                try { Log.info(`[Intent:${intent}] Processor returned failure`, result); } catch (e) { }

                var {speach, prompt} = result;
                
                if (speach && prompt) {
                    try { Log.info(`[Intent:${intent}] Responding with speach & prompt`, { speach, prompt }); } catch(e){}
                    return responseBuilder.speak(speach).reprompt(prompt).getResponse();
                }

                if (speach) {
                    try { Log.info(`[Intent:${intent}] Responding with speach`, speach); } catch(e){}
                    return responseBuilder.speak(speach).getResponse();
                }
                
                try { Log.info(`[Intent:${intent}] Processor returned false with no speach`); } catch(e){}
                return responseBuilder.getResponse();
            }

            //Process first stage of queue and get alexas feed back.
            const response = await responder(handlerInput, result, data);

            if (then) then(data); //Start generating the rest of queue

            return response;
        }
    );
};

/*********************************************************************************
 * Exports
 */

module.exports = {
    CreateHandler,
    CreateIntent,
    CreateQueueIntent
};