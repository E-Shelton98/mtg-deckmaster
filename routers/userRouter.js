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

//Create const crypto by requiring dependency crypto
const crypto = require('crypto')

/////////////////////////////////////////////////////////////
//USER ROUTES

//Create user register post route
router.post('/', async (req, res) => {
  try {
    //Extract variables from request body
    const { email, password, username } = req.body
    console.log(email, password, username)

    let friendCode = crypto.randomBytes(5).toString('hex')

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
    console.log('this is token: ', token)

    /////////////////////////////////////////////////////////
    //SEND TOKEN AS HTTP-ONLY COOKIE

    //Send response with our token
    res
      .cookie('token', token, {
        httpOnly: true,
        secure: true,
      })
      .status(200).send()
  } catch (err) {
    console.error(err)
    res.status(500).send()
  }
})

//Create user login post route
router.post('/login', async (req, res) => {
  try {
    // extract variables from request body
    const { username, password } = req.body
    console.log('login post variables: ', username, password)

    /////////////////////////////////////////////////////
    //VALIDATION

    //if either the email or password is not entered...
    if (!username || !password) {
      return res.status(400).json({
        errorMessage: 'Please enter all required fields.',
      })
    }

    //Check if this user exists via its email
    const existingUser = await User.findOne({ username })
    //if a user does NOT exist with this email...
    if (!existingUser) {
      return res.status(401).json({
        errorMessage: 'Incorrect combination of email and password!',
      })
    }

    //Check if this user's password is correct
    const passwordCorrect = await bcrypt.compare(
      password,
      existingUser.passwordHash
    )
    //if the password is NOT correct...
    if (!passwordCorrect) {
      return res.status(401).json({
        errorMessage: 'Incorrect combination of email and password!',
      })
    }

    /////////////////////////////////////////////////////////
    //SIGN TOKEN
    //Create const token using jwt function sign
    const token = jwt.sign(
      {
        user: existingUser._id,
      },
      process.env.JWT_SECRET
    )

    console.log('login token sign: ', token)

    /////////////////////////////////////////////////////////
    //SEND TOKEN AS HTTP-ONLY COOKIE

    //Send response with our token
    res
      .cookie('token', token, {
        httpOnly: true,
        secure: true,
        SameSite: 'none',

      })
      .send()
  } catch (err) {
    console.error(err)
    res.status(500).send()
  }
})

//Create user logout get route
router.get('/logout', (req, res) => {
  res
    .cookie('token', '', {
      httpOnly: true,
      expires: new Date(0),
    })
    .send()
})

//Create user loggedIn get route
router.get('/loggedIn', (req, res) => {
  try {
    const token = req.cookies.token

    /////////////////////////////////////////////////////////
    //VALIDATION
    //if there is NOT a token...
    if (!token) return res.status(200).json(false)

    /////////////////////////////////////////////////////////
    //JWT VERIFICATION
    jwt.verify(token, process.env.JWT_SECRET)
    console.log(jwt)

    res.status(200).send(true)
  } catch (err) {
    res.json(false)
  }
})

//export user routes
module.exports = router
