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

router.get('/', auth, async (req, res) => {
  try {

    let queryObj = {
      
    }

    for (const [key, value] of Object.entries(req.query)) {
      if (key === 'colors') {
        //SET QUERY VARIABLES
        let colors = Array.from(req.query.colors)

        queryObj['colors'] = colors
      }
      else if (key === 'format') {
        queryObj[`legalities.${req.query[key]}`] = 'legal'
      }
      else {
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

function ObjectFilter(obj) {
  let filteredObject = {}
  for (const key in obj) {
    if (obj[key] != undefined) {
      filteredObject[key] = obj[key]
    }
  }
  return filteredObject
}

module.exports = router
