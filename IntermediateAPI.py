import json
from flask import Flask, redirect, send_from_directory, current_app
from flask import request, Response
import uuid
import os
url = "http"
times = []
ids_for_use  = set()
ids_and_locations = {}
current_id = ""

app = Flask(__name__)


##we have several api calls
##post time, post picture, post location
##we also have get url

def get_id():
    id = str(uuid.uuid1())
    ids_for_use.add(id)
    return id


@app.route('/url', methods = ['GET'])
def get_url():
    id = get_id()
    return "http://localhost:3000/" + id


@app.route('/<id>', methods = ['GET'])
def get_page(id):
    if id in ids_for_use:
        return send_from_directory('html', "LocationPage.html")
    else:
        return Response(status=404)

@app.route('/location', methods=['POST'])
def store_location():
    data = (json.loads(request.data))
    id = data["id"]
    ids_for_use.remove(id)
    ids_and_locations[id] = data["location"]
    print(ids_and_locations)
    return Response(status=200)

app.run(port=3000)