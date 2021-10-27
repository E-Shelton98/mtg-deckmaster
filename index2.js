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
//SCRYFALL DATA
//Get the ScryFall Bulk data once every 24 hours to keep up to date and save to database.

async function getScryData() {
  fs.unlink('./library.json', (err) => {
    if (err) {
      console.error(err)
    }
  })
  //Fetch the bulk data information to get the download uri for the oracle data
  let bulkURIRequest = await fetch('https://api.scryfall.com/bulk-data').then(
    (response) => response.json()
  )
  //Using the fetched data set the OracleBulkURI
  let oracleBulkURI = bulkURIRequest.data[0].download_uri
  bulkURIRequest = null

  //Remove all entries in the Card group, insert all cards from bulk data
  await Card.deleteMany().then(() => {})

  //Fetch the oracle bulk data
  const streamPipeline = promisify(pipeline)

  const bulkOracleData = await fetch(oracleBulkURI)

  if (!bulkOracleData.ok)
    throw new Error(`unexpected response ${bulkOracleData.statusText}`)

  await streamPipeline(
    bulkOracleData.body,
    fs.createWriteStream('./library.json')
  )

  const jsonStream = StreamArray.withParser()

  //internal Node readable stream option, pipe to stream-json to convert it for us
  fs.createReadStream('./library.json').pipe(jsonStream.input)

  jsonStream.on('data', ({ key, value }) => {
    addToLibrary(key, value)
  })

  async function addToLibrary(key, value) {
    await Card.create(value).then(() => {})
    key = null
    value = null
  }

  jsonStream.on('end', () => {
    console.log('All Done')
  })

  jsonStream.on('error', (err) => {
    console.error(err)
  })

  /*let cardLibrary = fs.createReadStream('./library.json', 'utf8')

  cardLibrary.on('data', function(chunk) {
    console.log('new chunk received: ', chunk)
  })*/
  oracleBulkURI = null

  //Remove all entries in the Card group, insert all cards from bulk data
  /*Card.deleteMany({}, function (error, response) {
    if (error) return console.error(error)
    console.log('GOODBYE NOW!!!')
  })

  await Card.insertMany(bulkOracleData).then(function (error, response) {
    if (error) return console.error(error)
    console.log('HELLO THERE!!!')
    response = null
    bulkOracleData = null
  })*/
}
//Get ScryData on server start
getScryData()
//Get ScryData every 24 hours...
//setInterval(getScryData, 1000 * 60 * 60 * 24)

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
