exports = module.exports = function(req, res) {
  var request = require('request')
    , acceptedAuth = {
        'facebook': 'https://graph.facebook.com/me?access_token=',
        'google': 'https://www.googleapis.com/plus/v1/people/me'
      }
    , workflow = require('workflow')(req, res)
    , dataflow = {};

  workflow.on('checkRequest', function() {
    if (!req.body.auth_type)
      return workflow.emit('exception', 'Authentification Type Required');
    if (!acceptedAuth[req.body.auth_type])
      return workflow.emit('exception', 'Unauthorized Authentification Type')
    if (!req.body.access_token)
      return workflow.emit('exception', 'Provider Access Token Required');
    // if (!req.body.user_id)
    //   return workflow.emit('exception', 'Provider User ID Required');
    if (!req.body.client_id)
      return workflow.emit('exception', 'Client ID Required');
    if (!req.body.client_secret)
      return workflow.emit('exception', 'Client Secret Required');
    if (!req.body.device_id)
      return workflow.emit('exception', 'Device ID Required');
    if (!req.body.device_name)
      return workflow.emit('exception', 'Device Name Required');
    workflow.emit('checkClient');
  });

  workflow.on('checkClient', function() {
    req.app.db.models.Client.findOne({ client: { id: req.body.client_id, secret: req.body.client_secret } }).exec(function(err, res) {
      if (err || !res)
        return workflow.emit('exception', err || 'Unauthozired Client');
      workflow.outcome.client = res;
      workflow.emit('getSocialData');
    })
  });

  workflow.on('getSocialData', function() {
    if (/^facebook/i.test(req.body.auth_type)) {
      request(acceptedAuth['facebook']+req.body.access_token,
        function(error, response, body) {
          try {
            body = JSON.parse(body).id ? JSON.parse(body) : body;
          } catch (err) {
            body = body;
          }
          if (!error && response.statusCode == 200) {
            if (req.body.user_id && req.body.user_id != body.id)
              return workflow.emit('exception', 'Supplied user and provider\'s user differ');
            dataflow.social = body;
            workflow.emit('checkDuplicateEmail');
          } else
            return workflow.emit('exception', JSON.stringify(error || response));
      });
    } else if (/^google/i.test(req.body.auth_type)) {
      var opt = {
        url: acceptedAuth['google'],
        headers: {
          'Authorization': 'Bearer '+req.body.access_token
        }
      };
      request(opt, function(error, response, body) {
        if (!error && response.statusCode == 200) {
          try {
            body = JSON.parse(body).id ? JSON.parse(body) : body;
          } catch (err) {
            body = body;
          }
          // console.log(body);
          if (req.body.user_id && req.body.user_id != body.id)
            return workflow.emit('exception', 'Supplied user and provider\'s user differ');
          if (!body.emails)
            return workflow.emit('exception', 'Can\'t get email. Did you include email scope?');
          dataflow.social = body;
          for (var i = 0; i < dataflow.social.emails.length; ++i) {
            if (dataflow.social.emails[i].type == 'account') {
              dataflow.social.email = dataflow.social.emails[i].value
              break ;
            }
          }
          workflow.emit('checkDuplicateEmail');
        } else
          return workflow.emit('exception', JSON.stringify(error || response));
      })
    } else {
      return workflow.emit('exception', 'Unauthorized Client');
    }
  });

  workflow.on('checkDuplicateEmail', function() {
    var find = {};

    find[req.body.auth_type+'.id'] = dataflow.social.id;
    req.app.db.models.User.findOne(find).exec(function(err, user) {
      if (err)
        return workflow.emit('exception', err);
      if (user) {
        workflow.outcome.user = user;
        return workflow.emit('find access token'
          , req.body.client_id
          , req.body.client_secret
          , req.body.device_id
          , req.body.device_name);
      }
      workflow.emit('createUser');
    });
  });

  workflow.on('createUser', function() {
    var toCreate = {
      isActive: 'yes',
      email: dataflow.social.email,
      search: [
        dataflow.social.email || '',
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
      req.app.db.models.User.findByIdAndUpdate(workflow.outcome.user._id, { $set: { roles: { account: account._id } } }).exec(function(err, count, res) {
        if (err)
          return workflow.emit('exception', err);
        return workflow.emit('create access token'
          , req.body.client_id
          , req.body.client_secret
          , req.body.device_id
          , req.body.device_name);
      });
    });
  });

  workflow.on('find access token', function(client, secret, device_id, device_name) {
    req.app.db.models.AdokAccessToken.findOne({
        user: workflow.outcome.user._id
      , client: workflow.outcome.client._id
      , device: { id: device_id, name: device_name }
    }).populate('client').exec(function(err, token) {
      if (err)
        return workflow.emit('exception', err);
      if (!token)
        return workflow.emit('create access token', client, secret, device_id, device_name);
      if (Math.round((Date.now()-token.created)/1000) > req.app.Config.token.adok.expires_in)
        return workflow.emit('delete token', token);
      return workflow.emit('send Adok key', token);
    });
    // var access_token = req.app.utils.Crypto.encrypt(req.app
    //   , 'client=' + client
    //     + ':secret=' + secret
    //     + ':user=' + user
    //     + ':deviceID=' + device_id
    //     + ':deviceName=' + new Buffer(device_name).toString('base64'));
  });

  workflow.on('create access token', function(client, secret, device_id, device_name) {
    req.app.db.models.AdokAccessToken.create({
            user: workflow.outcome.user._id
          , client: workflow.outcome.client._id
          , device: { id: device_id, name: device_name }
          , token: req.app.utils.Tokens.Generate()
        }
      , function(err, token) {
        if (err)
          return workflow.emit('exception', err);
        return workflow.emit('send Adok key', token);
      });
  });


  workflow.on('delete token', function(token) {
    token.remove(function(err) {
      if (err)
        return workflow.emit('exception', err);
      return workflow.emit('create access token'
        , token.client.client.id
        , token.client.client.secret
        , token.device.id
        , token.device.name);
    });
  });

  workflow.on('send Adok key', function(token) {
    return res.json({
        access_token: token.token
      , expires_in: req.app.Config.token.adok.expires_in - Math.round((Date.now()-token.created)/1000)
      , token_type: 'Adok'
    });
  });

  workflow.emit('checkRequest');
};
