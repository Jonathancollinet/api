var request = require('request'),
    acceptedAuth = {
      'facebook': 'https://graph.facebook.com/me?access_token=',
      'google': 'https://www.googleapis.com/oauth2/v1/userinfo'
    };

exports.init = function(req, res) {
  return res.json(req.body);
};
