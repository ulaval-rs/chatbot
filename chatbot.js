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
let menu_quit = false
let intermediate_api_url = "http://127.0.0.1:3000"
let questions = require('./question_list.json')
let current_question = "consent"
let next_question = "main_menu"
let saved_state = ["main_menu", "main_menu"]


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
                current_question = "end"
                next_question = "main_menu"
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

app.post('/location', function(req, res){
    let location = req.body
    axios.get(intermediate_api_url + "/sender").then( function (response){
        sendText(response.data[0], "Your location is " + String(location["latitude"]) + " , " +
        String(location["longitude"]))
        sendButtonMessage(response.data[0], questions.questions[next_question]["question"],
            questions.questions[next_question]["choices"])
        saved_state[0] = current_question
        saved_state[1] = next_question
        current_question = "picture"
    })

})

function decideMessage(sender, text1){
    let text = text1.toLowerCase()
    if (text.includes("quit")){
        menu_quit = true
        sendText(sender, "Welcome back to the main menu.")
        current_question = "main_menu"
        next_question = "main_menu"
        determineQuestion(sender, current_question, "yes")
    }
    else if (text.includes("goodbye")){
        quit = true
        next_question = users[sender]
        sendText(sender, "Goodbye!")
    }
    else {
        let response = runSample(text, sender).then(value => {
            if (value === "welcome") {
                axios.get(`https://graph.facebook.com/${sender}?fields=first_name,last_name,profile_pic&access_token=${token}`)
                    .then((response) => {
                        menu_quit = false
                        names[sender] = response.data.first_name
                        detectUser(sender, names[sender])
                        let question_text = questions.questions[current_question]["question"]
                        let choices = questions.questions[current_question]["choices"]
                        sendButtonMessage(sender, question_text, choices)
                        if (current_question === "consent"){
                            current_question = "main_menu"
                        }
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
        current_question = users[id]
        quit = false
    }
    else if (!(id in users) && current_question === "consent"){
        sendText(id, "Hi " + name + ", it doesn't look like you've used this service before.")
        current_question = "consent"
        quit = false
    }
    else if (quit === false){
        sendText(id, "Welcome back " + name + "!")
        users[id] = current_question
    }
}

function determineQuestion(sender, question_id, text){
    let question_text = questions.questions[next_question]["question"]
    let choices = questions.questions[next_question]["choices"]
    if (question_id !== "time" && text.includes("moose")){
        sendButtonMessage(sender, question_text, choices)
    }
    else if (question_id === "main_menu"){
        parseConsentAnswer(sender, text, question_text, choices)
    }
    else if (question_id === "time"){
        parseActionAnswer(sender, text, question_text, choices)
    }
    else if(question_id === "location" && !text.includes("moose")){
        parseTimeAnswer(sender, text, question_text, choices)
    }
    else if (question_id === "picture" && !text.includes("moose")){
        parseLocationAnswer(sender, text, question_text, choices)
    }
    else if (question_id === "end"){
        parsePicture(sender, text, question_text, choices)
    }
    else {
        sendText(sender, "I'm not quite sure what you mean")
        users[sender] = question_id
    }
}

function parseConsentAnswer(sender, text1, question_text, choices){
    let text = text1.toLowerCase()
    if (text.includes("yes") || text.includes("pass")){
        sendButtonMessage(sender, question_text,
            choices)
        if(menu_quit === true){
            menu_quit = false
            current_question = saved_state[0]
            next_question = saved_state[1]
        }
        else {
            current_question = "time"
            next_question = "time"
        }
    }
    else if (text.includes("no")){
        sendText(sender, "Okay, come back if you change your mind")
        users[sender] = "consent"
        current_question = "consent"
    }
    else {
        sendText(sender, "Here are your options")
        sendButtonMessage(sender, question_text,
            choices)
        current_question = "consent"
    }
}


function parseActionAnswer(sender, text1, question_text, choices){
    sendText(sender, "If at any point you want to quit to the main menu, say Quit")
    let text = text1.toLowerCase()
    if (text.includes("moose")){
        sendButtonMessage(sender, question_text, choices)
        saved_state[0] = current_question
        saved_state[1] = next_question
        current_question = "location"
        next_question = "location"
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
        current_question = "main_menu"
        users[sender] = current_question
    }
}

function parseLocationAnswer(sender, text1, question_text, choices){
    if (text1.includes("pass")){
        sendButtonMessage(sender, question_text, choices)
        saved_state[0] = current_question
        saved_state[1] = next_question
        current_question = "picture"
    }
    else if(text1.includes("continue")){
        saved_state[0] = current_question
        saved_state[1] = next_question
        sendButtonMessage(sender, question_text, choices)
    }
    else{
        saved_state[0] = current_question
        saved_state[1] = next_question
        let location = text1.split(" ")
        let query_location = ""
        for (let i = 0; i < location.length; i++){
            query_location += location[i] + "+"
        }
        query_location = query_location.slice(0, -1)
        let encoded_location = encodeURI(query_location);
        console.log(encoded_location)
        let key = process.env.GOOGLE_TOKEN
        console.log(key)
        axios.get(`https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encoded_location}&key=${key}`)
            .then(function (response){
                console.log(response.data.results[0])
                sendUrl(sender, "Here is your location", "https://www.google.com/maps/place/" +
                response.data.results[0].formatted_address)
                sendButtonMessage(sender, question_text, choices)
            }).catch(function (error){
                console.log(error)
        })
    }
}

function parseTimeAnswer(sender, text1, question_text, choices){
    saved_state[0] = current_question
    saved_state[1] = next_question
    if (text1.includes("pass")){
        axios.get(intermediate_api_url + "/url").then(function ( response){
            choices[0].url = response.data
            sendButtonMessage(sender, question_text, choices)
        })
    }
    else {
        let result = runSample(text1, sender).then(value => {
            console.log(value)
            if (value.includes("Say that one more time?")){
                sendText(sender, value)
            }
            else {
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
                    axios.get(intermediate_api_url + "/url").then(function (response) {
                        choices[0].url = response.data
                        axios.post(intermediate_api_url + "/sender", {
                            "sender": sender
                        }).then(function (response) {
                            sendText(sender, "Once you have entered your location, say continue")
                            sendButtonMessage(sender, question_text, choices)
                            current_question = "picture"
                            next_question = "picture"
                        })
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
                    axios.get(intermediate_api_url + "/url").then(function (response) {
                        choices[0].url = response.data
                        axios.post(intermediate_api_url + "/sender", {
                            "sender": sender
                        }).then(function (response) {
                            console.log(response.data)
                            sendText(sender, "Once you have entered your location, say continue")
                            sendButtonMessage(sender, question_text, choices)
                            current_question = "picture"
                            next_question = "picture"
                        })
                    })
                }
            }
        })

    }
}

function parsePicture(sender, text, question_text, choices){
    saved_state[0] = current_question
    saved_state[1] = next_question
    if(text.includes("pass") || text.includes("yes")){
        current_question = "time"
        next_question = "time"
        sendButtonMessage(sender, question_text, choices)
    }
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
                        "title":"Get location",
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
    const sessionId = uuid.v4();

    const sessionClient = new dialogflow.SessionsClient();
    const sessionPath = sessionClient.projectAgentSessionPath(
        projectId,
        sessionId
    );

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: text,
                languageCode: 'en-US',
            },
        },
    };

    // Send request and log result
    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    let response = result.fulfillmentText
    return String(response)
}
