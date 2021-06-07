/////////////////////////////////////////////////////////////
//DEPENDENCIES

//Create const mongoose by requiring dependency mongoose
const mongoose = require('mongoose')

/////////////////////////////////////////////////////////////
//CREATE SCHEMA AND MODEL

//Create const cardSchema using a new mongoose Schema
const cardSchema = new mongoose.Schema({
  oracle_id: String,
  multiverse_ids: Array,
  mtgo_id: Number,
  mtgo_foil_id: Number,
  tcgplayer_id: Number,
  cardmarket_id: Number,
  name: String,
  lang: String,
  released_at: String,
  uri: String,
  scryfall_uri: String,
  layout: String,
  highres_image: Boolean,
  image_status: String,
  image_uris: Object,
  mana_cost: String,
  cmc: Number,
  type_line: String,
  oracle_text: String,
  colors: Array,
  color_identity: Array,
  keywords: Array,
  legalities: Object,
  games: Array,
  reserved: Boolean,
  foil: Boolean,
  nonfoil: Boolean,
  oversized: Boolean,
  promo: Boolean,
  reprint: Boolean,
  variation: Boolean,
  set: String,
  set_name: String,
  set_type: String,
  set_uri: String,
  set_search_uri: String,
  scryfall_set_uri: String,
  rulings_uri: String,
  prints_search_uri: String,
  collector_number: String,
  digital: Boolean,
  rarity: String,
  flavor_text: String,
  card_back_id: String,
  artist: String,
  artist_ids: Array,
  illustration_id: String,
  border_color: String,
  frame: String,
  full_art: Boolean,
  textless: Boolean,
  booster: Boolean,
  story_spotlight: Boolean,
  edhrec_rank: Number,
  prices: Object,
  related_uris: Object,
})

//Create card model using the card schema
const Card = mongoose.model('card', cardSchema)

//Export the card model
module.exports = Card
