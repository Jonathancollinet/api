# Adok API

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
- `grand_type=refresh_token`
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

### me -> retourne des informations concernant l'user connecté
- get('/me');

### users
- get('/users');
- get('/users/findOne');
- get('/users/count');
- get('/users/:id');
- get('/users/:id/exists');
- get('/users/:id/eventCounter'); -> retourne le nombre d'event auquel cet user à participé.
- put('/users/:id');

### events
- get('/events');
- get('/events/findOne');
- get('/events/count');
- get('/events/:id');
- get('/events/:id/exists');
- post('/events');
- put('/events/:id');
- delete('/events/:id');

### eventRegisters
- get('/eventregister');
- get('/eventregister/findOne');
- get('/eventregister/count');
- get('/eventregister/:id');
- get('/eventregister/:id/exists');
- post('/eventregister');
- put('/eventregister/:id');
- delete('/eventregister/:id');

### notifications
- get('/notifications');
- get('/notifications/findOne');
- get('/notifications/count');
- get('/notifications/:id');
- get('/notifications/:id/exists');
- post('/notifications');
- put('/notifications/:id');
- delete('/notifications/:id');

### badges
- get('/badges');
- get('/badges/findOne');
- get('/badges/count');
- get('/badges/:id');
- get('/badges/:id/exists');
- post('/badges');
- put('/badges/:id');
- delete('/badges/:id');

### validations
- get('/validations');
- get('/validations/findOne');
- get('/validations/count');
- get('/validations/:id');
- get('/validations/:id/exists');
- post('/validations');
- put('/validations/:id');
- delete('/validations/:id');

### eventRegisters
- get('/eventRegister');
- get('/eventRegister/findOne');
- get('/eventRegister/count');
- get('/eventRegister/:id');
- get('/eventRegister/:id/exists');
- post('/eventRegister');
- put('/eventRegister/:id');
- delete('/eventRegister/:id');
