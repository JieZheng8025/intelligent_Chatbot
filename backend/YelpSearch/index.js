'use strict';

var AWS = require('aws-sdk');
AWS.config.update({
    region: "us-east-1"
});
var sns = new AWS.SNS({region: 'us-east-1'});
var ses = new AWS.SES({apiVersion: '2010-12-01'});

const yelp = require('yelp-fusion');
const YELP_API_KEY = '8hC_sGN0GckT9Z8o-ANzt2FSBqE7Dwwomq333Ko-RORokTXT-6wf2kPfGaWmisLhTiHhKsbl_2AIjhLVf67TeGr0IzqXwLVdvQU82EGVfVlyqmAAov-9K3nVpFQhXHYx';
const client = yelp.client(YELP_API_KEY);

exports.handler = (event, context, callback) => {
    var restaurant = "";
    console.log("event", event);
    
    // receive the message from SQS queue
    receiveSQSMess(event);
};

/** 
 * Use Yelp Fusion API to search the restaurants
 * @param _location: the location of user want to have the meal around 
 * @param _cuisine: the cuisine type
 * @param _email: the user email, required by SES service
*/
function YelpSearch(_location, _cuisine, _email) {
    console.log("Yelp Searching: {location: ", _location, " cuisine: ", _cuisine, " email: ", _email);
    client.search({
        location: _location,
        categories: _cuisine
        }).then(result => {
            const restaurant = result.jsonBody.businesses.slice(0,5);
            
            // save the search results to DynamoDB 
            saveToDynamoDB(restaurant);

            console.log('restaurant: ' + JSON.stringify(restaurant[0]));
            
            // use SES service to send restaurant results to the user by email
            sendSES(_email, restaurant);
            
      }).catch(e => {
        console.log("Yelp Searching failed! ", e); 
      });
}

/**
 * Use SES service to send email.
 * @param user_email:   user's email, which need to be validated in sandbox mode;
 * @param restaurants:  the restaurant results to send to the user
*/
var sendSES = function(user_email, restaurants) {
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
                    Data: buildEmailBody(restaurants)
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

/**
* Helper function that help build the email content.
* @param restaurants: the restaurant result to be included in the email
*/
var buildEmailBody = function(restaurants) {
    
    var body = ""
    restaurants.forEach(function(restaurant) {
        body += `<h3>${restaurant.name}</h3><div>Link: ${restaurant.url}</div><img src=${restaurant.image_url} height="250">`
    })
    
    const content = `<html><head></head><body>${body}</body>`
    return content
}

/**
* Process the SQS message. 
* Each time the SQS receive a new message, it will transmit it to this lambda function as an event.
* @param event: the event source from SQS
*/
function receiveSQSMess(event) {
    try{
        console.log("start receiving message " + event.Records.length);
        var names = [];
        for (const message of event.Records) {
            const order = message.messageAttributes;
            console.log("order: == " + JSON.stringify(order));
            const location = order.Location.stringValue;
            const cuisine = order.Cuisine.stringValue;
            const email = order.Email.stringValue;
            names.push(cuisine); 
            
            // YelpSearch function to do search 
            YelpSearch(location, cuisine, email);
        }
        console.log("ending");  
    } catch (err) {
        console.log("Receive SQS message error", err);
    }
}

/**
* Save the restaurant data to DynamoDB
* @param data: the data to be saved. It has certain data model.
*/
function saveToDynamoDB(data){
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

        /** 
        * The remaining keys are different form restaurant to restaurant
        * Therefore, we examine the attributes one by one
        * Be careful: An attributeValue may not contain an empty string
        */
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