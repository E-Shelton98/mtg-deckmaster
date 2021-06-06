//Create const express by requiring dependency express
const express = require('express')

//Create an application using the express function
const app = express()

//Set the PORT variable to either use an env or port 5000
const PORT = process.env.PORT || 5000

//Start our server listening on the chosen port, and log a message for verification
app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`))

//Set up the get request at test.
app.get('/test', (req, res) => {
    res.send("It works")
})

//mongodb+srv://<username>:<password>@cluster0.tefcf.mongodb.net/myFirstDatabase?retryWrites=true&w=majority