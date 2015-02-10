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

server.exchange(utils.oauth2.adok(function(client, clientId, deviceId, deviceName, scope, done) {
  var workflow = new (require('events').EventEmitter)();

  workflow.on('get Client ObjectId', function() {
    app.db.models.Client.findOne({ 'client.id': clientId }).exec(function(err, res) {
      if (err)
        return workflow.emit('response', err);
      workflow.emit('check if access token is still valide', res._id);
    });
  });

  workflow.on('check if access token is still valide', function(cl) {
    app.db.models.AccessToken.findOne({ user: client._id, device: { id: deviceId, name: deviceName }, client: cl }).exec(function(err, token) {
      if (err)
        return workflow.emit('response', err);

      if (!token || (Math.round((Date.now()-token.created)/1000) > config.token.expires_in))
        return workflow.emit('delete refresh token', cl);
      app.db.models.RefreshToken.findOne({ user: client._id, device: { id: deviceId, name: deviceName }, client: cl }).exec(function(err, refreshToken) {
        if (err)
          return workflow.emit('response', err);

        return workflow.emit('response', null, token.token, refreshToken.token, { expires_in: config.token.expires_in - Math.round((Date.now()-token.created)/1000) });
      });
    });
  });

  workflow.on('delete refresh token', function(cl) {
    app.db.models.RefreshToken.remove({ user: client._id, device: { id: deviceId, name: deviceName }, client: cl }, function(err) {
      if (err)
        return workflow.emit('response', err);
      workflow.emit('delete access token', cl);
    });
  });

  workflow.on('delete access token', function(cl) {
    app.db.models.AccessToken.remove({ user: client._id, device: { id: deviceId, name: deviceName }, client: cl }, function(err) {
      if (err)
        return workflow.emit('response', err);
      workflow.emit('create new access token', cl);
    });
  });

  workflow.on('create new access token', function(cl) {
    app.db.models.AccessToken.create({ user: client._id, client: cl, device: { id: deviceId, name: deviceName }, token: app.utils.Tokens.Generate() }, function(err, token) {
      if (err)
        return workflow.emit('response', err);
      workflow.emit('create new refresh token', cl, token.token);
    });
  });

  workflow.on('create new refresh token', function(cl, accessToken) {
    app.db.models.RefreshToken.create({ user: client._id, client: cl, device: { id: deviceId, name: deviceName }, token: app.utils.Tokens.Generate() }, function(err, token) {
      if (err)
        return workflow.emit('response', err);
      workflow.emit('response', null, accessToken, token.token);
    })
  });

  workflow.on('response', function(err, accessToken, refreshToken, options) {
    if (err) { return done(new TokenError(err))}
    done(null, accessToken, refreshToken, options || { expires_in: config.token.expires_in });
  });

  workflow.emit('get Client ObjectId');
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
  passport.authenticate(['adok'], { session: false }),
  server.token(),
  server.errorHandler()
];

exports.setApp = function(App) {
  app = App;
};

exports.getApp = function() {
  return app;
};
