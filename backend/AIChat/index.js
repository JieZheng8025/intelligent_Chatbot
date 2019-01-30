'use strict';

var AWS = require('aws-sdk');
var lexruntime = new AWS.LexRuntime();

// Build unstructured message
function buildUnstructuredMessage(text) {
    let response = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(text)
    };
    return response;
}


// Send message to Lex
const callLex = (message) => {
    return new Promise((resolve, reject) => {
        var params = {
            botAlias: 'reservation',
            /* required */
            botName: 'Booking',
            /* required */
            inputText: message,
            /* required */
            userId: '1800',
            /* required */
        };

        // Send a request using LexRuntime
        lexruntime.postText(params, function(err, data) {
            if (err) reject(err);
            else {
              console.log("Message sent to Lex. Succeed!!")
              resolve(data);
            } // successful response
        });
    });
};

// Handler
exports.handler = (event, context, callback) => {
  console.log('request on AIChat');

  try {
    let responseMessages = [];
    const newMessage = event.messages[0].unstructured.text;
    console.log(`get message ${newMessage}`);
    
    // Send the message to Lex'
    callLex(newMessage).then((lexResponse) => {
      responseMessages = buildUnstructuredMessage(lexResponse.message);
      callback(null, responseMessages);
    });
  } catch (error) {
    console.log("error happened in AIChat! ", error);
    callback(error);
  }
};