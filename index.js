'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const axios = require('axios')
const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');

const app = express()

app.set('port', (process.env.PORT || 5000))

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())
const sessionClient = new dialogflow.SessionsClient();

app.get('/', function(req, res) {
    res.send("Hi I am a chatbot")
})

let token = process.env.TOKEN
let users = []
let opening_choices = ["Report a moose sighting", "Check up on previous data"]
let opening_payloads = ["moose", "data"]
let consent_choices = ["I consent", "I do not consent >:("]
let consent_payloads = ["yes", "no"]
let current_context = "welcome"

app.get('/webhook/', function(req, res) {
    res.send(req.query['hub.challenge'])
})

app.post('/webhook/', function(req, res) {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
        let event = messaging_events[i]
        let sender = event.sender.id
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
    if (current_context === "welcome"){
        let response = runSample(text, sender).then(value => {
            if (value === "welcome"){
                axios.get(`https://graph.facebook.com/${sender}?fields=first_name,last_name,profile_pic&access_token=${token}`)
                    .then((response) => {
                        if (users.find(element => element === sender)){
                            sendButtonMessage(sender, `Welcome back ${response.data.first_name}, how can I help you today?`,
                                opening_choices, opening_payloads)
                            current_context = "first action"
                        }
                        else {
                            sendButtonMessage(sender, `Hello ${response.data.first_name}, to continue, please accept to be added to the research network`,
                                consent_choices, consent_payloads)
                            current_context = "consent"
                        }
                    })

            } else {
                sendText(sender, "I'm sorry, I didn't quite catch that")
            }
        })
    } else if (current_context === "consent"){
        decideConsentStatus(sender, text1)
    }
    else if (current_context === "first action"){
        decideWhatActionToTake(sender, text1)
    }
    else if (current_context === "time"){
        parseTime(sender, text1)
    }
    else if (current_context === "location"){
        parseLocation(sender, text1)
    }
}

function decideConsentStatus(sender, text1){
    let text = text1.toLowerCase()
    if (text.includes("yes")){
        users.push(sender)
        sendButtonMessage(sender, `Okay, you're added! How can I help you today?`,
            opening_choices, opening_payloads)
        current_context = "first action"
    }
    else if (text.includes("no")){
        sendText(sender, "Okay, come back if you change your mind")
        current_context = "welcome"
    }
    else {
        sendText(sender, "Please choose one of the options.")
    }
}

function decideWhatActionToTake(sender, text1){
    current_context = "first action"
    let text = text1.toLowerCase()
    if (text.includes("moose")){
        sendText(sender, "Alright, let's get started!")
        sendText(sender, "When did you see the moose?")
        current_context = "time"
    }else if (text.includes("data")){
        sendText(sender, "WIP")
    }
    else {
        sendText(sender, "Please choose one of the options.")
    }
}

function parseLocation(sender, text1){
    sendText(sender, "WIP")
}

function parseTime(sender, text1){
    let result = runSample(text1, sender).then(value => {
        let date_time = value.split("T")
        console.log(date_time)
        if(date_time.length >= 2){
            sendText(sender, `Okay cool, the moose was seen on ${date_time[0]} at ${date_time[1]}. Where did you see the moose?`)
            sendText(sender, "http://localhost:63342/chatbot/LocationPage.html?_ijt=c6eppi5i84ada414duj16fbshf&_ij_")
        }
        else {
            sendText(sender, `Okay cool, the moose was seen on ${date_time[0]}. Where did you see the moose?`)
            sendText(sender, "http://localhost:63342/chatbot/LocationPage.html?_ijt=c6eppi5i84ada414duj16fbshf&_ij_")
        }
        current_context = "location"
    })
}

function parsePicture(sender, image){
    current_context = "picture"
    //TODO
}


function sendText(sender, text) {
    let messageData = {text: text}
    sendRequest(sender, messageData)
}

function sendButtonMessage(sender, text, titles, payloads){
    let messageData = {
        "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text":text,
                "buttons":[
                    {
                        "type":"postback",
                        "title": titles[0],
                        "payload":payloads[0]
                    },
                    {
                        "type": "postback",
                        "title": titles[1],
                        "payload" : payloads[1]
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

app.listen(app.get('port'), function() {
    console.log("running: port")
})

async function runSample(text, sender, projectId = 'researchassistant') {
    // A unique identifier for the given session
    const sessionId = uuid.v4();

    // Create a new session
    const sessionClient = new dialogflow.SessionsClient();
    const sessionPath = sessionClient.projectAgentSessionPath(
        projectId,
        sessionId
    );

    // The text query request.
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                // The query to send to the dialogflow agent
                text: text,
                // The language used by the client (en-US)
                languageCode: 'en-US',
            },
        },
    };

    // Send request and log result
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    let response = result.fulfillmentText
    return String(response)
    //decideMessage(sender, result.fulfillmentText)
}
