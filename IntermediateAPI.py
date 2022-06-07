import json
from flask import Flask, send_from_directory
from flask import request, Response
import uuid

url = "http"
times = []
ids_and_locations = {}
current_id = ""

app = Flask(__name__)


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


@app.route('/location', methods=['POST'])
def store_location():
    data = (json.loads(request.data))
    id = data["id"]
    ids_and_locations[id] = data["location"]
    print(ids_and_locations)
    return Response(status=200)


app.run(port=3000)
