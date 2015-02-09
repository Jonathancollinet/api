'use strict';

var config = require('./config'),
    request = require('request'),
    TokenError = require('./modules/oauth2/_tokenerror'),
    acceptedAuth = {
      'facebook': 'https://graph.facebook.com/me?access_token=',
      'google': 'https://www.googleapis.com/oauth2/v1/userinfo'
    };

exports = module.exports = function(app, passport) {
  var AdokStrategy            = app.utils.Passport.AdokStrategy,
      BearerStrategy          = require('passport-http-bearer').Strategy;

  passport.use(new AdokStrategy(
    function(userid, client, clientSecret, device, done) {
      app.db.models.Client.findOne({ client: { id: client, secret: clientSecret }}).exec(function(err, cl) {
        if (err) { return donne(err) };
        if (!cl) { return done(null, false); }
        console.log('adok Strategy');
        var find = {};
        app.db.models.User.findById(userid).populate('roles.account').exec(function(err, user) {
          if (err || !user) { return done(new TokenError('Unknown user', 'invalid_request')); }

          return done(null, user);
        });
      });
    }
  ));

  passport.use(new BearerStrategy(
    function(accessToken, done) {
      console.log('BearerStrategy', accessToken);
      app.db.models.AccessToken.findOne({ token: accessToken}).exec(function(err, token) {
        if (err) { return done(err); }
        if (!token) { return done(null, false); }

        if (Math.round((Date.now()-token.created)/1000) > config.token.expires_in) {
          token.remove(function(err) {
            if (err) { return done(err); }
            return done(null, false);
          });
        }

        app.db.models.User.findById(token.user).populate('roles.account').exec(function(err, user) {
          if (err) { return done(err); }
          if (!user || !user.roles.account) { return done(null, false, { message: 'Unknowm user' }); }

          var info = { scope: '*' };
          done(null, user, info);
        });
      });
    }
  ));

  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    req.app.db.models.User.findById(id).populate('roles.account').exec(function(err, user) {
      done(err, user);
    });
  });
};
