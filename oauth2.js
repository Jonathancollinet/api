'use strict';

var oauth2orize   = require('oauth2orize'),
    TokenError    = require('./modules/oauth2/_tokenerror'),
    utils         = require('./modules'),
    passport      = require('passport'),
    config        = require('./config'),
    request       = require('request'),
    acceptedAuth  = {
      'facebook': 'https://graph.facebook.com/me?access_token=',
      'google': 'https://www.googleapis.com/oauth2/v1/userinfo'
    };

var server = oauth2orize.createServer();
var app = {};

server.exchange(utils.oauth2.adok(function(client, accessToken, scope, done) {
  var workflow = new (require('events').EventEmitter)();

  workflow.on('Find Access Token', function() {
    app.db.models.AdokAccessToken.findOne({ token: accessToken }).exec(function(err, token) {
      if (err || !token) { return workflow.emit('response', err || "Invalid Token"); }
      console.log(Math.round((Date.now()-token.created)/1000));
      console.log(config.token.adok.expires_in);
      if (Math.round((Date.now()-token.created)/1000) > config.token.adok.expires_in)
        return workflow.emit('Detele Access Token', token);
      return workflow.emit('Find Bearer Token', token);
    });
  });

  workflow.on('Delete Access Token', function(token) {
    token.remove(function(err) {
      if (err) { return workflow.emit('response', err); }

      return workflow.emit('response', 'Invalid Token');
    })
  });

  workflow.on('Find Bearer Token', function(token) {
    app.db.models.AccessToken.findOne({ user: token.user, client: token.client, device: { id: token.device.id, name: token.device.name } }).exec(function(err, ourAccessToken) {
      if (err) { return workflow.emit('response', err); }

      if (ourAccessToken && Math.round((Date.now()-ourAccessToken.created)/1000) > config.token.expires_in) {
        ourAccessToken.remove(function(err) {
          if (err) { return workflow.emit('response', err); }

          app.db.models.RefreshToken.findOne({ user: token.user, client: token.client, device: { id: token.device.id, name: token.device.name } }).exec(function(err, refreshToken) {
            if (err) { return workflow.emit('response', err); }

            refreshToken.remove(function(err) {
              if (err) { return workflow.emit('response', err); }

              return workflow.emit('Create Bearer Token', token);
            });
          });
        });
      } else if (!ourAccessToken) {
        return workflow.emit('Create Bearer Token', token);
      }
      app.db.models.RefreshToken.findOne({ user: token.user, client: token.client, device: { id: token.device.id, name: token.device.name } }).exec(function(err, refreshToken) {
        if (err) { return workflow.emit('response', err); }

        return workflow.emit('response', null, ourAccessToken, refreshToken, { expires_in: config.token.expires_in - Math.round((Date.now()-token.created)/1000) });
      });
    });
  });

  workflow.on('Create Bearer Token', function(token) {
    app.db.models.AccessToken.create({ user: token.user, client: token.client, device: { id: token.device.id, name: token.device.name }, token: app.utils.Tokens.Generate() }, function(err, ourAccessToken) {
      if (err) { return workflow.emit('response', err); }

      return workflow.emit('Create Bearer Refresh Token', ourAccessToken, token);
    });
  });

  workflow.on('Create Bearer Refresh Token', function(ourAccessToken, token) {
    app.db.models.RefreshToken.create({ user: token.user, client: token.client, device: { id: token.device.id, name: token.device.name }, token: app.utils.Tokens.Generate() }, function(err, refreshToken) {
      if (err) { return workflow.emit('response', err); }

      return workflow.emit('response', null, ourAccessToken, refreshToken);
    });
  });

  workflow.on('response', function(err, ourAccessToken, refreshToken, options) {
    if (err) { return done(new TokenError(err)); }
    return done(null, ourAccessToken.token, refreshToken.token, options || { expires_in: config.token.expires_in });
  });

  workflow.emit('Find Access Token');
}));

server.exchange(oauth2orize.exchange.refreshToken(function(client, refreshToken, scope, done) {
  var workflow = new (require('events').EventEmitter)();

  workflow.on('find and remove old refresh token', function() {
    app.db.models.RefreshToken.findOne({ token: refreshToken, user: client._id }).exec(function(err, res) {
      if (err)
        return workflow.emit('response', err);
      if (!res || (client._id.toString() != res.user.toString()))
        return done(null, false);
      res.remove(function(err) {
        if (err)
          return workflow.emit('response', err);
      });
      workflow.emit('remove old access token', res)
    });
  });

  workflow.on('remove old access token', function(old) {
    app.db.models.AccessToken.remove({ device: { id: old.device.id, name: old.device.Name }, user: client._id }, function(err) {
      if (err)
        return workflow.emit('response', err);
      workflow.emit('create new access token', old);
    });
  });

  workflow.on('create new access token', function(old) {
    app.db.models.AccessToken.create({ user: client._id, client: old.client, device: { id: old.device.id, name: old.device.name }, token: app.utils.Tokens.Generate() }, function(err, token) {
      if (err)
        return workflow.emit('response', err);
      workflow.emit('create new refresh token', token);
    });
  });

  workflow.on('create new refresh token', function(token) {
    app.db.models.RefreshToken.create({ user: client._id, client: token.client, device: { id: token.device.id, name: token.device.name }, token: app.utils.Tokens.Generate() }, function(err, refreshToken) {
      if (err)
        return workflow.emit('response', err);
      workflow.emit('response', null, token.token, refreshToken.token);
    });
  });

  workflow.on('response', function(err, accessToken, refreshToken) {
    if (err) { return done(new TokenError(err))}
    done(null, accessToken, refreshToken, { expires_in: config.token.expires_in });
  });

  workflow.emit('find and remove old refresh token');
}));

exports.token = [
  passport.authenticate(['adok', 'basic'], { session: false }),
  server.token(),
  server.errorHandler()
];

exports.setApp = function(App) {
  app = App;
};

exports.getApp = function() {
  return app;
};
