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
                    const {requestEnvelope, responseBuilder} = handlerInput;

                    if (CONFIG.skill.id != requestEnvelope.context.System.application.applicationId)
                    {
                        console.error("Unauthorized request blocked.");
                        responseBuilder.withShouldEndSession(true);
                        return false;
                    }

                    return Alexa.getRequestType(requestEnvelope) === type;
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
                    const {requestEnvelope, responseBuilder} = handlerInput;

                    if (CONFIG.skill.id != requestEnvelope.context.System.application.applicationId)
                    {
                        console.error("Unauthorized request blocked.");
                        responseBuilder.withShouldEndSession(true);
                        return false;
                    }

                    return Alexa.getRequestType(requestEnvelope) === 'IntentRequest' && Alexa.getIntentName(requestEnvelope) === intent;
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
                var {speach, prompt} = result;
                
                if (speach && prompt)
                    return responseBuilder.speak(speach).reprompt(prompt).getResponse();

                if (speach)
                    return responseBuilder.speak(speach).getResponse();
                
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