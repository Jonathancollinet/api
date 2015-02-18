var request = require('request')
  , httprequest = require('http')
  , formData = require('form-data')
  , fs = require('fs')
  , mmmagic = require('mmmagic')
  , magic = new mmmagic.Magic(mmmagic.MAGIC_MIME_TYPE)
  , acceptedAuth = {
      'facebook': 'https://graph.facebook.com/me?access_token=',
      'google': 'https://www.googleapis.com/plus/v1/people/me'
  };

exports = module.exports = function(req, res) {
  var workflow = require('workflow')(req, res)
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
            if (!body.email)
              return workflow.emit('exception', 'Un compte nécessite une adresse email');
            if (req.body.user_id && req.body.user_id != body.id)
              return workflow.emit('exception', 'Supplied user and provider\'s user differ');
            dataflow.social = body;
            if (!body.email)
              return workflow.emit('exception', 'Merci d\'authoriser l\'accès à votre adresse mail.');
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
          if (!body.email)
            return workflow.emit('exception', 'Merci d\'authoriser l\'accès à votre adresse mail.');
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
    req.app.db.models.User.findOne(find).populate('roles.account').exec(function(err, user) {
      if (err)
        return workflow.emit('exception', err);
      if (user) {
        workflow.outcome.user = user;
        var end = function() {
          return workflow.emit('find access token'
            , req.body.client_id
            , req.body.client_secret
            , req.body.device_id
            , req.body.device_name);
        }

        if (!user.roles.account.picture) {
          return workflow.emit('downloadAndSaveImage.'+ req.body.auth_type, function(image) {
              user.roles.account.picture = image.minified;
              user.roles.account.save(function(err, res) {
                if (err) { return workflow.emit('exception', err); }
                console.log('saved');
                return end();
              });
          });
        } else
            return end();
      }
      return workflow.emit('createUser');
    });
  });

  workflow.on('downloadAndSaveImage.facebook', function(callback) {
    var id = workflow.outcome.user ? workflow.outcome.user.facebook.id : workflow.social.id;
    var filepath = './uploads/' + req.body.auth_type + '_' + id;
    var writestream = fs.createWriteStream(filepath);
    request('http://graph.facebook.com/'+ id + '/picture?width=9999').pipe(writestream);
    writestream.on('close', function() {
      workflow.emit('processImageUpload', filepath, callback);
    });
  });

  workflow.on('downloadAndSaveImage.google', function(callback) {
    var id = workflow.outcome.user ? workflow.outcome.user.google.id : workflow.social.id;
    var filepath = './uploads/' + req.body.auth_type + '_' + id;
    var writestream = fs.createWriteStream(filepath);
    request(workflow.social.picture).pipe(writestream);
    writestream.on('close', function() {
      workflow.emit('processImageUpload', filepath, callback);
    });
  });

  workflow.on('processImageUpload', function(filepath, callback) {
    magic.detectFile(filepath, function(err, mimetype) {
      if (err)
        return next(err);
      var new_filepath = filepath + '.' + mimetype.match(/^[^/]*\/(.*)/)[1];
      fs.rename(filepath, new_filepath , function(err) {
        if (err)
          return next(err);
        var form = new formData();
        form.append('type', 'avatars');
        form.append('file', fs.createReadStream(new_filepath));
        var the_request = httprequest.request({
            method: 'POST'
          , host: 'localhost'
          , port: 8080
          , encoding: null
          , path: '/media/upload'
          , headers: form.getHeaders()
        });

        the_request.on('error', function(err) {
          workflow.emit('exception', err);
        });

        var buffer = new Buffer(0);
        the_request.on('response', function(response) {
          response.on('data', function(chunk) {
            buffer = Buffer.concat([buffer, chunk]);
          });
          response.on('error', function(err) {
            fs.unlink(new_filepath);
            return callback({success: false, original: null, minified: null });
          });
          response.on('end', function() {
            fs.unlink(new_filepath);
            return callback(JSON.parse(buffer.toString()));
          });
        });

        form.pipe(the_request);
      });
    });
  });

  workflow.on('createUser', function() {
    var toCreate = {
      isActive: 'yes',
      email: dataflow.social.email,
      search: [
        dataflow.social.email || '',
        dataflow.social.first_name || dataflow.social.name.givenName,
        dataflow.social.last_name || dataflow.social.name.familyName
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
      'name.first': dataflow.social.first_name || dataflow.social.name.givenName,
      'name.last': dataflow.social.last_name || dataflow.social.name.familyName,
      'name.full': (dataflow.social.first_name || dataflow.social.name.givenName)+' '+(dataflow.social.last_name || dataflow.social.name.familyName),
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
        workflow.emit('downloadAndSaveImage.'+req.body.auth_type, function(image) {
          workflow.outcome.account.picture = image.minified;
          workflow.outcome.account.save(function(err, res) {
            if (err) { return workflow.emit('exception', err); }
            return workflow.emit('create access token'
              , req.body.client_id
              , req.body.client_secret
              , req.body.device_id
              , req.body.device_name);
          });
        });
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
