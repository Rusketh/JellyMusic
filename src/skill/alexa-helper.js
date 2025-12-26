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
                    const {requestEnvelope} = handlerInput;
                    return Alexa.getRequestType(requestEnvelope) === type;
                }
                catch(err)
                {
                    Logger.Error(`Error in handler canHandle("${type}"):`);
                    Logger.Error(err);

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
                    Logger.Error(`Error in handler handle("${type}"):`);
                    Logger.Error(err);

                    const speech = `An interal error has occured.`;
                    return responseBuilder.speak(speech).getResponse();
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
                    Logger.Error(`Error in intent canHandle("${intent}"):`);
                    Logger.Error(err);

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
                    Logger.Error(`Error in intent handle("${intent}"):`);
                    Logger.Error(err);

                    const speech = `An interal error has occured, request not processed.`;
                    return responseBuilder.speak(speech).getResponse();
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
                var {speech, prompt} = result;
                
                if (speech && prompt)
                    return responseBuilder.speak(speech).reprompt(prompt).getResponse();

                if (speech)
                    return responseBuilder.speak(speech).getResponse();
                
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