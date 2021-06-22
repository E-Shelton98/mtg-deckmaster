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
    /////////////////////////////////////////////////////////
    //SET QUERY VARIABLES
    let colors = req.query.colors

    //Set colors by creating an array from query
    if (colors != undefined && colors.length >= 1) {
      colors = Array.from(req.query.colors)
    }
    //Set below by query
    let format = req.query.format
    let name = req.query.name
    let mana_cost = req.query.cost
    let cmc = req.query.cmc
    let type_line = req.query.type
    let set_name = req.query.set
    let rarity = req.query.rarity
    let artist = req.query.artist
    let games = req.query.games
    let keywords = req.query.keywords

    //Create empty array to hold returned cards
    let cards = []
    let queryObject = {}
    let filteredObj = {}

    /////////////////////////////////////////////////////////
    //SWITCH CASES BASED ON LEGALITY QUERY
    switch (format) {
      case 'standard':
        queryObject = {
          colors: colors,
          keywords: keywords,
          games: games,
          name: name,
          mana_cost: mana_cost,
          cmc: cmc,
          type_line: type_line,
          'legalities.standard': 'legal',
          set_name: set_name,
          rarity: rarity,
          artist: artist,
        }

        filteredObj = ObjectFilter(queryObject)

        cards = await Card.find(filteredObj)
        break

      case 'historic':
        queryObject = {
          colors: colors,
          keywords: keywords,
          games: games,
          name: name,
          mana_cost: mana_cost,
          cmc: cmc,
          type_line: type_line,
          'legalities.historic': 'legal',
          set_name: set_name,
          rarity: rarity,
          artist: artist,
        }

        filteredObj = ObjectFilter(queryObject)

        cards = await Card.find(filteredObj)
        break

      case 'gladiator':
        queryObject = {
          colors: colors,
          keywords: keywords,
          games: games,
          name: name,
          mana_cost: mana_cost,
          cmc: cmc,
          type_line: type_line,
          'legalities.gladiator': 'legal',
          set_name: set_name,
          rarity: rarity,
          artist: artist,
        }

        filteredObj = ObjectFilter(queryObject)

        cards = await Card.find(filteredObj)
        break

      case 'pioneer':
        queryObject = {
          colors: colors,
          keywords: keywords,
          games: games,
          name: name,
          mana_cost: mana_cost,
          cmc: cmc,
          type_line: type_line,
          'legalities.pioneer': 'legal',
          set_name: set_name,
          rarity: rarity,
          artist: artist,
        }

        filteredObj = ObjectFilter(queryObject)

        cards = await Card.find(filteredObj)
        break

      case 'modern':
        queryObject = {
          colors: colors,
          keywords: keywords,
          games: games,
          name: name,
          mana_cost: mana_cost,
          cmc: cmc,
          type_line: type_line,
          'legalities.modern': 'legal',
          set_name: set_name,
          rarity: rarity,
          artist: artist,
        }

        filteredObj = ObjectFilter(queryObject)

        cards = await Card.find(filteredObj)
        break

      case 'legacy':
        queryObject = {
          colors: colors,
          keywords: keywords,
          games: games,
          name: name,
          mana_cost: mana_cost,
          cmc: cmc,
          type_line: type_line,
          'legalities.legacy': 'legal',
          set_name: set_name,
          rarity: rarity,
          artist: artist,
        }

        filteredObj = ObjectFilter(queryObject)

        cards = await Card.find(filteredObj)
        break

      case 'pauper':
        queryObject = {
          colors: colors,
          keywords: keywords,
          games: games,
          name: name,
          mana_cost: mana_cost,
          cmc: cmc,
          type_line: type_line,
          'legalities.pauper': 'legal',
          set_name: set_name,
          rarity: rarity,
          artist: artist,
        }

        filteredObj = ObjectFilter(queryObject)

        cards = await Card.find(filteredObj)
        break

      case 'vintage':
        queryObject = {
          colors: colors,
          keywords: keywords,
          games: games,
          name: name,
          mana_cost: mana_cost,
          cmc: cmc,
          type_line: type_line,
          'legalities.vintage': 'legal',
          set_name: set_name,
          rarity: rarity,
          artist: artist,
        }

        filteredObj = ObjectFilter(queryObject)

        cards = await Card.find(filteredObj)
        break

      case 'penny':
        queryObject = {
          colors: colors,
          keywords: keywords,
          games: games,
          name: name,
          mana_cost: mana_cost,
          cmc: cmc,
          type_line: type_line,
          'legalities.penny': 'legal',
          set_name: set_name,
          rarity: rarity,
          artist: artist,
        }

        filteredObj = ObjectFilter(queryObject)

        cards = await Card.find(filteredObj)
        break

      case 'commander':
        queryObject = {
          colors: colors,
          keywords: keywords,
          games: games,
          name: name,
          mana_cost: mana_cost,
          cmc: cmc,
          type_line: type_line,
          'legalities.standard': 'legal',
          set_name: set_name,
          rarity: rarity,
          artist: artist,
        }

        filteredObj = ObjectFilter(queryObject)

        cards = await Card.find(filteredObj)
        break

      case 'brawl':
        queryObject = {
          colors: colors,
          keywords: keywords,
          games: games,
          name: name,
          mana_cost: mana_cost,
          cmc: cmc,
          type_line: type_line,
          'legalities.standard': 'legal',
          set_name: set_name,
          rarity: rarity,
          artist: artist,
        }

        filteredObj = ObjectFilter(queryObject)

        cards = await Card.find(filteredObj)
        break

      case 'duel':
        queryObject = {
          colors: colors,
          keywords: keywords,
          games: games,
          name: name,
          mana_cost: mana_cost,
          cmc: cmc,
          type_line: type_line,
          'legalities.standard': 'legal',
          set_name: set_name,
          rarity: rarity,
          artist: artist,
        }

        filteredObj = ObjectFilter(queryObject)

        cards = await Card.find(filteredObj)
        break

      case 'oldschool':
        queryObject = {
          colors: colors,
          keywords: keywords,
          games: games,
          name: name,
          mana_cost: mana_cost,
          cmc: cmc,
          type_line: type_line,
          'legalities.oldschool': 'legal',
          set_name: set_name,
          rarity: rarity,
          artist: artist,
        }

        filteredObj = ObjectFilter(queryObject)

        cards = await Card.find(filteredObj)
        break

      case 'premodern':
        queryObject = {
          colors: colors,
          keywords: keywords,
          games: games,
          name: name,
          mana_cost: mana_cost,
          cmc: cmc,
          type_line: type_line,
          'legalities.premodern': 'legal',
          set_name: set_name,
          rarity: rarity,
          artist: artist,
        }

        filteredObj = ObjectFilter(queryObject)

        cards = await Card.find(filteredObj)
        break
    }

    /*if ((format = 'standard')) {
      let queryObject = {
        colors: colors,
        'legalities.standard': 'legal',
      }

      console.log(queryObject)
      cards = await Card.find(queryObject)
    }*/

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
