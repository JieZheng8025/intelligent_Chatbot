'use strict';

/**
 * This Lambda function is invoked during fulfillment period of Amazon Lex.
 *
 */

// Load the SDK for JavaScript
var AWS = require('aws-sdk');

// Set the region
AWS.config.update({region: 'us-east-1'});

// create an SQS service object
var sqs = new AWS.SQS({apiVersion: '2012-11-05'});

// Construct the response to Lex
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


// --------------- Functions that control the bot's behavior -----------------------

/**
 * Performs fulfillment.
 */
function recommendRestaurant(intentRequest, callback) {

    const cuisine = intentRequest.currentIntent.slots.Cuisine;
    const location= intentRequest.currentIntent.slots.Location;
    const email = intentRequest.currentIntent.slots.Email;


    var params = {
        DelaySeconds: 5,
        MessageAttributes: {
            "Cuisine": {
                DataType: "String",
                StringValue: cuisine
            },
            "Location":{
                DataType: "String",
                StringValue: location
            },
            "Email": {
                DataType: "String",
                StringValue: email
            }
        },
        MessageBody: "New reservation",
        QueueUrl: "https://sqs.us-east-1.amazonaws.com/105787838877/PlaceOrder"
    };

    // Send the message to SQS
    sqs.sendMessage(params, function(err, data){
        if (err){
            // Send confirmation message to the user
            callback(close(intentRequest.sessionAttributes, 'Fulfilled',
                { contentType: 'PlainText', content: 'Sorry. Some errors happened.'}));
            console.log("Error", err);
        }else{
            // Send confirmation message to the user
            callback(close(intentRequest.sessionAttributes, 'Fulfilled',
                { contentType: 'PlainText', content: 'Thanks, you are all set.' +
                'Please expect my recommendations shortly! Have a good day.'}));
            console.log("Success! ", data.MessageId);
        }
    });
}



// --------------- Intents -----------------------

/**
 * Called when the user specifies an intent for this skill.
 */
function dispatch(intentRequest, callback) {
    console.log(`dispatch userId=${intentRequest.userId}, intentName=${intentRequest.currentIntent.name}`);

    const intentName = intentRequest.currentIntent.name;

    // Dispatch to intent handlers, just deal with Dining Suggestions Intent
    if (intentName === 'Book') {
        return recommendRestaurant(intentRequest, callback);
    }

    throw new Error(`Intent with name ${intentName} not supported`);
}



// --------------- Main handler -----------------------

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


