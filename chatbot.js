'use strict'

const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const axios = require('axios')
const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');
const {response} = require("express");
const { Navigator } = require("node-navigator");
const navigator = new Navigator();

const app = express()

app.set('port', (process.env.PORT || 5000))

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.get('/', function(req, res) {
    res.send("Hi I am a chatbot")
})

let token = process.env.TOKEN
let users = {}
let names = {}
let quit = true
let opening_choices = ["Report a moose sighting", "Check up on previous data"]
let opening_payloads = ["moose", "data"]
let current_question = -1
let intermediate_api_url = "http://127.0.0.1:3000"
let questions = require('./question_list.json')


let data = {}

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
    if (text.includes("quit")){
        quit = true
        sendButtonMessage(sender, `How can I help you today?`,
            opening_choices, opening_payloads)
    }
    else {
        let response = runSample(text, sender).then(value => {
            if (value === "welcome") {
                axios.get(`https://graph.facebook.com/${sender}?fields=first_name,last_name,profile_pic&access_token=${token}`)
                    .then((response) => {
                        names[sender] = response.data.first_name
                        console.log(response.data.first_name)
                        detectUser(sender, names[sender], text)
                    })
            } else {
                detectUser(sender, names[sender], text)
            }
        })
    }
}


function detectUser(id, name, text){
    if(id in users && quit === true){
        current_question = users[id]
        sendText(id, "Hi " + name + "!")
        quit = false
        determineQuestion(id, current_question, text)
    }
    else if (!(id in users)){
        sendText(id, "Hi " + name + " it doesn't look like you've used this service before.")
        quit = false
        determineQuestion(id, current_question, text)
    }
    else if (quit === false){
        current_question = users[id]
        determineQuestion(id, current_question, text)
    }
}

function determineQuestion(sender, current_question, text){
    current_question += 1
    users[sender] = current_question
    let question_text = questions.questions[current_question]["question"]
    let optional_button = questions.questions[current_question]["optional"]
    let choices = questions.questions[current_question]["choices"]
    if (current_question === 0){
        sendButtonMessage(sender, question_text, choices)
    }
    else if (current_question === 1){
        decideConsentStatus(sender, text, question_text, choices)
    }
    else if (current_question === 2){
        decideWhatActionToTake(sender, text, question_text, optional_button)
    }
    else if(current_question === 3){
        parseTime(sender, text, question_text, choices)
    }
    else if (current_question === 4){
        parseLocation(sender, text, question_text, optional_button)
    }
    else {
        sendText(sender, "I'm not quite sure what you mean")
        current_question -= 1
        users[sender] = current_question
    }
}

function decideConsentStatus(sender, text1, question_text, choices){
    let text = text1.toLowerCase()
    if (text.includes("yes")){
        sendButtonMessage(sender, question_text,
            choices)
    }
    else if (text.includes("no")){
        sendText(sender, "Okay, come back if you change your mind")
        users[sender] = 0
    }
    else {
        sendText(sender, "Please choose one of the options.")
        current_question -= 1
        users[sender] = current_question
    }
}


function decideWhatActionToTake(sender, text1, question_text, optional){
    sendText(sender, "If at any point you want to quit to the main menu, say Quit")
    let text = text1.toLowerCase()
    if (text.includes("moose")){
        sendButtonMessage(sender, question_text, optional)
    }else if (text.includes("data")){
        if ( Object.keys(data) == 0){
            sendText(sender, "You have not entered any data so far")
            sendButtonMessage(sender, `How can I help you today?`,
                opening_choices, opening_payloads)
        }
        else {
            console.log(JSON.stringify(data))
            let data_presentable = ""
            for (let key in data){
                data_presentable = data_presentable + key + " : " + JSON.stringify(data[key]) + "\n"
            }
            sendText(sender, data_presentable)
        }

    }
    else {
        sendText(sender, "Please choose one of the options.")
        current_question -= 1
        users[sender] = current_question
    }
}

function parseLocation(sender, text1, question_text, optional_button){
    if (text1.includes("location")){
        navigator.geolocation.getCurrentPosition((success, error) => {
            if (error) console.error(error);
            else {
                axios.get(intermediate_api_url + "/url").then(function ( response){
                    console.log(response.data)
                    sendUrl(sender, question_text, response.data)
                    sendText(sender, "Your location data has been saved!")
                })
            }
        });
    }
    else if (text1.includes("no_location")){
        sendText(sender, "In that case, would you like to send where the moose was found?")
    }
}

function parseTime(sender, text1, question_text, choices){
    if (text1.includes("pass")){
        sendText(sender, "TBD")
    }
    else {
        let result = runSample(text1, sender).then(value => {
            let date_time = value.split("T")
            console.log(date_time)
            if (date_time.length >= 2) {
                sendText(sender, `Okay cool, the moose was seen on ${date_time[0]} at ${date_time[1]}. Your data has been saved.`)
                axios.post(intermediate_api_url + "/time", {
                    date: date_time[0],
                    time: date_time[1]
                })
                    .then(function (response) {
                        console.log(response.data);
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
                sendButtonMessage(sender, question_text, choices)
            } else {
                sendText(sender, `Okay cool, the moose was seen on ${date_time[0]}. Your data has been saved`)
                axios.post(intermediate_api_url + "/time", {
                    date: date_time[0],
                })
                    .then(function (response) {
                        console.log(response.data);
                    })
                    .catch(function (error) {
                        console.log(error);
                    });
                sendButtonMessage(sender, question_text, choices)
            }
        })

    }
}

function parsePicture(sender, image){
    //TODO
}


function sendText(sender, text) {
    let messageData = {text: text}
    sendRequest(sender, messageData)
}

function sendButtonMessage(sender, text, buttons){
    let messageData = {
        "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text":text,
                "buttons": buttons
            }
        }
    }
    sendRequest(sender, messageData)
}

function sendUrl(sender, question, text){
    let messageData = {
        "attachment":{
            "type":"template",
            "payload":{
                "template_type":"button",
                "text":question,
                "buttons":[
                    {
                        "type":"web_url",
                        "url":text,
                        "title":"Give location",
                        "webview_height_ratio": "full"
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
    console.log("running: port " + String(app.get('port')))
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
