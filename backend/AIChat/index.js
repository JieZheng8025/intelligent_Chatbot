exports.handler = function(event, context, callback) {

    var text = event.messages[0].unstructured.text;
    var answer = "";
    
    if (text === 'Hello') {
        answer = 'Hi there, how can I help?';
    } else {
        answer = 'Please say hello to me';
    }
    console.log(text);

    const response = {
      statusCode: 200,
      // HERE'S THE CRITICAL PART
      headers: {
        "Access-Control-Allow-Credentials": true,
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(answer)
    };

    callback(null, response);
};