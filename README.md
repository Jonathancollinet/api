# Adok API

## How To

Liste des informations nécessaires lors de l'inscription :
- Nom du provider utilisé (Google/Facebook)
- ID de l'utilisateur sur ce provider*
- Token utilisé pour accéder à l'API du provider*
- Nom du device
- ID de l'application (contenu dans la db)
- Secret de l'application (contenu dans la db)
> ces informations sont transmises par Google et Facebook lors de la connexion via le bouton "S'inscrire/Se connecter"

Remplacez CLIENT_ID, CLIENT_SECRET, USER_ID, TOKEN, PROVIDER et DEVICE par leur valeur
> client_id=CLIENT_ID:client_secret=CLIENT_SECRET:user_id=USER_ID:token=TOKEN:provider=PROVIDER:device=DEVICE

Encodez ensuite cette chaine en Base64, elle sera utilisé pour se connecter et récupérer un Token.

Envoyer une requête POST sur /signup contenant :
- Dans le header
  - `Authorization: Adok CHAINE_BASE64`
- Dans le body
  - `auth_type=PROVIDER`
  - `access_token=TOKEN`
  - `userID=USER_ID`
  - `grant_type=adok`

> Le header n'est utile que pour la connexion (identification). Si l'inscription se passe correctement (l'utilisateur existe déjà ou celui-ci vient d'être créé) la redirection vers /login se faut automatiquement.

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

Pour générer un nouveau token, deux possibilités existent :
Refaire un appel /signup(ou /login) quand le token est expiré ou faire un appel à /login avec :
Dans le header
- `Authorization: Adok CHAINE_BASE64`
Dans le body
- `grand_type=refresh_token`
- `refresh_token=REFRESH_TOKEN`

Si l'appel se passe correctement, un nouvel objet json est renvoyé.
