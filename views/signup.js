var request = require('request'),
    acceptedAuth = {
      'facebook': 'https://graph.facebook.com/me?access_token=',
      'google': 'https://www.googleapis.com/oauth2/v1/userinfo'
    };

exports.init = function(req, res) {
  var workflow = require('workflow')(req, res);
  var dataflow = {};

  workflow.on('checkRequest', function() {
    if (!acceptedAuth[req.body.auth_type])
      return workflow.emit('exception', 'La connexion avec '+req.body.auth_type+' n\'est pas autorisée.')
    if (!req.body.access_token || !req.body.userID)
      return workflow.emit('exception', 'Access token and user ID must be specified.');
    workflow.emit('getSocialData');
  });

  workflow.on('getSocialData', function() {
    if (req.body.auth_type == "facebook") {
      request(acceptedAuth[req.body.auth_type]+req.body.access_token,
        function(error, response, body) {
          if (!error && response.statusCode == 200) {
            if (req.body.userID != JSON.parse(body).id)
              return workflow.emit('exception', 'Supplied user and provider\'s user differ.');
            dataflow.social = JSON.parse(body);
            workflow.emit('checkDuplicateEmail');
          } else
            return workflow.emit('exception', JSON.stringify(error || response));
      });
    } else {
      var opt = {
        url: acceptedAuth[req.body.auth_type],
        headers: {
          'Authorization': 'Bearer '+req.body.access_token
        }
      };
      request(opt, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          if (req.body.userID != JSON.parse(body).id)
            return workflow.emit('exception', 'Supplied user and provider\'s user differ.');
          dataflow.social = JSON.parse(body);
          workflow.emit('checkDuplicateEmail');
        } else
          return workflow.emit('exception', JSON.stringify(error || response));
      })
    }
  });

  workflow.on('checkDuplicateEmail', function() {
    var find = {};
    console.log(dataflow.social);
    find[req.body.auth_type+'.id'] = dataflow.social.id;
    req.app.db.models.User.findOne(find).exec(function(err, user) {
      if (err)
        return workflow.emit('exception', err);
      if (user) {
        return workflow.emit('redirect', '/login');
        return workflow.emit('exception', 'Ce compte '+req.body.auth_type+' est déjà utilisé.');
      }
      workflow.emit('createUser');
    });
  });

  workflow.on('createUser', function() {
    var toCreate = {
      isActive: 'yes',
      email: dataflow.social.email,
      search: [
        dataflow.social.email,
        dataflow.social.first_name || dataflow.social.given_name,
        dataflow.social.last_name || dataflow.social.family_name
      ]
    };
    toCreate[req.body.auth_type] = dataflow.social;
    req.app.db.models.User.create(toCreate, function(err, user) {
      if (err)
        return workflow.emit('exception', err);
      workflow.outcome.user = user;
      workflow.emit('createAccount');
    });
  });

  workflow.on('createAccount', function() {
    var toCreate = {
      isVerified: 'yes',
      'name.first': dataflow.social.first_name || dataflow.social.given_name,
      'name.last': dataflow.social.last_name || dataflow.social.family_name,
      'name.full': (dataflow.social.first_name || dataflow.social.given_name)+' '+(dataflow.social.last_name || dataflow.social.family_name),
      user: {
        id: workflow.outcome.user._id,
        email: workflow.outcome.user.email
      },
      search: [
        workflow.outcome.user.email
      ]
    };
    req.app.db.models.Account.create(toCreate, function(err, account) {
      if (err)
        return workflow.emit('exception', err);
      workflow.outcome.account = account;
      // To add -> Generate Token API & return it
      return workflow.emit('redirect', '/login');
      return workflow.emit('response');
    });
  });

  workflow.emit('checkRequest');
};
