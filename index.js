require('dotenv').config();
const fetch = require('node-fetch');
var Twit = require('twit'),
    cronJob = require('cron').CronJob,
    fileType = require('file-type'),
    fs = require('fs');

var T = new Twit({
    consumer_key: process.env.consumer_key,
    consumer_secret: process.env.consumer_secret,
    access_token: process.env.access_token,
    access_token_secret: process.env.access_token_secret,
    timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
})

var status = ""
var img = ""
var textJob = new cronJob('0 8 * * *', function() {
    fetch('http://quotes.rest/qod.json')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
          status = '"'+ data.contents.quotes[0].quote + '" - ' + data.contents.quotes[0].author
          if (status.length > 140) {
                // return callback(new Error('tweet is too long: ' + status.length)); 
                fetch("https://theysaidso.com/quote/image/" + data.contents.quotes[0].id )
                .then(function(res) {
                   return res.buffer();
                }).then(function(buffer) {
                  fs.writeFile('image.png', buffer, function (err) {
                    if (err) throw err;
                      console.log('Saved!');
                      });
                  var b64content = fs.readFileSync('image.png', { encoding: 'base64' })
                  T.post('media/upload', { media_data: b64content }, function (err, data, response) {
                    // now we can assign alt text to the media, for use by screen readers and
                    // other text-based presentations and interpreters
                    var mediaIdStr = d.media_id_string
                    var altText = status
                    var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } }
                     T.post('media/metadata/create', meta_params, function (err, data, response) {
                       if (!err) {
                         // now we can reference the media and post a tweet (media will attach to the tweet)
                         var params = { status: 'Quote of the day', media_ids: [mediaIdStr] }
                         T.post('statuses/update', params, function (err, date, response) {
                           console.log(data)
                         })
                       }
                     })
                   })
                });
                fs.unlink('image.png', function (err) {
                  if (err) throw err;
                    console.log('File deleted!');
                });
            } else {
                T.post('statuses/update', {
                    status: status
                }, function(err, data, response) {
                    console.log(data)
                });
            }
        });
}, null, true);
