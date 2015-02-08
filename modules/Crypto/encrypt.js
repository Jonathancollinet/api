var crypto = require('crypto')
  , config = require('../../config')
  , keyCipher = crypto.createCipheriv(
                   config.token.crypto.algorithm
                 , config.token.crypto.key.password
                 , config.token.crypto.key.iv);

exports = module.exports = function(app, data) {
  var iv = app.utils.Tokens.Generate(48)
    , cipher = crypto.createCipheriv(
                  config.token.crypto.algorithm
                , config.token.crypto.header.password
                , iv)

  var cryptedData = cipher.update(data, 'utf8', 'hex');
  cryptedData += cipher.final('hex');
  cryptedData += ':iv='+iv+':tag='+cipher.getAuthTag().toString('hex')

  var encrypted = 'data='+keyCipher.update(cryptedData, 'utf8', 'hex');
  encrypted += keyCipher.final('hex');
  encrypted += ':tag='+keyCipher.getAuthTag().toString('hex');
  return new Buffer(encrypted).toString('base64');
};
