'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const axios = require('axios')

const app = express()

app.set('port', (process.env.PORT || 5000))

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.get('/', function(req, res) {
    res.send("Hi I am a chatbot")
})

let token = process.env.TOKEN
let greetings = ["hi", "hello", "whats up", "hey"]
let users = []

app.get('/webhook/', function(req, res) {
    res.send(req.query['hub.challenge'])
})

app.post('/webhook/', function(req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = messaging_events[i]
        let sender = event.sender.id
        //getStartedButton(sender)
        if (event.message) {
            if (event.message.text) {
                let text = event.message.text
                decideMessage(sender, text)
            }
            else {
                sendText(sender, "Thanks for the picture!")
            }
        }
        if (event.postback){
            let text = JSON.stringify(event.postback.payload)
            decideMessage(sender, text)
        }
    }
    res.sendStatus(200)
})

function decideMessage(sender, text1){
    let text = text1.toLowerCase()
    if (text.includes("picture")){
        sendText(sender, "Do you like this moose?")
        sendMediaMessage(sender, "Here is the text")
    }else if (text.includes("coordinates")){
        sendText(sender, "Place your coordinates on this map and send it back")
        var url = 'https://google.com/maps/place/Quebec'
        sendText(sender, url)
    }
    else if (text.includes("moose")){
        sendText(sender, "cool, me too")
    }
    else if (text.includes("yes")){
        users.push(sender)
        sendText(sender, "Cool! You are now added")
        sendButtonMessage(sender, "How can I help you today?")
    }
    else if (text.includes(("no"))){
        sendText(sender, "Okay. Let me know if you change your mind!")
    }
    if (greetings.find(element => element === text)){
        axios.get(`https://graph.facebook.com/${sender}?fields=first_name,last_name,profile_pic&access_token=${token}`)
            .then((response) => {
                if (users.find(element => element === sender)){
                    sendButtonMessage(sender, `Welcome back ${response.data.first_name}, how can I help you today?`)
                }
                else {
                    sendConsentButtonMessage(sender, `Hello ${response.data.first_name}, to continue, please accept to be added to the research network`)
                }
            })

    }
}

function sendText(sender, text) {
    let messageData = {text: text}
    sendRequest(sender, messageData)
}

function sendButtonMessage(sender, text){
    let messageData = {
        "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text":text,
                "buttons":[
                    {
                        "type":"postback",
                        "title":"Send a picture",
                        "payload":"picture"
                    },
                    {
                        "type": "postback",
                        "title": "Send geographical coordinates",
                        "payload" : "coordinates"
                    }
                ]
            }
        }
    }
    sendRequest(sender, messageData)
}

function sendConsentButtonMessage(sender, text){
    let messageData = {
        "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text":text,
                "buttons":[
                    {
                        "type":"postback",
                        "title":"I accept",
                        "payload":"yes"
                    },
                    {
                        "type": "postback",
                        "title": "I do not accept >:(",
                        "payload" : "no"
                    }
                ]
            }
        }
    }
    sendRequest(sender, messageData)
}

function sendMediaMessage(sender, text){
    let messageData = {
        "attachment": {
            "type": "template",
            "payload": {
                "template_type": "media",
                "elements": [
                    {
                        "media_type": "image",
                        "url": "https://www.facebook.com/102237832502478/photos/a.106534478739480/106534455406149/",
                        "buttons": [
                            {
                                "type": "postback",
                                "title": "I like this moose",
                                "payload": "moose"
                            }
                        ]
                    }
                ]
            }
        }
    }
    sendRequest(sender, messageData)
}


function sendRequest(sender, messageData){
    request({
        url: "https://graph.facebook.com/v13.0/me/messages",
        qs : {access_token: token},
        method: "POST",
        json: {
            recipient: {id: sender},
            message : messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log("sending error")
        } else if (response.body.error) {
            console.log(String(response.body.error.message))
        }
    })
}

function getStartedButton(){
    request({
        url: "https://graph.facebook.com/v13.0/me/messenger_profile",
        qs: {access_token: token},
        method: "POST",
        json: {
            greeting: [
                {
                    "locale":"default",
                    "text":"Hello!"
                }
            ]
    }

        }, function(error, response, body) {
            if (error) {
                console.log("sending error")
            } else if (response.body.error) {
                console.log(String(response.body.error.message))
            }
    })
}

app.listen(app.get('port'), function() {
    console.log("running: port")
})
