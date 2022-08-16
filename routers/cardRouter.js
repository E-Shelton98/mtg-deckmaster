/////////////////////////////////////////////////////////////
//DEPENDENCIES

//Create const router by requiring express with Router
const router = require('express').Router()

//Create const User by requiring the user model
const Card = require('../models/cardModel')

//Create const auth be requiring the auth middleware
const auth = require('../middleware/auth')

/////////////////////////////////////////////////////////////
//CARD ROUTES

router.get('/', async (req, res) => {
  try {
    let queryObj = {}

    for (const [key, value] of Object.entries(req.query)) {
      if (key === 'colors') {
        //SET QUERY VARIABLES
        let colors = Array.from(req.query.colors)
        if (colors.indexOf('X') === -1) {
          queryObj['colors'] = colors
        }
      } else if (key === 'format') {
        if (value != undefined && value != '') {
          queryObj[`legalities.${req.query[key]}`] = 'legal'
        }
        if (req.query.restricted === 'true') {
          queryObj[`legalities.${req.query[key]}`] = 'restricted'
        }
      } else if (key === 'cmc') {
        if (value != undefined && value != '') {
          queryObj['cmc'] = parseInt(value, 10)
        }
      } else if (key === 'name') {
        if (value !== 'undefined' && value != '') {
          queryObj['name'] = {$regex : value}
        }
      } else if (key !== 'restricted') {
        queryObj[key] = value
      }
    }

    if (req.query.typeLine === undefined) {
      queryObj.type_line = {
        $nin: [
          'Land',
          'Legendary Land',
          'Land — Mountain Plains Swamp',
          'Land - Plains Swamp Forest',
          'Land - Island Mountain Plains',
          'Land - Forest Island Mountain',
          'Land - Swamp Forest Island',
          'Basic Land',
          'Basic Land - Swamp',
          'Basic Land - Mountain',
          'Basic Land - Forest',
          'Basic Land - Island',
          'Basic Land - Plains',
          'Artifact Land',
          'Land - Swamp',
          'Land - Mountain',
          'Land - Forest',
          'Land - Island',
          'Land - Plains',
          'Land - Plains Island',
          'Land - Forest Plains',
          'Land - Island Swamp',
          'Land - Swamp Mountain',
          'Land - Mountain Forest',
          'Land - Plains Swamp',
          'Land - Mountain Plains',
          'Land - Island Mountain',
          'Land - Forest Island',
          'Land - Swamp Forest',
          'Snow Land',
          'Legendary Snow Land',
          'Basic Snow Land - Swamp',
          'Basic Snow Land - Mountain',
          'Basic Snow Land - Forest',
          'Basic Snow land - Island',
          'Basic Snow Land - Plains',
          'Land - Desert',
          'Land - Gate',
          'Land - Lair',
          'Land - Locus',
          `Land - Urza's`,
          `Land - Urza's Power Plant`,
          `Land - Urza's Mine`,
          `Land - Urza's Tower`,
          'Land Creature - Forest Dryad'
        ],
      }
    }

    console.log(queryObj)

    let cards = await Card.find(queryObj)

    res.json(cards)
  } catch (err) {
    console.error(err)
    res.status(500).send()
  }
})

module.exports = router
