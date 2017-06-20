require('dotenv').config();
const fetch = require('node-fetch');
var Twit = require('twit'),
cronJob = require('cron').CronJob;


var T = new Twit({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token: process.env.access_token,
  access_token_secret: process.env.access_token_secret,
  timeout_ms: 60*1000,  // optional HTTP request timeout to apply to all requests.
})

var status = ""


var textJob = new cronJob( '0 09 * * *', function(){

  

  if(status.length > 140) {
    return callback(new Error('tweet is too long: ' + status.length));
  }else{
    T.post('statuses/update', { status: status }, function(err, data, response) {
      console.log(data)
    });
  }
},  null, true);
