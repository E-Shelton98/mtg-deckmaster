'use strict'
/////////////////////////////////////////////////////////////
//DEPENDENCIES
//Create const fetch by requiring dependency node-fetch
const { fetch } = require('undici')
const { TextDecoderStream } = require('node:stream/web')
//Create const express by requiring dependency express
const express = require('express')
//Create const rateLimit by requiring dependency express-rate-limit
const rateLimit = require('express-rate-limit')
//Create const mongoose by requiring dependency mongoose
const mongoose = require('mongoose')
//Create const dotenv by requiring dependency dotenv
const dotenv = require('dotenv').config()
//Create const cors by requiring dependency cors
const cors = require('cors')
//Create const cookieParser by requiring dependency cookieParser
const cookieParser = require('cookie-parser')

const numeral = require('numeral')

//Import card model for ScryFall card data seeding.
const Card = require('./models/cardModel')

/////////////////////////////////////////////////////////////
//SET UP SERVER
//Create an application using the express function
const app = express()

//Set the PORT variable to either use an env or port 5000
const PORT = process.env.PORT || 5000

//Set rate limit based off of ScryFall advice of 50 - 100 milliseconds or 10 requests per second
//Since this is on Heroku lets set trust proxy
app.set('trust proxy', 1)

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
  //Remove library.json from directory if present, and clear all cards from db
  async function dbCleaner() {
    //Delete all cards from the card collection in the database
    return Card.deleteMany()
      .then((res) => console.log(`deleted ${res.deletedCount} cards from db.`))
      .catch((e) => console.error(e))
  }

  //Fetch bulk card data from ScryFall API and insert to db using readable stream
  async function libraryCreator() {
    //Fetch bulk data information from ScryFall API to get oracle data download uri
    let bulkURIRequest = await fetch('https://api.scryfall.com/bulk-data').then(
      (response) => response.json()
    )
    let oracleBulkURI = bulkURIRequest.data[0].download_uri

    //Fetch card information bulk data
    let bulkOracleData = await fetch(oracleBulkURI)
    let stream = bulkOracleData.body
    let textStream = stream.pipeThrough(new TextDecoderStream())
    bulkOracleData = null
    stream = null
    let completedChunks = 0
    let chunkRemains = ''
    for await (const chunk of textStream) {
      const filterJSON = function (chunk) {
        let openBrace = 0
        let closeBrace = 0
        let cleanedChunk = ''
        if (completedChunks == 0) {
          cleanedChunk = chunk.slice(1)
          chunk = null
          completedChunks = null
        } else {
          cleanedChunk = chunk
          chunk = null
        }
        cleanedChunk = chunkRemains + cleanedChunk
        chunkRemains = null

        for (let i = 0; i <= cleanedChunk.length; i++) {
          if (cleanedChunk[i] === '{') {
            openBrace = openBrace + 1
          } else if (cleanedChunk[i] === '}') {
            closeBrace = closeBrace + 1
          }

          if (cleanedChunk[i] == '}' && cleanedChunk[i - 1] == '}') {
            if (openBrace === closeBrace) {
              let validJSON = undefined

              if (cleanedChunk[0] == ',') {
                cleanedChunk = cleanedChunk.slice(1)
                validJSON = cleanedChunk.slice(0, i)
              } else {
                validJSON = cleanedChunk.slice(0, i + 1)
              }

              validJSON = JSON.parse(validJSON)
              Card.create(validJSON)
                .then((res) => (res = null))
                .catch((e) => console.error(e))
              cleanedChunk = cleanedChunk.slice(i + 2)

              i = 0
              openBrace = 0
              closeBrace = 0
              validJSON = null
            }
          }
        }
        chunkRemains = cleanedChunk
        cleanedChunk = null

        if (chunkRemains == ']') {
          chunkRemains = null
          cleanedChunk = null
          openBrace = null
          closeBrace = null
          return console.log('ALL CARDS ADDED TO DB SUCCESSFULLY!')
        }
      }
      filterJSON(chunk)
    }
    textStream = null
  }

  dbCleaner()
  libraryCreator()
}

dbSetup()
//Get new library data every 24 hours...
//setInterval(dbSetup(), 1000 * 60 * 60 * 24)

/////////////////////////////////////////////////////////////
//MIDDLEWARE

app.use(express.json())
app.use(cookieParser())
app.use(limiter)
app.use(
  cors({
    origin: ['http://localhost:3000'],
    credentials: true,
  })
)
app.use('/auth', require('./routers/userRouter'))
app.use('/decks', require('./routers/deckRouter'))
app.use('/cards', require('./routers/cardRouter'))

//Interval for memoryUsage logging
setInterval(() => {
  const { rss, heapTotal, heapUsed } = process.memoryUsage()
  console.log(
    `MEMORY USAGE --- rss: ${numeral(rss).format(
      '0.0 b'
    )}, heapTotal: ${numeral(heapTotal).format('0,0 b')}, heapUsed: ${numeral(
      heapUsed
    ).format('0.0 b')}.`
  )
}, 1000)
