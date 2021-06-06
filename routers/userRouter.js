/////////////////////////////////////////////////////////////
//DEPENDENCIES

//Create const router by requiring express with Router
const router = require('express').Router()

//Create const User by requiring the user model
const User = require('../models/userModel')

//Create const bcrypt by requiring dependency bcrypt
const bcrypt = require('bcryptjs')

//Create const jwt by requiring dependency jsonwebtoken
const jwt = require('jsonwebtoken')

/////////////////////////////////////////////////////////////
//USER ROUTES

//Create user register post route
router.post('/', async (req, res) => {
  try {
    //Extract variables from request body
    const { email, password, username, friendCode } = req.body

    /////////////////////////////////////////////////////////
    //VALIDATION
    //if there is not an email or password in the request...
    if (!email || !password) {
      return res.status(400).json({
        errorMessage: 'Please enter all required fields.',
      })
    }
    //if the password given is less than 6 characters...
    if (password.length < 6) {
      return res.status(400).json({
        errorMessage: 'Please enter a password of at least 6 characters.',
      })
    }

    //Check user exists via the email field vs the email in the post body
    const existingUser = await User.findOne({ email })
    //if a user already exists with this email...
    if (existingUser) {
      return res.status(400).json({
        errorMessage: 'An account with this email already exists.',
      })
    }

    /////////////////////////////////////////////////////////
    //HASH THE PASSWORD
    //create const salt using bcrypt function genSalt
    const salt = await bcrypt.genSalt()
    //create const passwordHash using bcrypt function hash
    const passwordHash = await bcrypt.hash(password, salt)

    /////////////////////////////////////////////////////////
    //SAVE NEW USER ACCOUNT
    //create const newUser using user model
    const newUser = new User({
      email,
      passwordHash,
      username,
      friendCode,
    })

    //create const savedUser to save the user to the db
    const savedUser = await newUser.save()

    /////////////////////////////////////////////////////////
    //SIGN TOKEN
    //Create const token using jwt function sign
    const token = jwt.sign(
      {
        user: savedUser._id,
      },
      process.env.JWT_SECRET
    )

    /////////////////////////////////////////////////////////
    //SEND TOKEN AS HTTP-ONLY COOKIE

    //Send response with our token
    res.cookie("token", token, {
        httpOnly: true,
    }).send()
  } catch (err) {
    console.error(err)
    res.status(500).send()
  }
})

//Create user login post route
router.post('/login', async (req, res) => {
    try{
        // extract variables from request body
        const { email, password} = req.body

        /////////////////////////////////////////////////////
        //VALIDATION

        //if either the email or password is not entered...
        if (!email || !password) {
            return res.status(400).json({
                errorMessage: "Please enter all required fields."
            })
        }
    }
    catch (err) {
        console.error(err)
        res.status(500).send()
    }
})

//export user routes
module.exports = router
