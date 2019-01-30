'use strict';

/**
 * This Lambda function is modified based on the 'OrderFlowers' sample Lambda function and
 * is designed for a chatbot that provides dining suggestions.
 *
 */

// --------------- Helpers to build responses which match the structure of the necessary dialog actions -----------------------

function elicitSlot(sessionAttributes, intentName, slots, slotToElicit, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'ElicitSlot',
            intentName,
            slots,
            slotToElicit,
            message,
        },
    };
}

// Used for elicit slots
function delegate(sessionAttributes, slots) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Delegate',
            slots,
        },
    };
}

// Used for fulfillment of Greeting and ThankYou intents
function close(sessionAttributes, fulfillmentState, message) {
    return {
        sessionAttributes,
        dialogAction: {
            type: 'Close',
            fulfillmentState,
            message,
        },
    };
}

// Return a randomized hello message
const selectHello = function() {
    let helloArray = [
        'Hi! I am your dining service chatbot. How can I help?',
        'Hi there! I am your dining service chatbot. What can I do for you?',
        'Hello! I am your dining service chatbot. Let me know how can I help today?',
        'Hi there. I am your dining service chatbot. What can I do for you?'
    ];
    let randomNumber = Math.floor(Math.random() * 4);

    return helloArray[randomNumber];
};

// Return a randomized goodbye message
const selectThank = function() {
    let thankArray = [
        'You are welcome!',
        'My pleasure.',
        'You are welcome. Goodbye.',
        'Thanks for stopping by.'
    ];
    let randomNumber = Math.floor(Math.random() * 4);

    return thankArray[randomNumber];
};

// ---------------- Helper Functions --------------------------------------------------

/*function parseLocalDate(date) {
    /**
     * Construct a date object in the local timezone by parsing the input date string, assuming a YYYY-MM-DD format.
     * Note that the Date(dateString) constructor is explicitly avoided as it may implicitly assume a UTC timezone.
     */
   /* const dateComponents = date.split(/\-/);
    return new Date(dateComponents[0], dateComponents[1] - 1, dateComponents[2]);
}

function isValidDate(date) {
    try {
        return !(isNaN(parseLocalDate(date).getTime()));
    } catch (err) {
        return false;
    }
}*/

function buildValidationResult(isValid, violatedSlot, messageContent) {
    if (messageContent == null) {
        return {
            isValid,
            violatedSlot,
        };
    }
    return {
        isValid,
        violatedSlot,
        message: { contentType: 'PlainText', content: messageContent },
    };
}



function validateSlot(cuisine, location, email) {

    // Check whether it is a valid cuisine type, this list is from Google search result
    if (cuisine) {
        const CuisineTypes = ['chinese', 'japanese', 'indian', 'thailand', 'korean', 'mexico', 'american'];
        if (CuisineTypes && CuisineTypes.indexOf(cuisine.toLowerCase()) === -1) {
            return buildValidationResult(false, 'Cuisine', `We currently do not support ${cuisine} as a valid cuisine. Can you try a different one?`);
        }
    }
    
    // Check whether email is valid
    if (email) {
        if (email.indexOf('@') === -1) {
            return buildValidationResult(false, 'Email', `${email} is not a valid email address. Please provide another one. `);
        }
    }
    
    return buildValidationResult(true, null, null);
}





// --------------- Functions that control the bot's behavior -----------------------

/**
 * Performs dialog management for dining suggestions. This Lambda function doesn't contain fulfillment.
 */
function recommendRestaurant(intentRequest, callback) {

    // Get the information in each slot:
    const cuisine = intentRequest.currentIntent.slots.Cuisine;
    const location = intentRequest.currentIntent.slots.Location;
    const email = intentRequest.currentIntent.slots.Email;
    const source = intentRequest.invocationSource;

    if (source === 'DialogCodeHook') {
        // Perform basic validation on the supplied input slots.
        // Use the elicitSlot dialog action to re-prompt for the first violation detected.
        const slots = intentRequest.currentIntent.slots;

        // Check each parameter
        const validationResult = validateSlot(cuisine, location, email);

        if (!validationResult.isValid) {    // If invalid slot exists, buildValidationResult will set isValid to false
            slots[`${validationResult.violatedSlot}`] = null;   // reset the invalid slot
            // request the invalid slot again
            callback(elicitSlot(intentRequest.sessionAttributes, intentRequest.currentIntent.name, slots, validationResult.violatedSlot, validationResult.message));
            return;
        }
    }

    // If the slots are valid, respond to customer
    const outputSessionAttributes = intentRequest.sessionAttributes || {};
    callback(delegate(outputSessionAttributes, intentRequest.currentIntent.slots));
    return;

}

/**
 * Generate random Hello for GreetingIntent.
 */
function randomHello(intentRequest, callback) {

    // Send a random hello message back
    callback(close(intentRequest.sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: selectHello()}));
}



/**
 * Generate random Thank for ThankYouIntent.
 */
function randomThank(intentRequest, callback) {

    // Send a random hello message back
    callback(close(intentRequest.sessionAttributes, 'Fulfilled',
        { contentType: 'PlainText', content: selectThank()}));
}




// --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);
    console.log(JSON.stringify(intentRequest.currentIntent.slots))

    const intentName = intentRequest.currentIntent.name;

    // Dispatch to intent handlers, just deal with Dining Suggestions Intent
    if (intentName === 'Book') {
        return recommendRestaurant(intentRequest, callback);
    }else if (intentName === 'Greeting'){ // Greeting intent
        return randomHello(intentRequest, callback);
    }else if (intentName === 'Bye'){ // ThankYou intent
        return randomThank(intentRequest, callback);
    }

    throw new Error(`Intent with name ${intentName} not supported`);
}





// --------------- Main handler -----------------------

// Route the incoming request based on intent.
// The JSON body of the request is provided in the event slot.
exports.handler = (event, context, callback) => {
    try {
        // By default, treat the user request as coming from the America/New_York time zone.
        process.env.TZ = 'America/New_York';
        console.log(`event.bot.name=${event.bot.name}`);

        dispatch(event, (response) => callback(null, response));
    } catch (err) {
        callback(err);
    }
};