# Adok API

## Image-server - Prérequis-

Premièrement vous devez vérifier si imagemagick est installé sur votre OS :
```sh
~@root: convert --version
Version: ImageMagick 7.0.0-0 Q16 x64 2015-01-31 http://www.imagemagick.org
Copyright: Copyright (C) 1999-2015 ImageMagick Studio LLC
Features: DPC Modules HDRI OpenMP
Delegates (built-in): bzlib cairo freetype jbig jng jp2 jpeg lcms lqr openexr pangocairo png ps rsvg tiff webp xml zlib
```

Si ce n'est pas le cas, téléchargez le driver http://www.imagemagick.org/download/binaries/ et installez-le.
Vérifiez de nouveau que convert est bien installé.

Si vous exécutez `npm install` et qu'une erreur liée à python est affichée, vérifier que python2.7 est bien installé et exécutez `npm install --python=python27`

Une fois tout installé vous pouvez lancer l'application.

## How To

Liste des informations nécessaires lors de l'inscription :
- Nom du provider utilisé (Google/Facebook)
- ID de l'utilisateur sur ce provider* (optional)
- Token utilisé pour accéder à l'API du provider*
- Nom du device
- ID de l'application (contenu dans la db)
- Secret de l'application (contenu dans la db)
- Unique ID du téléphone
- Nom du téléphone
> ces informations sont transmises par Google et Facebook lors de la connexion via le bouton "S'inscrire/Se connecter"

Envoyer une requête POST sur /signup contenant :
- Dans le body
  - `auth_type=google/facebook`
  - `access_token=TOKEN`
  - `user_id=USER_ID`(optional)
  - `client_id=CLIENT_ID`
  - `client_secret=CLIENT_SECRET`
  - `defive_id=DEVICE_ID`
  - `device_name=DEVICE_NAME`

Un appel réussi à /signup renvoit un objet JSON :
```json
{
  "access_token": ".......",
  "expires_in": 600,
  "token_type": "Adok"
}
```

Les appels suivants à /signup reverra un nouvel objet json contenant les informations pour se connecter au service.

Envoyer une requête POST sur /login contenant :
- Dans le header
 -- `Authorization: Adok STRING` où STRING représente la chaine obtenu via /signup
- Dans le body
 -- `grant_type=adok`

Un appel réussi à /login renvois un objet formé comme suit :
```json
{
  "access_token": "2d10b4c018c90b95503aeba737dd569843252a43fdae45fb4089439aca88b0e1",
  "refresh_token": "36bde2d2099ece0b25d9bd2c70633b9cbace232e1ccfa898c0a891bf243e3c19",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

`access_token` contient le token permettant d'accéder à l'API
`refresh_token` contient un token servant à générer un nouveau Token et invalider l'ancien (renvoi de nouveau un objet json)
`expires_in` Nombre de secondes avant que le token n'expire.
`token_type` Type de token


### Effectuer une requête à l'API

Pour effectuer une requête à l'API il faut ajouter dans le header de chacune de vos requêtes :
`Authorization: Bearer ACCESS_TOKEN`


### Refresh Token

Pour générer un nouveau token, vous devez envoyer une requête POST sur /login avec :
Dans le header
- `Authorization: Basic CHAINE_BASE64` où CHAINE_BASE64 doit être générer comme suite base64encode(client_id+':'+client_secret)
Dans le body
- `grant_type=refresh_token`
- `refresh_token=REFRESH_TOKEN`

Si l'appel se passe correctement, un nouvel objet json est renvoyé.

## Routes

Pour la plupart des modèles, un CRUD est disponible.
Le ':id' correspond à un ID.

GET -> récupère
- /X/findOne : renvoi un X.
- /X/count : renvoi le nombre de X.
- /X/:id : renvoi l'id depuis X.
- /X/:id/exists : renvoi si l'id depuis X existe.

POST -> crée
- /X : créer un X

PUT -> met à jour
- /X/:id : met à jour l'id depuis X.

DELETE -> supprime
- /X/:id : supprime l'id depuis X.

### Ensemble des routes

### me -> Retourne les informations concernant l'user connecté
- `get('/me');`

### deleteMyAccount -> Efface le compte de l'utilisateur et toutes les données liées à celui-ci
- `delete('/deleteMyAccount');`

### users (Pour les users)
- `get('/users/count');` nombre d'users total
- `get('/users/:id');` ce user
- `get('/users/:id/gallery');` les images postées par l'utilisateur

### events (un défi)
- `get('/events');`  utilisé pour récupérer la liste des évènements
  - Liste des paramètres disponibles
    - `limit` permet de changer le nombre d'objets renvoyés (Défaut: 20)
    - `sort_by` permet de changer l'attribut servant à trier (Défaut: end)
    - `sort_order` permet de changer l'ordre du tri (Défaut: -1)
      - valeurs possibles : 1/-1(Ascendant/Descendant)
    - `last_item` Permet de récupérer la suite des évènements. Si fourni, doit contenir la valeur `has_more`.
    - Exemple : /events?last_item=2015-06-12T22:09:35.395Z
  - Renvoit un objet formé comme suit (exemple avec limit=1):
```json
{
  "items": [
    {
      "_id": "54e4ddbf20602d5428fd41e2",
      "title": "Margie's Travel",
      "acc": {
        "_id": "54e465146ec7262420f69cfa",
        "picture": "http://127.0.0.1:8080/media/avatars/54e4656f6ec7262420f69d02.min.jpeg",
        "name": "Lilian Cahuzac"
      },
      "end": "2015-02-20T23:45:19.045Z",
      "start": "2015-02-18T18:45:19.045Z",
      "desc": ""
    }
  ],
  "has_more": true,
  "last_item": "54e4ddbf20602d5428fd41e2"
}
```
  - `has_more` vaut true si il reste des évènements à récupérer (utilisez alors `last_item`)
- `get('/events/findOne');`
- `get('/events/count');`
- `get('/events/:id')`;
- `get('/events/:id/exists');`
- `post('/events');` créer un défi
  - Fournissez dans le body :
    - `title` le titre du défi
    - `desc` la description du défi (optionnel)
    - `hashtag` les tags de recherche
    - `place` l'adresse de l'evenement (optionnel)
    - `latLng[]` la latitude (optionnel)
    - `latLng[]` la longitude (optionnel)
    - `latLng` array json (optionnel)
  - Déclarer deux `latLng[]` enverra un tableau. Vous pouvez egalement faire latLng = array_json
- `put('/events/:id');` met a jour ce défi (Tous les champs sont optionnels)
  - Fournir dans le body (optionnel) :
    - `title` le titre du défi
    - `desc` la description du défi (optionnel)
    - `hashtag` les tags de recherche
    - `place` l'adresse de l'evenement (optionnel)
    - `latLng[]` la latitude (optionnel)
    - `latLng[]` la longitude (optionnel)
    - `latLng` array json (optionnel)
  - Pour upload une image, la requete PUT doit être une requête multipart/form-data et fournir dans le body :
    - `file` le fichier a upload
- `delete('/events/:id');` supprime ce défi

#### Upload d'image


### eventRegisters (liste des users enregistré a un défi) incomplet
- `get('/eventregister/:id');`
- `get('/eventregister/:id/exists');`
- `post('/eventregister');`
- `put('/eventregister/:id');`
- `delete('/eventregister/:id');`

schéma pour les events register->
```json
{
    "event": { "type": "mongoose.Schema.Types.ObjectId", "reference vers l'objet": "Event" },
    "account": [{
      "_id": { "type": "mongoose.Schema.Types.ObjectId", "reference vers l'objet": "Account" },
      "conf": { "type": "Number", "default": "0" }
    }]
}
```

### badges (les badges)
- `get('/badges');`
- `get('/badges/findOne');`
- `get('/badges/count');`
- `get('/badges/:id');`
- `get('/badges/:id/exists');`
- `post('/badges');`
- `put('/badges/:id');`
- `delete('/badges/:id');`

schéma pour un badge->
```json
{
	"name":  {"type": "String"},
	"title": {"type": "String"},
	"desc": {"type": "String"},
}
```

### validations (validation des users par rapport a un défis) incomplet
- `get('/validations');`
- `get('/validations/findOne');`
- `get('/validations/count');`
- `get('/validations/:id');`
- `get('/validations/:id/exists');`
- `post('/validations');`
- `put('/validations/:id');`
- `delete('/validations/:id');`

# Testing

```sh
npm install -g mocha
mocha tests/generateEvents.js
```
