'use strict';

exports = module.exports = function(req) {
  return req.headers['x-forwarded-for']
    || req.connection.retomeAddress
    || req.socket.remoteAddress
    || req.connection.socket.remoteAddress;
};
