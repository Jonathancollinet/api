'use strict';

var config = require('./config'),
    request = require('request'),
    TokenError = require('./modules/oauth2/_tokenerror'),
    acceptedAuth = {
      'facebook': 'https://graph.facebook.com/me?access_token=',
      'google': 'https://www.googleapis.com/oauth2/v1/userinfo'
    };

exports = module.exports = function(app, passport) {
  var AdokStrategy            = require('passport-adok').Strategy,
      BearerStrategy          = require('passport-http-bearer').Strategy;

  passport.use(new AdokStrategy(
    function(provider, token, userid, client, clientSecret, device, done) {
      app.db.models.Client.findOne({ client: { id: client, secret: clientSecret }}).exec(function(err, cl) {
        if (err) { return donne(err) };
        if (!cl) { return done(null, false); }
        if (!acceptedAuth[provider]) { return done(new TokenError(provider+' not authorized', 'invalid_request')); }

        if (provider == "facebook") {
          request(acceptedAuth[provider]+token,
            function(error, response, body) {
              if (!error && response.statusCode == 200) {
                if (userid != JSON.parse(body).id) { return done(new TokenError('Unknown user_id', 'invalid_request')); }

                var find = {};
                find[provider+'.id'] = userid;
                app.db.models.User.findOne(find).populate('roles.account').exec(function(err, user) {
                  if (err || !user) { return done(new TokenError('Unknown user', 'invalid_request')); }

                  return done(null, user);
                });
              } else
                done(new TokenError(err || response.statusCode, 'invalid_request'));
          });
        } else {
          var opt = {
            url: acceptedAuth[provider],
            headers: {
              'Authorization': 'Bearer '+token
            }
          };
          request(opt, function(error, response, body) {
            if (!error && response.statusCode == 200) {
              if (userid != JSON.parse(body).id) { return done(new TokenError('Unknown user_id', 'invalid_request')); }

              var find = {};
              find[provider+'.id'] = JSON.parse(body).id;
              req.app.db.models.User.findOne(find).populate('roles.account').exec(function(err, user) {
                if (err) { return done(new TokenError('Unknown user', 'invalid_request')); }
                return done(null, user);
              });
            } else
              done(new TokenError(error || response.statusCode, 'invalid_request'));
          });
        }
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
