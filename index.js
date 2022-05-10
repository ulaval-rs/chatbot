'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const axios = require('axios');
let greetings = ["hi", "hello", "whats up", "hey"]
let regions = ["Bas St-Laurent", "Saguenay Lac St-Jean", "Capitale-Nationale", "Mauricie", "Estrie", "Montreal", "Outaouais"]

const app = express()
app.set('port', (process.env.PORT || 5000))


app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.get('/', function(req, res){
	res.send('Hello! I am a research helper. What would you like to share?')
})

let token = "EABK5DqeVQKcBAP1Vo57lcbAnWu5mGcYLrMBfXpaFzO3LJLVII4UEgYdEkGC686fbABbY8y2TLSRia0mI4yJ4vReyHADPZBEVbt8dcjp2C3fVZCVnsxBO1T0BYAmpUNM7ni69OGdbV6GACC9lhOTi7e5IjHN3ZChLFlp9jYCTYIwGQUze12XM1gFh6mZBDSnDisZB7ZAY0ZBegZDZD"

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
				sendText(sender, "Hi! I am your virtual research assistant.")
				sendButtonMessage(sender, "What can I help you with?")
				}
				else if (text.indexOf("google") !== -1){
				let coordinates = text.slice(text.indexOf("@") + 1)
				if(coordinates.indexOf("z") !== 0){
					coordinates = coordinates.slice(0, coordinates.indexOf("z") + 1)
				}
				let x_and_y_coordinates = coordinates.slice(0, -4)
				let separation = x_and_y_coordinates.indexOf(",")
				let x = x_and_y_coordinates.slice(0, separation)
				let y = x_and_y_coordinates.slice(separation + 1)
				sendText(sender, "X coordinate: " + x)
				sendText(sender, "Y coordinate: " + y)
				}
				else {
				var url = 'https://google.com/maps/place/' + text
				axios.get(url).then(res => {
					sendText(sender, "Can you be more specific? Place your position on the map")
					sendText(sender, url)
					}).catch(error => {sendText(sender, error)})
				}
			}

		}
		else {
				sendText(sender, Object.keys(event))
			}
	}
	res.sendStatus(200)

})


function sendText(sender, text){
	let messageData = {text: text}
	sendRequest(sender, messageData)
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

function sendButtonMessage(sender, text){
	let messageData = {
		"attachment" : {
			"type":"template",
			"payload": {
				"template_type":"button",
				"text":text,
				"buttons":[
				{
					"type": "postback",
					"title": "Send a picture",
					"payload": "picture"

				},
				{
					"type": "postback",
					"title": "Send geographical data",
					"payload": "coordinates"
				}]
			}
		}
	}
	sendRequest(sender, messageData)
}

function sendRequest(sender, messageData){
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