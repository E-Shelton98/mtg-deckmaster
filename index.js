/////////////////////////////////////////////////////////////
//DEPENDENCIES
//Create const fetch by requiring dependency node-fetch
const fetch = require('node-fetch')
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

//Start the server listening on the chosen port, and log a message for verification
app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))

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

function getScryData() {
  //Universal URL for all bulk data bundles
  const url = 'https://api.scryfall.com/bulk-data'
  //Placeholder for Oracle information bulk data URI
  let oracleBulkURI = null
  //Fetch the Bulk Data information
  const scryFetch = async (url) => {
    const response = await fetch(url)
    const { data } = await response.json()
    //Using the fetched data set the OracleBulkURI
    oracleBulkURI = data[0].download_uri
    //Fetch the oracle bulk data
    let oracleResponse = await fetch(oracleBulkURI)
    //convert oracleResponse into JSON
    let oracleData = await oracleResponse.json().then(
      //Log that oracleData is fetched
      console.log('oracleData fetched, writing to database.')
    )
    //Remove all entries in the Card group, insert all cards from bulk data.
    Card.deleteMany({}).then(() => {
      Card.insertMany(oracleData).then(
        console.log('oracleData Saved to Database.')
      )
    })
    oracleResponse = null
    oracleData = null
  }
  scryFetch(url)
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
