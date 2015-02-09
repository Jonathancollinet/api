'use strict';
exports = module.exports = function(req) {
  var ret =  req.headers['x-forwarded-for']
    || req.connection.retomeAddress
    || req.socket.remoteAddress
    || req.connection.socket.remoteAddress;

  return ret == '::1' ? '127.0.0.1' : ret;
};
