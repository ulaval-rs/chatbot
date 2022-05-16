## Required before

- heroku account

- heroku CLI https://devcenter.heroku.com/articles/heroku-cli

- node.js 16.14.2

## Installing the chatbot

1. pull from the git repo

2. make sure node is installed

3. install dependencies
```bash
npm install express body-parser request
``` 

## deploy app to heroku

1. login to heroku
```bash
heroku login
``` 
2. create app

```bash
heroku create
``` 
3. go into 
``` 
.github/workflows/main.yml
``` 

and change the name of the app for your app's name

and change the email for your email


## Link heroku app and facebook page
1. go to developers.facebook.com and create a messenger app

if you do not have a facebook page create one

2. generate token and put it in the app in the command line
```bash
heroku config:set TOKEN={your token here}
``` 
the callback url asked for is the url of your heroku project

# the verify token is "moose"

3. subscribe to messages, messaging_postbacks, messaging_optins and messaging_deliveries

4. use a curl command to link heroku and facebook
```bash
curl -X POST "https://graph.facebook.com/v2.6/me/subscribed_apps?subscribed_fields=message_deliveries&messages&messaging_optins&messaging_postbacks&access_token={your secret token here}"

``` 

now if you message your page you should get a response!


