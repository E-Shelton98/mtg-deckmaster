'use strict'
/////////////////////////////////////////////////////////////
//DEPENDENCIES
//Create const fetch by requiring dependency node-fetch
const { fetch } = require('undici')
//Create const TextDecoderStream to create a readable stream
const { TextDecoderStream } = require('node:stream/web')
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

//Create const numeral for use in displaying memory usage during development
const numeral = require('numeral')

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

/////////////////////////////////////////////////////////////
//CONNECT TO MONGO
//Run connect function of mongoose, log status on connection
mongoose.connect(
  process.env.MDB_CONNECT,
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) return console.error(err)
    console.log('Connected to MongoDB')
  }
)

/////////////////////////////////////////////////////////////
//DB SETUP
//Initial setup of the DB card collection, including clearing the DB
async function dbSetup() {
  async function dbCleaner() {
    //Delete all cards from the card collection in the database
    //Log amount of deleted cards for tracking purposes
    return Card.deleteMany()
      .then((res) => console.log(`deleted ${res.deletedCount} cards from db.`))
      .catch((e) => console.error(e))
  }

  //Fetch bulk card data from ScryFall API and insert to db using readable stream
  async function libraryCreator() {
    //Fetch bulk data information from ScryFall API
    let bulkURIRequest = await fetch('https://api.scryfall.com/bulk-data').then(
      (response) => response.json()
    )
    //Bulk data information displays multiple types of data
    //We need specifically the "oracle" information
    //Oracle data is ONE copy of EVERY card in the MTG card set
    //Cards are in their ORIGINAL release language
    let oracleBulkURI = bulkURIRequest.data[0].download_uri

    //Fetch oracle information using the URI retrieved from above
    let bulkOracleData = await fetch(oracleBulkURI)
    //Create "textStream", a readable stream
    //Pipe the fetch response's body through TextDecoderStream to create a
    //ReadableStream that consists of chunks of the body in string type
    let textStream = bulkOracleData.body.pipeThrough(new TextDecoderStream())
    //Set bulkOracleData to null for GC collection, unsure if needed ???
    bulkOracleData = null
    //Create variable "completedChunks"
    //Essentially only needed to check if the first chunk is being processed
    let completedChunks = 0
    //Create variable "chunkRemains"
    //Used for concatenation of remaining data from processed chunks
    //IE. Either remaining data after a completed valid JSON object is found
    //Or for chunks that contain only partial data
    let chunkRemains = ''
    //For each chunk of readable stream "textStream"
    //Do some processing on the chunk to find any valid JSON objects
    //And insert that object into the db using mongoose
    for await (let chunk of textStream) {
      //Use "filterJSON" to find any valid JSON objects in the current chunk of data
      const filterJSON = function (chunk) {
        //Create variables "openBrace" and "closeBrace"
        //Used to keep count of their specific characters to find valid JSON objects
        let openBrace = 0
        let closeBrace = 0

        //Create variable "cleanedChunk"
        //Used for creation and storing of a chunk of data that has extras removed
        //IE. comma's separating card objects, square bracket at the first chunk and so on
        let cleanedChunk = ''

        //IF "completedChunks" is 0, remove the first character from "chunk"
        //In this case the first character is the '[' found at the beginning of the stream
        if (completedChunks == 0) {
          //Slice chunk starting at character 1, and save to "cleanedChunk"
          cleanedChunk = chunk.slice(1)

          //Set "chunk" to null for GC, though unsure if needed ???
          chunk = null

          //Set "completedChunks" to null, unused from this point forward
          completedChunks = null
        }

        //ELSE simply set "cleanedChunk" to the value of "chunk"
        else {
          cleanedChunk = chunk

          //Set "chunk" to null for GC, though unsure if needed ???
          chunk = null
        }

        //Set "cleanedChunk" to the value of "chunkRemains" PLUS "cleanedChunk"
        //The value of "chunkRemains" is any data left over from the previous chunk
        cleanedChunk = chunkRemains + cleanedChunk

        //Set "chunkRemains" to null for GC, though unsure if needed ???
        chunkRemains = null

        //FOR i while it is less than the length of "cleanedChunk"
        //Iterate over the value of "cleanedChunk[i]" starting at i = 0
        for (let i = 0; i <= cleanedChunk.length; i++) {
          //////////////////////////////////////////////////////////////
          //Check IF "cleanedChunk[i]" is either a '{' or '}'
          //Used for finding valid JSON objects in the current chunk

          //IF "cleanedChunk[i]" is '{'
          //Increase the value of openBrace by 1
          if (cleanedChunk[i] === '{') {
            openBrace = openBrace + 1
          }

          //ELSE IF "cleanedCHunk[i]" is '}'
          //Increase the value of closeBrace by 1
          else if (cleanedChunk[i] === '}') {
            closeBrace = closeBrace + 1
          }

          ///////////////////////////////////////////////////////////////
          //Check IF "cleanedChunk[i]" AND the character before are '}'
          //This signifies a possible ending of a valid JSON object

          //IF "cleanedChunk[i]" AND the character before are '}'
          //Check IF the values of openBrace and closeBrace are strictly equal
          if (cleanedChunk[i] == '}' && cleanedChunk[i - 1] == '}') {
            if (openBrace === closeBrace) {
              //Create variable "validJSON" and set to undefined
              //This will be used to store ONE valid JSON object
              let validJSON = undefined

              //Check IF "cleanedChunk[0]" is ','
              //IF it is, remove that character from the chunk
              //Set "validJSON" to the data including character 0 and up to character i
              //Use i as the NOT included ending because the string is shortened by 1
              if (cleanedChunk[0] == ',') {
                cleanedChunk = cleanedChunk.slice(1)
                validJSON = cleanedChunk.slice(0, i)
              }

              //ELSE simply set "validJSON" as the slice of cleanedChunk
              //The valid JSON object will be from character 0 UP TO the character AFTER i
              else {
                validJSON = cleanedChunk.slice(0, i + 1)
              }

              //Parse "validJSON" so that it is a JSON object
              //"validJSON" will be ONE single MtG card object
              validJSON = JSON.parse(validJSON)

              //Insert "validJSON" to the db through Mongoose's Model.create method
              Card.create(validJSON)
                //Set res to null to handle the response
                .then((res) => (res = null))
                //Catch any errors that may occur
                .catch((e) => console.error(e))

              //Set "cleanedChunk" to the REMAINING data after the valid JSON object
              //Setting "cleanedChunk" to (i + 2) removes the ',' separating objects
              cleanedChunk = cleanedChunk.slice(i + 2)
              //May change this to directly set the remaining to "chunkRemains" for testing later

              //Set "i", "openBrace", and "closeBrace" to ZERO
              //This is for walking through the next chunk of data from the beginning
              i = 0
              openBrace = 0
              closeBrace = 0

              //Set "validJSON" to null for GC, though unsure if this is needed ???
              validJSON = null
            }
          }
        }

        //Set "chunkRemains" to the current value of "cleanedChunk"
        //This is for concatenation at the start of the filtering process
        chunkRemains = cleanedChunk

        //Set cleanedChunk to null for GC, though unsure if this is needed ???
        cleanedChunk = null

        //IF "chunkRemains" is ONLY ']'
        //That signifies that all cards are processed and we are at the last chunk
        if (chunkRemains === ']') {
          //Set all variables that are not already null to null
          //This is for GC, though unsure if this is needed ???
          chunkRemains = null
          cleanedChunk = null
          openBrace = null
          closeBrace = null

          //RETURN a log that all cards are added to DB successfully
          //This is to end processing of the function
          //This also prevents an error from the readable stream locking at completion
          return console.log('ALL CARDS ADDED TO DB SUCCESSFULLY!')
        }
      }

      //Send each chunk to the function "filterJSON" to filter out valid JSON objects
      filterJSON(chunk)

      //Set "chunk" in this beginning loop to null
      //This is for GC, though unsure if it is needed ???
      chunk = null
    }

    //When finished with the readable stream set it to null
    //This is for GC, though unsure if it is needed ???
    textStream = null
  }

  //When the "dbSetup" function is called, run "dbCleaner" and "libraryCreator"
  //The former removes all cards currently in the database
  //The latter will filter out valid JSON objects and push them to the database
  dbCleaner()
  libraryCreator()
}

//////////////////////////////////////////////////////////////
//ON STARTUP RUN "dbSetup"
//This will both remove all current cards in the database
//As well as create a new card library
dbSetup()

//////////////////////////////////////////////////////////////
//>> EXPERIMENTAL <<//
//Currently commented out due to the current memory usage bug
//Planned to be used to allow automatic recreation of card library to keep up with releases
//Probably going to extend to run once a month
//Though may have to be scrapped for a physical restart of the server to cause rebuild
//Get new library data every 24 hours...
//setInterval(dbSetup(), 1000 * 60 * 60 * 24)

/////////////////////////////////////////////////////////////
//MIDDLEWARE

//EXPRESS.JSON FOR JSON USE
app.use(express.json())

//COOKIE PARSER FOR AUTH
app.use(cookieParser())

//LIMITER TO LIMIT REQUESTS
app.use(limiter)

//CORS WITH STRICT ORIGIN
//WILL UPDATE WITH LIVE SITE WHEN APPLICABLE
app.use(
  cors({
    origin: ['http://localhost:3000'],
    credentials: true,
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
