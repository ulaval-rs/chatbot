//how are we going to do this
//what we can do is we can have a proto-db, which will then
//require an api to post
//the html can connect to this api, which will post the data to the db
//in which case all that needs to be sent is a confirmation that the data has been sent
//our proto db can be a class with getters and setters
//we can for the moment stash the location into a variable in the script, and then get and set


const express = require("express");
const bodyParser = require("body-parser");
const app = express()

app.set('port', (process.env.PORT || 8080))
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.get('/', function(req, res) {
    console.log('gotem')
})

app.get('/LocationPage.html', function(req, res){
    console.log(res)
})

app.listen(app.get('port'), function() {
    console.log("running: port " + String(app.get('port')))
})