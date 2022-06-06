import json
from flask import Flask, redirect, send_from_directory, current_app
from flask import request
import uuid
import os
url = "http"
locations = []
times = []
ids_for_use  =[]
ids_and_locations = {}
current_id = ""

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
        root_dir = os.path.dirname(os.getcwd())
        print(root_dir)
        return send_from_directory(os.path.join(root_dir, 'location-page', 'locationpage','html'), "LocationPage.html")
    else:
        return "Page not found"

@app.route('/<id>/location', methods=['POST'])
def store_location(id):
    ids_for_use.remove(id)
    data = (json.loads(request.data))
    ids_and_locations[id] = data["location"]
    print(ids_and_locations)
    return "200"

app.run(port=3000)