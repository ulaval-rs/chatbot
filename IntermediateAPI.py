import json
from flask import Flask, send_from_directory
from flask import request, Response
import uuid

url = "http"
times = []
ids_and_locations = {}
current_id = ""
senders = []

app = Flask(__name__)

from requests import post


def get_id():
    id = str(uuid.uuid1())
    return id


@app.route('/url', methods=['GET'])
def get_url():
    id = get_id()
    return "http://localhost:3000/" + id


@app.route('/<id>', methods=['GET'])
def get_page(id):
    if id in ids_and_locations and ids_and_locations[id] is not None:
        return Response(status=400)
    else:
        return send_from_directory('html', "LocationPage.html")


@app.route('/sender', methods=['POST'])
def store_sender():
    data = (json.loads(request.data))
    print("data: " + str(data))
    senders.append(data["sender"])
    print(senders)
    return Response(status=200)


@app.route('/sender', methods=['GET'])
def get_sender():
    print(senders)
    return Response(json.dumps(senders), status=200)


@app.route('/location', methods=['POST'])
def store_location():
    data = (json.loads(request.data))
    id = data["id"]
    ids_and_locations[id] = data["location"]
    print(ids_and_locations)
    post('http://localhost:5000/location', data)
    return Response(status=200)


@app.route('/location/<id>', methods=['GET'])
def get_location(id):
    data = {
        "id": id,
        "location": ids_and_locations[id]
    }
    return Response(json.dumps(data), status=200)


@app.route('/time', methods=['POST'])
def store_time():
    data = (json.loads(request.data))
    times.append(data)
    return Response(status=200)


@app.route('/time', methods=['GET'])
def get_time():
    data = json.dumps(times)
    return Response(data, status=200)


app.run(port=3000)
