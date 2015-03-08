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
      BearerStrategy          = require('passport-http-bearer').Strategy,
      BasicStrategy           = require('passport-http').BasicStrategy;

  passport.use(new AdokStrategy(
    function(accessToken, done) {
      app.db.models.AdokAccessToken.findOne({ token: accessToken }).exec(function(err, token) {
        if (err) { return done(err); }
        if (!token) { return done(null, false); }

        app.db.models.User.findById(token.user).populate('roles.account').exec(function(err, user) {
          if (err) { return done(err); }
          if (!user) { return done(new TokenError('Unknown user', 'invalid_request')); }

          return done(null, user);
        });
      });
    }
  ));

  passport.use(new BasicStrategy({ passReqToCallback: true },
    function(req, username, password, done) {
      app.db.models.Client.findOne({ client: { id: username, secret: password } }).exec(function(err, client) {
        if (err) { return done(err); }
        if (!client) { return done(null, false); }
        app.db.models.RefreshToken.findOne({ token: req.body.refresh_token }).populate('user').exec(function(err, refreshToken) {
          if (err) { return done(err); }
          if (!refreshToken) { return done(null, false); }

          return done(null, refreshToken.user, refreshToken.token);
        });
      });
    }
  ));

  passport.use(new BearerStrategy(
    function(accessToken, done) {
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
          app.db.models.Badge.populate(user, 'roles.account.badges', function(err, user) {
            if (err) { return done(err); }

            for (var i in user.roles.account.badges) {
              user.roles.account.badges[i].__v = undefined;
              user.roles.account.badges[i]._id = undefined;
              user.roles.account.badges[i].picture = app.Config.mediaserverUrl + user.roles.account.badges[i].picture;
            }

            var info = { scope: '*' };
            done(null, user, info);
          });
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
