/////////////////////////////////////////////////////////////
//DEPENDENCIES
//Create const jwt by requiring dependency jsonwebtoken
const jwt = require('jsonwebtoken')

function auth(req, res, next) {
  try {
    const token = req.cookies.token

    /////////////////////////////////////////////////////////
    //VALIDATION
    //if there is NOT a token...
    if (!token) {
      return res.status(401).json({
        errorMessage: 'Unauthorized',
      })
    }

    /////////////////////////////////////////////////////////
    //JWT VERIFICATION
    //Create const verified to hold the jwt payload if the correct secret and token are used.
    const verified = jwt.verify(token, process.env.JWT_SECRET)

    //Set request user to verified user
    req.user = verified.user

    /////////////////////////////////////////////////////////
    //NEXT

    next()
  } catch (err) {
    console.error(err)
    res.status(401).json({
      errorMessage: 'Unauthorized',
    })
  }
}

module.exports = auth
