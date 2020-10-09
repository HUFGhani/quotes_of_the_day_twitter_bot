import fetch from 'node-fetch'
import Twit from 'twit'
import dotenv from 'dotenv'
import fs from 'fs'


dotenv.config()

const T = new Twit({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token: process.env.access_token,
  access_token_secret: process.env.access_token_secret,
  timeout_ms: 60 * 1000, // optional HTTP request timeout to apply to all requests.
})

const quoteURL = 'http://quotes.rest/qod.json'
const quoteImageURL = 'https://theysaidso.com/quote/image/'

const ImagePath = './image.jpg'

const getQuote = async () => {
  const response = await fetch(quoteURL)
  return await response.json()
}

const getQuoteAsImage = async (imageId) => {
  const response = await fetch(`${quoteImageURL}${imageId}`)
  const buffer = await response.buffer()
  fs.writeFile(ImagePath, buffer, (err) => {
    if (err) throw err
    console.log('finished downloading!')
  })
}

const tweet = async () => {
  const quoteData = await getQuote()
  console.log(quoteData)
  const status = tweetBuilder(await getQuote())
  await getQuoteAsImage(quoteData.contents.quotes[0].id)
  if (status.length > 280) {
    try {
      var b64content = await fs.promises.readFile(ImagePath, {
        encoding: 'base64',
      })
      T.post('media/upload', { media_data: b64content }, function (
        err,
        data,
        response
      ) {
        // now we can assign alt text to the media, for use by screen readers and
        // other text-based presentations and interpreters
        var mediaIdStr = data.media_id_string
        var altText = status
        var meta_params = {
          media_id: mediaIdStr,
          alt_text: { text: altText },
        }

        T.post('media/metadata/create', meta_params, function (
          err,
          data,
          response
        ) {
          if (!err) {
            // now we can reference the media and post a tweet (media will attach to the tweet)
            var params = {
              status: 'Quote of the day',
              media_ids: [mediaIdStr],
            }

            T.post('statuses/update', params, function (err, data, response) {
              console.log(data)
            })
          }
        })
      })
      fs.promises.unlink(ImagePath, (err) => {
        if (err) throw err
        console.log('File deleted!')
      })
    } catch (err) {
      console.error('Error image.jpg does not exist')
    }
  } else {
    T.post('statuses/update', { status: status }, function (
      err,
      data,
      response
    ) {
      console.log(data)
    })
  }
}

const tweetBuilder = (quoteData) => {
  return `"${quoteData.contents.quotes[0].quote}" - ${quoteData.contents.quotes[0].author}`
}

tweet()
