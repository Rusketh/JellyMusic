const Alexa = require('ask-sdk-core');

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
                    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'type';
                }
                catch(err)
                {
                    console.error(`Error in handler canHandle("${type}"):`);
                    console.error(err);

                    return false;
                }
            },

        handle:
            async function (handlerInput)
            {
                const { responseBuilder } = handlerInput;

                try
                {
                    return await callback(handlerInput);
                }
                catch(err)
                {
                    console.error(`Error in handler handle("${type}"):`);
                    console.error(err);

                    const speach = `An interal error has occured.`;
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
                    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' && Alexa.getIntentName(handlerInput.requestEnvelope) === intent;
                }
                catch(err)
                {
                    console.error(`Error in intent canHandle("${intent}"):`);
                    console.error(err);

                    return false;
                }
            },

        handle:
            async function (handlerInput)
            {
                const { responseBuilder } = handlerInput;

                try
                {
                    return await callback(handlerInput);
                }
                catch(err)
                {
                    console.error(`Error in intent handle("${intent}"):`);
                    console.error(err);

                    const speach = `An interal error has occured, request not processed.`;
                    return responseBuilder.speak(speach).getResponse();
                }
            }
    }
};

/*********************************************************************************
 * Exports
 */

module.exports = {
    CreateHandler,
    CreateIntent
};