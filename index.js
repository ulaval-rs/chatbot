'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const axios = require('axios');
let greetings = ["hi", "hello", "whats up", "hey"]

const app = express()
app.set('port', (process.env.PORT || 5000))


app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.get('/', function(req, res){
	res.send('Hello! I am a research helper. What would you like to share?')
})


token = process.env.TOKEN

app.get('/webhook/', function(req, res) {
	if (req.query['hub.verify_token'] === "moose"){
		res.send(req.query['hub.challenge'])
	}
	res.send("Wrong token")
})

app.post('/webhook/', function(req, res) {
	let messaging_events = req.body.entry[0].messaging
	for (let i = 0; i < messaging_events.length; i++){
		let event = messaging_events[i]
		let sender = event.sender.id
		if (event.message){
			if (event.message.text){
			let text = event.message.text
				if (greetings.find(element => element === text.toLowerCase())){
				sendText(sender, "Hi! I am your virtual research assistant. What can I help you with?")
				}
				else if (text.indexOf("moose") !== -1){
				sendText(sender, "Can you send me a picture?")
				}
				else if (text.indexOf("google") !== -1){
				let coordinates = text.slice(text.indexOf("@") + 1)
				let x_and_y_coordinates = coordinates.slice(0, -4)
				let separation = x_and_y_coordinates.indexOf(",")
				let x = x_and_y_coordinates.slice(0, separation)
				let y = x_and_y_coordinates.slice(separation + 1)
				sendText(sender, "X coordinate: " + x)
				sendText(sender, "Y coordinate: " + y)
				}
				else {
				sendText(sender, "I didn't quite catch that")
				var url = 'https://google.com/maps/place/' + text
				axios.get(url).then(res => {
					//sendText(sender, String(Object.keys(res)))
					sendText(sender, String(res.data))
					}).catch(error => {sendText(sender, error)})
				}
			}
			else{
				sendText(sender, "this is a photo")
			}

		}
	}
	res.sendStatus(200)

})


function sendText(sender, text){
	let messageData = {text: text}
	request({
		url : "https://graph.facebook.com/v2.6/me/messages",
		qs: {access_token: token},
		method: "POST",
		json: {
			recipient: {id: sender},
			message: messageData,
		}, function(error, response, body){
			if (error) {
				console.log("sending error")
			}
		 else if (response.body.error){
			console.log("response body error")
		}
	}
})
}

function sendImage(sender, payload){
	let messageData = {
		"attachment": {
			"type": "image",
			"payload": payload
		}
	}
	request({
		url : "https://graph.facebook.com/v2.6/me/messages",
		qs: {access_token: token},
		method: "POST",
		json: {
			recipient: {id: sender},
			message: messageData,
		}, function(error, response, body){
			if (error) {
				console.log("sending error")
			}
		 else if (response.body.error){
			console.log("response body error")
		}
	}
})
}

app.listen(app.get('port'), function(){
	console.log("running: port")
})