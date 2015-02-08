var crypto = require('crypto')
  , config = require('../../config');

exports = module.exports = function(app, data, tag) {
  var keyDecipher = crypto.createDecipheriv(
                   config.token.crypto.algorithm
                 , config.token.crypto.key.password
                 , config.token.crypto.key.iv);
  keyDecipher.setAuthTag(new Buffer(tag, 'hex'));
  
  var decrypted = keyDecipher.update(data, 'hex', 'utf8');
  decrypted += keyDecipher.final('utf8');

  var exploded = decrypted.split(':')
    , splitedCred = {};
  for (var i = 0; i < exploded.length; ++i) {
    var tmp = exploded[i].split('=');
    if (tmp.length == 1)
      splitedCred['datas'] = exploded[i];
    else
      splitedCred[tmp[0]] = tmp[1];
  }

  if (!splitedCred.datas || !splitedCred.tag || !splitedCred.iv)
    return null;
  var decipher = crypto.createDecipheriv(
                  config.token.crypto.algorithm
                , config.token.crypto.header.password
                , splitedCred.iv);

  decipher.setAuthTag(new Buffer(splitedCred.tag, 'hex'));
  var finalDecrypt = decipher.update(splitedCred.datas, 'hex', 'utf8');
  finalDecrypt += decipher.final('utf8');

  var splited = finalDecrypt.split(':')
    , list = {};
  for (var i = 0; i < splited.length; ++i) {
    var tmp = splited[i].split('=');
    if (tmp.length == 1)
      list['datas'] = splited[i];
    else
      list[tmp[0]] = tmp[1];
  }

  return list;
};
