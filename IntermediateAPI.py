from flask import Flask, redirect, send_from_directory, current_app
from flask import request
import uuid
url = "http"
locations = []
times = []
ids_for_use  =[]
ids_and_locations = {}

app = Flask(__name__)


##we have several api calls
##post time, post picture, post location
##we also have get url

def get_id():
    id = str(uuid.uuid1())
    ids_for_use.append(id)
    return id


@app.route('/url', methods = ['GET'])
def get_url():
    id = get_id()
    return "http://localhost:3000/" + id


@app.route('/<id>', methods = ['GET'])
def get_page(id):
    if id in ids_for_use:
        return current_app.send_static_file('LocationPage.html')
    else:
        return "Page not found"

@app.route('/<id>/location', methods=['POST'])
def store_location():
    ids_for_use.remove(id)
    ids_and_locations[id] = request.data

app.run(port=3000)