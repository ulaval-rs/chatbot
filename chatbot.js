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
let intermediate_api_url = "http://127.0.0.1:3000"
let questions = require('./question_list.json')
let current_question = -1


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
                sendText(sender, "Thanks for the picture! Would you like to report another moose?")
                users[sender] = current_question - 1
                current_question = 0
                decideMessage(sender, "yes")
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
        //this is where separation of user[id] and current_id happens
        //current_id is what sends us back to the main menu
        //user[id] is where the conversation left off
        //when we type quit, it brings us back to main menu, and current_id goes to 2
        //when we click on report a moose, it loads current[id] to bring us back to where we were
        //when we click on the quit option for the main menu, current_id goes to 1
        //this is what I focus on today
        //we can now visit the main menu by typing quit, no we need to load where we were
        sendText(sender, "Welcome back to the main menu.")
        users[sender] = current_question
        current_question = 0
        determineQuestion(sender, current_question, "yes")
    }
    else if (text.includes("goodbye")){
        quit = true
        current_question = users[sender] -1
        sendText(sender, "Goodbye!")
    }
    else {
        let response = runSample(text, sender).then(value => {
            if (value === "welcome") {
                axios.get(`https://graph.facebook.com/${sender}?fields=first_name,last_name,profile_pic&access_token=${token}`)
                    .then((response) => {
                        names[sender] = response.data.first_name
                        console.log(response.data.first_name)
                        detectUser(sender, names[sender])
                        current_question += 1
                        let question_text = questions.questions[current_question]["question"]
                        let choices = questions.questions[current_question]["choices"]
                        sendButtonMessage(sender, question_text, choices)
                    })
            } else {
                determineQuestion(sender, current_question, text)
            }
        })
    }
}


function detectUser(id, name){
    if(id in users && quit === true){
        sendText(id, "Welcome back " + name + "!")
        current_question = users[id] - 1
        quit = false
    }
    else if (!(id in users) && current_question === -1){
        sendText(id, "Hi " + name + ", it doesn't look like you've used this service before.")
        quit = false
    }
    else if (quit === false){
        sendText(id, "Welcome back " + name + "!")
        users[id] = current_question -1
    }
}

function determineQuestion(sender, question_id, text){
    question_id += 1
    let question_text = questions.questions[question_id]["question"]
    let choices = questions.questions[question_id]["choices"]
    if (question_id === 1){
        decideConsentStatus(sender, text, question_text, choices)
    }
    else if (question_id === 2){
        decideWhatActionToTake(sender, text, question_text, choices, question_id)
    }
    else if(question_id === 3){
        parseTime(sender, text, question_text, choices)
    }
    else if (question_id === 4){
        parseLocation(sender, text, question_text, choices)
    }
    else {
        sendText(sender, "I'm not quite sure what you mean")
        question_id -= 1
        users[sender] = question_id
    }
    current_question = question_id
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
        sendText(sender, "Here are your options")
        sendButtonMessage(sender, question_text,
            choices)
    }
}


function decideWhatActionToTake(sender, text1, question_text, optional, current_question){
    sendText(sender, "If at any point you want to quit to the main menu, say Quit")
    let text = text1.toLowerCase()
    if (text.includes("moose")){
        sendButtonMessage(sender, question_text, optional)
    }else if (text.includes("data")){
        if ( Object.keys(data) === 0){
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

function parseLocation(sender, text1, question_text, choices){
    if (text1.includes("pass")){
        sendButtonMessage(sender, question_text, choices)
    }
    else if (text1.includes("continue")){
        sendButtonMessage(sender, question_text, choices)
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
                axios.get(intermediate_api_url + "/url").then(function ( response){
                    choices[0].url = response.data
                    sendButtonMessage(sender, question_text, choices)
                    sendText(sender, "Once you have entered your location, say continue")
                })
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
                axios.get(intermediate_api_url + "/url").then(function ( response){
                    choices[0].url = response.data
                    sendButtonMessage(sender, question_text, choices)
                })
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
