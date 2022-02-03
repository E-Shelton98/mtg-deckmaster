'use strict'
/////////////////////////////////////////////////////////////
//DEPENDENCIES
//Create const fetch by requiring dependency node-fetch
const fetch = require('node-fetch')
const fs = require('fs')
const { pipeline } = require('stream')
const { promisify } = require('util')
const StreamArray = require('stream-json/streamers/StreamArray')
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
//Initial setup of the DB card collection, including clearing the DB and removing the library.json file

async function dbSetup() {
  //Remove library.json from directory if present, and clear all cards from db
  async function dbCleaner() {
    //Check if library.json exists in directory and remove if needed
    if (fs.existsSync('./library.json') === true) {
      fs.unlink('./library.json', (err) => {
        if (err) {
          console.error(err)
        } else {
          console.log('./library.json removed from directory')
        }
      })
    }
    //Delete all cards from the card collection in the database
    return Card.deleteMany()
      .then((res) => console.log(`deleted ${res.deletedCount} cards from db.`))
      .catch((e) => console.error(e))
  }

  //Fetch bulk card data from ScryFall API, save to library.json, and insert to db
  async function libraryCreator(dbPopulate) {
    //Fetch bulk data information from ScryFall API to get oracle data download uri
    let bulkURIRequest = await fetch('https://api.scryfall.com/bulk-data').then(
      (response) => response.json()
    )
    let oracleBulkURI = bulkURIRequest.data[0].download_uri

    //Fetch card information bulk data
    const bulkOracleData = await fetch(oracleBulkURI)

    //Create a write stream to create a library.json file that holds bulkOracleData
    const streamPipeline = promisify(pipeline)
    if (!bulkOracleData.ok) {
      throw new Error(`unexpected response ${bulkOracleData.statusText}`)
    }

    await streamPipeline(
      bulkOracleData.body,
      fs.createWriteStream('./library.json')
    )

    dbPopulate()
  }

  async function dbPopulate() {
    const jsonStream = StreamArray.withParser()

    fs.createReadStream('./library.json').pipe(jsonStream.input)

    jsonStream.on('data', ({ key, value }) => {
      global.gc()
      addToLibrary(value)
    })

    jsonStream.on('end', () => console.log('Cards added to db collection!'))

    jsonStream.on('error', (err) => console.error(err))

    async function addToLibrary(value) {
      return Card.insertMany(
        value,
        { limit: 3, rawResult: true, lean: true },
        function (err, res) {
          if (err) {
            console.error(err)
          } else {
            res = null
            global.gc()
          }
        }
      )
    }
  }

  dbCleaner()
  libraryCreator(dbPopulate)
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
