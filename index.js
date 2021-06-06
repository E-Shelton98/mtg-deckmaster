/////////////////////////////////////////////////////////////
//DEPENDENCIES

//Create const express by requiring dependency express
const express = require('express')
//Create const mongoose by requiring dependency mongoose
const mongoose = require('mongoose')
//Create const dotenv by requiring dependency dotenv
const dotenv = require('dotenv').config()

/////////////////////////////////////////////////////////////
//SET UP SERVER
//Create an application using the express function
const app = express()

//Set the PORT variable to either use an env or port 5000
const PORT = process.env.PORT || 5000

//Start our server listening on the chosen port, and log a message for verification
app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))

/////////////////////////////////////////////////////////////
//CONNECT TO MONGO

//Run connect function of mongoose, log status on connection
mongoose.connect(
  process.env.MDB_CONNECT,
  {
    useNewURLParser: true,
    useUnifiedTopology: true,
  },
  (err) => {
    if (err) return console.error(err)
    console.log('Connected to MongoDB')
  }
)

/////////////////////////////////////////////////////////////
//MIDDLEWARE

app.use(express.json())
app.use('/auth', require('./routers/userRouter.js'))
