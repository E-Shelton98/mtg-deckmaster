'use strict'
/////////////////////////////////////////////////////////////
//DEPENDENCIES
//Create const fetch by requiring dependency node-fetch
const { fetch } = require('undici')
//Create const express by requiring dependency express
const express = require('express')
//Create const rateLimit for setting a rate limit on scryFall API calls
const rateLimit = require('express-rate-limit')
//Create const mongoose by requiring dependency mongoose
const mongoose = require('mongoose')
//Create const dotenv for creation and handling of .env files
const dotenv = require('dotenv').config()
//Create const cors by requiring dependency cors
const cors = require('cors')
//Create const cookieParser for use in authorization of users
const cookieParser = require('cookie-parser')
//Create const streamToMongoDB to allow use of writable streams with Mongoose
const streamToMongoDB = require('stream-to-mongo-db').streamToMongoDB
//Create const request by requiring dependency request
const request = require('request')
const JSONStream = require('JSONStream')

//Import card model for pushing card data through mongoose
const Card = require('./models/cardModel')


/////////////////////////////////////////////////////////////
//SET UP SERVER
//Create an application using the express function
const app = express()

//Set the PORT variable to either use an env variable or port 5000
const PORT = process.env.PORT || 5000

//Since this is on Heroku lets set trust proxy
app.set('trust proxy', 1)

//Set rate limit based off of ScryFall advice of 50 - 100 milliseconds or 10 requests per second
const limiter = rateLimit({
  windowMs: 1000, //1 second
  max: 10, //Limit each IP to 10 requests per second/windowMs
})

//Start the server listening on the chosen port
app.listen(PORT)



//Create library by establishing mongoose connection
//Removing all cards from current library
//And streaming a new library to the database using ScryFall oracle bulk
async function libraryCreator() {
  //Connect to database
  await mongoose
    .connect(process.env.MDB_CONNECT, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log('Successfully connected to database')
    })
    .catch((error) => {
      console.log('database connection failed. exiting now...')
      console.error(error)
      process.exit(1)
    })
  //Delete all cards from the card collection in the database
  //Log amount of deleted cards for tracking purposes
  await Card.deleteMany()
    .then((res) => console.log(`deleted ${res.deletedCount} cards from db.`))
    .catch((e) => console.error(e))
 
  //Set 'stream-to-mongodb' options
  const outputDBConfig = {
    dbURL: process.env.MDB_CONNECT,
    collection: 'cards',
    batchSize: 1,
  }

  //Fetch bulk data information from ScryFall API
  let bulkURIRequest = await fetch('https://api.scryfall.com/bulk-data').then(
    (response) => response.json()
  )
  //Bulk data information displays multiple types of data
  //We need specifically the "oracle" information
  //Oracle data is ONE copy of EVERY card in the MTG card set
  //Cards are in their ORIGINAL release language
  let oracleBulkURI = bulkURIRequest.data[0].download_uri

  // create the writable stream
  const writableStream = streamToMongoDB(outputDBConfig)

  // create readable stream and consume it
  request
    .get(oracleBulkURI)
    .on('error', function (err) {
      console.error(err)
    })
    .pipe(JSONStream.parse('*'))
    .pipe(writableStream)
}

libraryCreator()

//////////////////////////////////////////////////////////////
//Get new library data every 24 hours...
setInterval(libraryCreator, 1000 * 60 * 60 * 24)

/////////////////////////////////////////////////////////////
//MIDDLEWARE

//EXPRESS.JSON FOR JSON USE
app.use(express.json())

//COOKIE PARSER FOR AUTH
app.use(cookieParser())

//LIMITER TO LIMIT REQUESTS
app.use(limiter)

//CORS WITH STRICT ORIGIN
app.use(
  cors({
    origin: 'https://mtg-deckmaster.netlify.app',
    credentials: true,
    optionsSuccessStatus: 200,
  })
)

//AUTH ROUTE FOR USER SIGN IN, LOG OUT, AND SIGN UP
app.use('/auth', require('./routers/userRouter'))

//AUTH PROTECTED DECKS ROUTE FOR VIEWING A USERS DECKS/DECK CREATION
app.use('/decks', require('./routers/deckRouter'))

//CARDS ROUTE, USED TO RETRIEVE CARDS FROM DB FOR SINGLE VIEWING/DECK BUILDING
app.use('/cards', require('./routers/cardRouter'))

/////////////////////////////////////////////////////////////
//>> DEVELOPMENT ONLY <<//
//Interval used for easy memory usage logging during development
//Currently have a memory usage bug, this allows easy tracking/trend viewing

if (process.env.NODE_ENV === 'development') {
  //Create const numeral for use in displaying memory usage during development
  var numeral = require('numeral')

  //Interval for memoryUsage logging
  setInterval(() => {
    //Extrapolate the value of "rss", "heapTotal", and "heapUsed"
    const { rss, heapTotal, heapUsed } = process.memoryUsage()
    //Log the value of "rss", "heapTotal", and "heapUsed"
    //Use Numeral for formatting
    //Set formatting to Megabytes, in tenths place
    //>> SAMPLE OUTPUT <<//
    //"MEMORY USAGE --- rss: 79.9 MB, heapTotal: 29MB, heapUsed: 22.6 MB"
    console.log(
      `MEMORY USAGE --- rss: ${numeral(rss).format(
        '0.0 b'
      )}, heapTotal: ${numeral(heapTotal).format('0,0 b')}, heapUsed: ${numeral(
        heapUsed
      ).format('0.0 b')}.`
    )
  }, 1000)
}
