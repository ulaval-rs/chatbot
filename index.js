'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')

const app = express()
app.set('port', (process.env.PORT || 5000))


app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.get('/', function(req, res){
	res.send('Hello! I am a research helper. What would you like to share?')
})

app.get('/webhook/', function(req, res) {
	if (req.query['hub.verify_token'] == "moose"){
		res.send(req.qery['hub.challenge'])
	}
	res.send("Wrong token")
})

app.listen(app.get('port'), function(){
	console.log("running: port")
})