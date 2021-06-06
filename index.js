//Create const express by requiring dependency express
const express = require('express')

//Create an application using the express function
const app = express()

const PORT = process.env.PORT || 5000

app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))
