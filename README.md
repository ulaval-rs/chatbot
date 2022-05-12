## Required before

heroku account

heroku CLI https://devcenter.heroku.com/articles/heroku-cli

node.js 16.14.2

## Installing the chatbot

pull from the git repo

make sure node is installed

install dependencies
```bash
npm install express body-parser request
``` 

## deploy app to heroku

login to heroku
```bash
heroku login
``` 
create app

```bash
heroku create
``` 
go into .github/workflow/main.yml and change the name of the app for your app's name

and change the email for your email


## Link heroku app and facebook page
go to developers.facebook.com and create a messenger app

if you do not have a facebook page create one

generate token and put it in the app in the command line
```bash
heroku config:set TOKEN={your token here}
``` 
the callback url asked for is the url of your heroku project

# the verify token is "moose"

subscribe to messages, messaging_postbacks, messaging_optins and messaging_deliveries

use a curl command to link heroku and facebook
```bash
curl -X POST "https://graph.facebook.com/v2.6/me/subscribed_apps?subscribed_fields=message_deliveries&messages&messaging_optins&messaging_postbacks&access_token={your secret token here}"

``` 

now if you message your page you should get a response!


