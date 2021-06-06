/////////////////////////////////////////////////////////////
//DEPENDENCIES

//Create const mongoose by requiring dependency mongoose
const mongoose = require('mongoose')

/////////////////////////////////////////////////////////////
//CREATE SCHEMA AND MODEL

//Create const deckSchema using a new mongoose Schema
const deckSchema = new mongoose.Schema({
  name: { type: String, required: true },
  picture: String,
  description: String,
  created: { type: Date, default: Date.now },
  updated: { type: Date, Default: Date.now },
  cards: { type: Array, required: true },
  performance: {
    wins: Number,
    losses: Number,
  },
  notes: [String],
})

//Create deck model using the deck schema
const Deck = mongoose.model('deck', deckSchema)

//Export the deck model
module.exports = Deck
