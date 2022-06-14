# Fichiers importants
### et leurs comportements

- chatbot.js: le fichier qui gère la logique du
chatbot et du flow de dialogue
- IntermediateAPI.py: le fichier qui gère l'API qui connecte 
le chatbot et  la persistance de données, ainsi que n'importe quelle application
tièrce
- LocationPage.html: l'application qui permet de recueillir les coordonnées géographiques
de celui qui parle au chatbot
- question_list.json : un fichier json qui détient les questions que le chatbot pourra utiliser
- pour parler à l'utilisateur

### Chatbot.js
#### Ici nous allons expliquer les différentes fonctions de chatbot.js

- app.post('/webhook/') est une route d'api qui permet de déterminer que faire avec ce que l'utilisateur
nous a envoyé (donc le message que nous recevons par facebook messenger.) Elle classe les messages en
3 types: texte, postback (donc ce qui est envoyé par un bouton) et photos.
- detectBaseMessages() est une fonction qui détecte les 3 messages globales: quit, goodbye et hello.
Hello est en fait le else, qui est envoyé dans un call vers google dialogflow pour déterminer si c'est un message
de bienvenue (hello, hi, good morning, etc.). Si le texte est aucun de ces trois messages globales, on passe
le texte à la prochaine fonction
- detectUser() est une fonction qui permet de déterminer si l'utilisateur a déjà utilisé notre chatbot. Si nous ne
reconnaissons pas cet utilisateur, nous devons lui demander son consentement à recueillir ses données, comme l'indique 
la politique de Facebook
- determineQuestion() est notre fonction controlleur qui permet de passer le texte reçu en fonction de la question auquelle
elle répond. Par exemple, si notre question est "Where did you see the moose", nous voulons faire le traitement
de la réponse en prenant pour acquis que c'est une date.
- decideConsentStatus(), decideWhatActionToTake(), parseTime(),
parseLocation(), parsePicture(): ce sont toutes des fonctions qui servent à regarder les réponses de l'utilisateur et de les traiter
pour recueillir des données, de les envoyer à l'API, et de déterminer ce que le chatbot enverra en réponse.

## IntermediateAPI.py
- get url: Retourne un url vers le LocationPage grâce à un uuid généré one-time qui agit comme id unique pour la conversation
- get <id>: envoie la page LocationPage qui permet de la visiter à partir du lien envoyé
- post location: envoie les coordonnées géographiques de l'utilisateur, et les enregistre ainsi que le id de la conversation
- post time: envoie la date et/ou le temps que l'utilisateur entre et les enregistre ainsi que le id de la conversation

## LocationPage.html
- getLocation():  reçoit les coordonnées de l'utilisateur à partir de son navigateur
- sendLocation(): envoie la position reçue à IntermediateAPI.py pour qu'il soit enregistré