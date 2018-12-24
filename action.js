var messages = [], //array that hold the record of each string in chat
  lastUserMessage = '', //keeps track of the most recent input string from the user
  botMessage = '', //var keeps track of what the chatbot is going to say
  botName = 'Chatbot', //name of the chatbot
  talking = true; //when false the speach function doesn't work


  
// set API_KEY
var apigClient = apigClientFactory.newClient({
  apiKey: 'BFyFwtwVbS9WpWjwbJRW55ViG0Oc0QoJ2FbcpUdU'
});

//edit this function to change what the chatbot says
function chatbotResponse() {
  talking = true;
  botMessage = ''; //the default message

  var params = {
  }

  var body = {
    "messages": [
      {
        "type": "string",
        "unstructured": {
          "id": "zz257",
          "text": lastUserMessage,
          "timestamp": "12-21"
        }
      }
    ]
  }

  apigClient.chatbotPost(params, body).then(function(result) {
    console.log("succcess, " + JSON.stringify(result.data.body));
    update(result.data);

  }).catch(function(error) {
    console.log( error);
  })

  return botMessage;
}

//this runs each time enter is pressed.
//It controls the overall input and output
function newEntry() {
  //if the message from the user isn't empty then run 
  if (document.getElementById("chatbox").value != "") {
    //pulls the value from the chatbox ands sets it to lastUserMessage
    lastUserMessage = document.getElementById("chatbox").value;
    //sets the chat box to be clear
    document.getElementById("chatbox").value = "";
    //adds the value of the chatbox to the array messages
    messages.push(lastUserMessage);
    //sets the variable botMessage in response to lastUserMessage
    chatbotResponse();
  }
}

function update(event, statusCode) {
  //add the chatbot's name and message to the array messages
  let newMessage = event.body;
  messages.push("<b>" + botName + ":</b> " + newMessage);
  // says the message using the text to speech function written below
  // Speech(botMessage);
  //outputs the last few array elements of messages to html
  for (var i = 1; i < 8; i++) {
    if (messages[messages.length - i])
      document.getElementById("chatlog" + i).innerHTML = messages[messages.length - i];
  }
}

//runs the keypress() function when a key is pressed
document.onkeypress = keyPress;
//if the key pressed is 'enter' runs the function newEntry()
function keyPress(e) {
  var x = e || window.event;
  var key = (x.keyCode || x.which);
  if (key == 13 || key == 3) {
    //runs this function when enter is pressed
    newEntry();
  }
  if (key == 38) {
    console.log('hi')
      //document.getElementById("chatbox").value = lastUserMessage;
  }
}

//clears the placeholder text ion the chatbox
//this function is set to run when the users brings focus to the chatbox, by clicking on it
function placeHolder() {
  document.getElementById("chatbox").placeholder = "";
}