/////////////////////////////////////////////////////////////
//DEPENDENCIES

//Create const router by requiring express with Router
const router = require('express').Router()

/////////////////////////////////////////////////////////////
//USER ROUTES

//Create user post route
router.post('/', (req, res) => {
    res.send('test')
})

//export user routes
module.exports = router