from flask import Flask
from flask import request
locations = []
times = []

app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'First API call!'

##we have several api calls
##post time, post picture, post location
##we also have get url

@app.route('/location', methods=['POST'])
def add_location():
    locations.append(request.get_json())
    print(request.get_json())
    return "200"

@app.route('/time', methods=['POST'])
def add_time():
    times.append(request.get_json())
    print(request.get_json())
    return "200"

app.run(port=3000)