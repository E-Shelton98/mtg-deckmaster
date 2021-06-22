/////////////////////////////////////////////////////////////
//DEPENDENCIES

//Create const router by requiring express with Router
const router = require('express').Router()

//Create const User by requiring the user model
const Deck = require('../models/deckModel')

//Create const auth be requiring the auth middleware
const auth = require('../middleware/auth')

/////////////////////////////////////////////////////////////
//DECK ROUTES

router.post('/', auth, async (req, res) => {
  try {
    //Extract variables from request body
    const { name, deckType, created, updated, cards } = req.body
    const user = req.user
    /////////////////////////////////////////////////////////
    //VALIDATION
    //if there is not a deck name, or cards...
    if (!name || !cards || !deckType) {
      res.status(400).json({
        errorMessage: 'All decks must have a name, cards, and deck type.',
      })
    }

    /////////////////////////////////////////////////////////
    //SAVE NEW DECK
    //Create const newDeck using deck model
    const newDeck = new Deck({
      name,
      deckType,
      created,
      updated,
      cards,
      user,
    })

    //Create const savedDeck to save deck to the db
    const savedDeck = await newDeck.save()

    res.json(savedDeck)
  } catch (err) {
    console.error(err)
    res.status(500).send()
  }
})

router.get('/', auth, async (req, res) => {
  try {
    const decks = await Deck.find({ user: req.user })
    res.json(decks)
   } catch (err) {
     console.error(err)
     res.status(500).send()
  }
})

module.exports = router
