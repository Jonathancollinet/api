'use strict';

var fs = require('fs');

exports.name = 'Adok - API';
exports.host = '127.0.0.1';
exports.port = process.env.API_PORT || 8080;
exports.url = 'http://localhost:8080/';
exports.ssl = {
  key: fs.readFileSync('ssl/certificate.key', 'utf8'),
  certificate: fs.readFileSync('ssl/certificate.crt', 'utf8')
};
exports.mongodb = {
  uri: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || process.env.MONGO_URL || 'localhost/adok?safe=true'
};
exports.oauth = {
  facebook: {
    key: '334710536706235',
    secret: '2daff7d05af78c778fb550bd826f2d35',
    login: '/auth/facebook',
    scope: ['*']
  },
  google: {
    key: '458538676630-uegc4v3q7be62jq3bbh3n5uur03lcnva.apps.googleusercontent.com',
    secret: 'kEA42ScZtcXMANPW1kM0wKoj',
    login: '/auth/google',
    callback: '/auth/callback',
    scope: ['email', 'profil']
  }
};
