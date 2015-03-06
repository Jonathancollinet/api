'use strict';

var fs = require('fs');

exports.name = 'Adok - API';
exports.host = '127.0.0.1';
exports.port = process.env.API_PORT || 8080;
exports.url = 'http://' + exports.host + ':' + exports.port + '/';
exports.mediaserverUrl = 'http://127.0.0.1:8080/media/';
exports.ssl = {
  enabled: false,
  key: fs.readFileSync('ssl/certificate.key', 'utf8'),
  certificate: fs.readFileSync('ssl/certificate.crt', 'utf8')
};
exports.multer = {
  dest: './uploads/',
  fileSize: 16777216, // 16 MB
  files: 1
};
exports.mongodb = {
  uri: process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || process.env.MONGO_URL || 'localhost/adok?safe=true'
};
exports.token = {
  adok: {
    expires_in: 600
  },
  expires_in: process.env.TOKEN_LIFE || 3600,
  crypto: {
    algorithm: 'aes-256-gcm',
    key: {
      password: '6tAKc{zxj7q%9_asd\\4Qs^5%[Dc83I+m', // 32 chars
      iv: '53Jnh_5a9G7N' // 12 chars
    },
    header: {
      password: '{z6s4tjd/7q%Kc9_aQs^AxoI$2Wpd8f3' // 32 chars
    }
  }
};
exports.rateLimits = {
  enabled: false,
  cron: 60 * 1000, // 1 min
  ttl: 10 * 60 * 1000, // 10 mins
  maxHits: 600
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

exports.cookieSecret = 'asd1$-lk5D-^kl*6-/asd&#';
exports.gzip = true;
exports.filterFlux = false;
