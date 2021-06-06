/////////////////////////////////////////////////////////////
//DEPENDENCIES

//Create const mongoose by requiring dependency mongoose
const mongoose = require('mongoose')

/////////////////////////////////////////////////////////////
//CREATE SCHEMA AND MODEL

//Create const userSchema using a new mongoose Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  username: { type: String, required: true },
  friendCode: { type: String, required: true },
})

//Create user model using the user schema
const User = mongoose.model('user', userSchema)

//Export the user model
module.exports = User
