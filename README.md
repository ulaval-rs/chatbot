##Installing the chatbot

#pull from the git repo

#make sure node is installed

#install dependencies
```bash
npm install express body-parser request
``` 

##deploy app to heroku

#login to heroku
```bash
heroku login
``` 
#create app

```bash
heroku create
``` 
#push the code to heroku
```bash
git push heroku master
``` 

##Link heroku app and facebook page
#go to developers.facebook.com and create a messenger app

#if you do not have a facebook page create one

#generate token and put it in the app in the command line
```bash
heroku config:set TOKEN={your token here}
``` 
#the callback url asked for is the url of your heroku project
#the verify token is "moose"

#subscribe to messages, messaging_postbacks, messaging_optins and messaging_deliveries

#use a curl command to link heroku and facebook
```bash
curl -X POST "https://graph.facebook.com/v2.6/me/subscribed_apps?subscribed_fields=message_deliveries&messages&messaging_optins&messaging_postbacks&access_token={your secret token here}"

``` 

##To change

#commit with git
#push with this command:
```bash
git push heroku master
``` 

