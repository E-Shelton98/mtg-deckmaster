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

    let queryObj = {
      
    }

    for (const [key, value] of Object.entries(req.query)) {
      if (key === 'colors') {
        //SET QUERY VARIABLES
        let colors = Array.from(req.query.colors)
        if (colors.indexOf('X') === -1) {
          queryObj['colors'] = colors
        }
        
      }
      else if (key === 'format') {
        if (value != undefined && value != '') {
          queryObj[`legalities.${req.query[key]}`] = 'legal'
        }
        if (req.query.restricted === 'true') {
          queryObj[`legalities.${req.query[key]}`] = 'restricted'
        }
      }
      else if (key === 'cmc') {
        if (value != undefined && value != '') {
          queryObj['cmc'] = parseInt(value, 10)
        }
      }
      else if (key === 'name') {
        if (value !== 'undefined' && value != '') {
          queryObj['name'] = value
        }
      }
      else if (key !== 'restricted'){
        queryObj[key] = value
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
