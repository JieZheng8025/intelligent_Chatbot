'use strict';


var AWS = require('aws-sdk');
AWS.config.update({
    region: "us-east-1"
});

const yelp = require('yelp-fusion');
const client = yelp.client('8hC_sGN0GckT9Z8o-ANzt2FSBqE7Dwwomq333Ko-RORokTXT-6wf2kPfGaWmisLhTiHhKsbl_2AIjhLVf67TeGr0IzqXwLVdvQU82EGVfVlyqmAAov-9K3nVpFQhXHYx');

exports.handler = (event, context, callback) => {
    var restaurant = "";
    console.log("event", event);
    receiveSQSMess(event);
};

function YelpSearch(_location, _cuisine) {
    console.log("Yelp Searching: {location: ", _location, " cuisine: ", _cuisine);
    client.search({
        location: _location,
        categories: _cuisine
        }).then(result => {
            const restaurant = result.jsonBody.businesses.slice(0,5);
            // sendMessage();
            loadData(restaurant);
            
            // const response = {
            //     statusCode: 200,
            //     body: JSON.stringify(restaurant),
            // };
             console.log('restaurant: ' + JSON.stringify(restaurant[0]));
            // callback(null, response);
            
            const customerEmail = "xysu2017@outlook.com";
            sendSES(customerEmail, restaurant);
            
      }).catch(e => {
        console.log("Yelp Searching failed!"); 
        console.log('err:' + e);
        // callback(e);
      });
    //   sendMessage();
    // sendSNSConfirmation();
    // listSubscrips();
    //sendSNS(" ");
}

var sns = new AWS.SNS({region: 'us-east-1'});
var ses = new AWS.SES({apiVersion: '2010-12-01'});

var sendSES = function(user_email, restaurant) {
    const sourceEmail = "zhishang99@gmail.com";
    var params = {
        Destination: {
            ToAddresses: [
                user_email
            ] 
        },
        Message: {
            Body: {
                Html: {
                    Charset: "UTF-8", 
                    Data: JSON.stringify(restaurant)
                }, 
                Text: {
                    Charset: "UTF-8", 
                    Data: "This is the message body in text format."
                }
            },
            Subject: {
                Charset: "UTF-8", 
                Data: "Your cuisine choice from AICustomerService!"
            }
        },
        Source: sourceEmail
    };
    
    ses.sendEmail(params, function(err, data) {
        if (err) {
            console.log("Send email failed. ", err);
        }else {
            console.log("Send email succeed! " + JSON.stringify(data));
        }
    })
}

var sendSNS = function(message) {
    
    const email = "zz2578@columbia.edu"
    var paramsSNS = {
        Message: "test 8",
        Subject: 'TestSNS test 8',
        //TopicArn: "arn:aws:sns:us-east-1:105787838877:CuisineRecommendation",
        TargetArn: 'arn:aws:sns:us-east-1:105787838877:CuisineRecommendation:952714d2-42c4-4838-b5b7-fec821046e3b'
    };
    sns.publish(paramsSNS, function(err, data) {
        if (err) {
            console.log("sns failed, " + err)
        } else {
            console.log("sns succeed! " + JSON.stringify(data))
        }
    })
}



function receiveSQSMess(event) {
    try{
        // var sqs = new AWS.SQS({apiVersion: '2012-11-05'});
        // var queueURL = "https://sqs.us-east-2.amazonaws.com/105787838877/OrderQueue";
        // var params = {
        //     AttributeNames: [
        //         "location"
        //     ],
        //     MaxNumberOfMessages: 1,
        //     MessageAttributeNames: [
        //       "All"
        //     ],
        //     QueueUrl: queueURL,
        //     VisibilityTimeout: 60,
        //     WaitTimeSeconds: 0
        // };
        // console.log("starting");
        
        // console.log("data ", event); 
        console.log("start receiving message " + event.Records.length);
        var names = [];
        for (const message of event.Records) {
            const messageBody = message.body;
            console.log("New message: " + messageBody);
            
            const order = message.messageAttributes;
            console.log("order: == " + JSON.stringify(order));
            const location = order.Location.stringValue;
            const cuisine = order.Cuisine.stringValue;
            names.push(cuisine); 
            
            YelpSearch(location, cuisine);
            
            // var queueURL = "https://sqs.us-east-2.amazonaws.com/105787838877/OrderQueue";
            // var deleteParams = {
            //     QueueUrl: queueURL,
            //     ReceiptHandle: message.ReceiptHandle
            // };
            // sqs.deleteMessage(deleteParams, function(err, data) {
            // if (err) {
            //     console.log("Delete Error", err);
            // } else {
            //     console.log("Message Deleted", data);
            // }});
        }
        console.log("ending");  
    } catch (error) {
        console.log(error);
        // callback(error);
    }
    
    
}

function loadData(data){
    AWS.config.update({
        region: "us-east-2",
        endpoint: "dynamodb.us-east-2.amazonaws.com"
    });
    function getAddress(result){
        var addr = result.location.address1;
        if (result.location.address2 === null || result.location.address2 === "")
            return addr;
        addr = addr + result.location.address2;
        if (result.location.address3 === null || result.location.address3 === "")
            return addr;
        return addr + result.location.address3;
    }
    var docClient = new AWS.DynamoDB.DocumentClient();
    data.forEach(function(restaurant) {

        var params = {
            TableName: "YelpRestaurant",
            Item: {
                // Extract two primary keys
                "id":  restaurant.id.replace(/-|\//g, ""),
                "name": restaurant.name.replace(/-|\//g, ""),
                "insertedAtTimestamp": new Date().toISOString()
            }
        };

        // The remaining keys are different form restaurant to restaurant
        // Therefore, we examine the attributes one by one
        // Be careful: An attributeValue may not contain an empty string
        if (restaurant.alias && restaurant.alias != ""){
            params.Item.alias = restaurant.alias;
        }

        if (restaurant.image_url && restaurant.image_url != ""){
            params.Item.image_url = restaurant.image_url;
        }

        params.Item.is_closed = restaurant.is_closed;

        if (restaurant.url && restaurant.url != ""){
            params.Item.url = restaurant.url;
        }

        if (restaurant.review_count){
            params.Item.review_count = restaurant.review_count;
        }

        if (restaurant.categories && restaurant.categories.length != 0) {
            params.Item.categories = [];
            params.Item.categories = params.Item.categories.concat(restaurant.categories);
        }

        if (restaurant.rating)
            params.Item.rating = restaurant.rating;
    
        if (restaurant.coordinates)
            params.Item.coordinates = restaurant.coordinates;

        if (restaurant.location) {
            params.Item.location = getAddress(restaurant);
            params.Item.zipcode = restaurant.location.zip_code;
        }
        if (restaurant.phone && restaurant.phone != "")
            params.Item.phone = restaurant.phone;

        if (restaurant.display_phone && restaurant.display_phone != "")
            params.Item.display_phone = restaurant.display_phone;

        if (restaurant.distance)
            params.Item.distance = restaurant.distance;
    
        if (restaurant.price && restaurant.price != "")
            params.Item.price = restaurant.price;
    
        if (restaurant.transactions && restaurant.transactions.length != 0) {
            params.Item.transactions = [];
            params.Item.transactions = params.Item.transactions.concat(restaurant.transactions);
        }


        docClient.put(params, function(err, data) {
            if (err) {
                console.error("Unable to add restaurant", restaurant.name, ". Error JSON:", JSON.stringify(err, null, 2));
            } else {
                console.log("PutItem succeeded:", restaurant.name);
            }
        });
    });
}