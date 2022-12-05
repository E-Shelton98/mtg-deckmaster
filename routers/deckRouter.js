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
    const { name, deckType, created, updated, cards, colors } = req.body
    const user = req.user
    /////////////////////////////////////////////////////////
    //VALIDATION
    //if there is not a deck name, cards, or deckType...
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
      colors,
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
    let queryObj = { user: req.user }

    for (const [key, value] of Object.entries(req.query)) {
      if (key === 'colors') {
        //SET QUERY VARIABLES
        let colors = Array.from(req.query.colors)
        if (colors.indexOf('X') === -1) {
          queryObj['colors'] = colors
        }
      } else if (key === 'format') {
        if (value != undefined && value != '') {
          queryObj['deckType'] = value
        }
      } else if (key === 'name') {
        if (value !== 'undefined' && value != '') {
          queryObj['name'] = value
        }
      }
    }

    console.log('deckRouter queryObj: ', queryObj)

    let decks = await Deck.find(queryObj)
    console.log('found Decks: ', decks)

    res.json(decks)
  } catch (err) {
    console.error(err)
    res.status(500).send()
  }
})

module.exports = router
