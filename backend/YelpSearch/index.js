'use strict';

const yelp = require('yelp-fusion');
const client = yelp.client('8hC_sGN0GckT9Z8o-ANzt2FSBqE7Dwwomq333Ko-RORokTXT-6wf2kPfGaWmisLhTiHhKsbl_2AIjhLVf67TeGr0IzqXwLVdvQU82EGVfVlyqmAAov-9K3nVpFQhXHYx');

exports.handler = (event, context, callback) => {
    var restaurant = "";
    client.search({
        location: event.location,
        categories: event.cuisine,
        
        }).then(result => {
            restaurant = result.jsonBody.businesses.slice(0,5);
            const response = {
                statusCode: 200,
                body: JSON.stringify(restaurant),
            };
            console.log('restaurant: ' + restaurant.length);
            callback(null, response);
      }).catch(e => {
        console.log('err:' + e);
        callback(e);
      });
};

