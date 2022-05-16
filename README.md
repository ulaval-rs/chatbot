# To deploy locally with ngrok

### Required before

- ngrok account
- ngrok downloaded
- node.js 16.14.2

## Install the app

1. pull from the git repo

2. make sure node is installed

3. install dependencies
```bash
npm install express body-parser request
``` 

## Run app on local server
Make sure you have an ngrok account


1. use the command 
```bash
   ngrok.exe http 5000
```
to run a local server on port 5000 (what our chatbot runs on)
save the url that appears on the console

2. run the application with the command
```bash
node index.js
```
to test if the app is up and running, visit the url given to you
by ngrok

### Link app to Facebook page

1. go to developers.facebook.com and create a messenger app

    - if you do not have a facebook page create one


2. generate token and put it in the app in the command line
```bash
export TOKEN={your token here}
``` 
the callback url asked for is the url that was given to you by ngrok

the verify token is available on the dashboard of your ngrok account at https://dashboard.ngrok.com/get-started/setup

3. subscribe to messages, messaging_postbacks, messaging_optins and messaging_deliveries

4. use a curl command to test connection to facebook page
```bash
curl -X POST "https://graph.facebook.com/v2.6/me/subscribed_apps?subscribed_fields=message_deliveries&messages&messaging_optins&messaging_postbacks&access_token={your secret token here}"

``` 

# To deploy application to Heroku

### Required before

- heroku account

- heroku CLI https://devcenter.heroku.com/articles/heroku-cli

- node.js 16.14.2


### Installing the chatbot

1. pull from the git repo

2. make sure node is installed

3. install dependencies
```bash
npm install express body-parser request
``` 

### Deploy app to heroku

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

### Link heroku app and facebook page
1. Choose a verification token. Set it in the heroku config like this

``` 
heroku config:set VERIFY_TOKEN={your_token}
``` 

2. go to developers.facebook.com and create a messenger app 
   - if you do not have a facebook page to be used create one
   - choose a 'Business' type app 
   - when asked to 'add products to your app', choose Messenger
   
3. generate web token and put it in the app in the command line
```bash
heroku config:set TOKEN={your token here}
``` 
the callback url asked for is the url of your heroku project


the verification token is the token you chose in step 1

4. subscribe to messages, messaging_postbacks, messaging_optins and messaging_deliveries

5use a curl command to test connection to facebook page
```bash
curl -X POST "https://graph.facebook.com/v2.6/me/subscribed_apps?subscribed_fields=message_deliveries&messages&messaging_optins&messaging_postbacks&access_token={your secret token here}"

``` 

now if you message your page you should get a response!


