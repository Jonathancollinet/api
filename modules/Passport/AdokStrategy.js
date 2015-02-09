/**
 * Module dependencies.
 */
var passport = require('passport')
  , util = require('util');


/**
 * `AdokStrategy` constructor.
 *
 * The HTTP Adok authentication strategy authenticates requests based on
 * provider, token and userid credentials contained in the `Authorization` header
 * field.
 *
 * Applications must supply a `verify` callback which accepts `provider`, `token` and
 * `userid` credentials, and then calls the `done` callback supplying a
 * `user`, which should be set to `false` if the credentials are not valid.
 * If an exception occured, `err` should be set.
 *
 * Optionally, `options` can be used to change the authentication realm.
 *
 * Options:
 *   - `realm`  authentication realm, defaults to "Users"
 *
 * Examples:
 *
 *     passport.use(new AdokStrategy(
 *       function(provider, token, userid, done) {
 *       }
 *     ));
 *
 *
 * @param {Object} options
 * @param {Function} verify
 * @api public
 */
function AdokStrategy(options, verify) {
  if (typeof options == 'function') {
    verify = options;
    options = {};
  }
  if (!verify) throw new Error('HTTP Adok authentication strategy requires a verify function');

  passport.Strategy.call(this);
  this.name = 'adok';
  this._verify = verify;
  this._realm = options.realm || 'Users';
  this._passReqToCallback = options.passReqToCallback;
}

/**
 * Inherit from `passport.Strategy`.
 */
util.inherits(AdokStrategy, passport.Strategy);

/**
 * Authenticate request based on the contents of a HTTP Basic authorization
 * header.
 *
 * @param {Object} req
 * @api protected
 */
AdokStrategy.prototype.authenticate = function(req) {
  var authorization = req.headers['authorization'];
  if (!authorization) { return this.fail(this._challenge()); }

  var parts = authorization.split(' ')
  if (parts.length < 2) { return this.fail(400); }

  var scheme = parts[0]
    , credentials = new Buffer(parts[1], 'base64').toString().split(':')
    , splitedCred = {};
  for (var i = 0; i < credentials.length; ++i) {
    var tmp = credentials[i].split('=');
    splitedCred[tmp[0]] = tmp[1];
  }
  if (!/Adok/i.test(scheme)) { return this.fail(this._challenge()); }
  if (credentials.length < 2) { return this.fail(400); }
  if (!splitedCred.data || !splitedCred.tag) { return this.fal(this._challenge()); }

  var infos = req.app.utils.Crypto.decrypt(req.app, splitedCred.data, splitedCred.tag);

  var userid = infos.user;
  var client = infos.client;
  var clientSecret = infos.secret;
  var device = infos.device;
  if (!userid || !client || !clientSecret || !device) {
    return this.fail(this._challenge());
  }
  var self = this;

  function verified(err, user) {
    if (err) { return self.error(err); }
    if (!user) { return self.fail(self._challenge()); }
    self.success(user);
  }
  if (self._passReqToCallback) {
    this._verify(req, userid, client, clientSecret, device, verified);
  } else {
    this._verify(userid, client, clientSecret, device, verified);
  }
}

/**
 * Authentication challenge.
 *
 * @api private
 */
AdokStrategy.prototype._challenge = function() {
  return 'Adok realm="' + this._realm + '"';
}


/**
 * Expose `AdokStrategy`.
 */
module.exports = AdokStrategy;
