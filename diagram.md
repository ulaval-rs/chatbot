sequenceDiagram
actor User
User ->>+ Chatbot: send time
Chatbot ->> API: POST time
API ->> BD: storeTime()
Chatbot ->> API: GET Location Url
API -->> Chatbot:  URL
Chatbot -->> User: sendLocationApp()
User ->> LocationApp: give location
LocationApp ->> API: POST Location
API ->> BD: storeLocation()