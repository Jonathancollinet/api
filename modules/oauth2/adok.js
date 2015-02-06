/**
 * Module dependencies.
 */
var utils = require('./_utils')
  , TokenError = require('./_tokenerror');


/**
 * Exchanges resource owner password credentials for access tokens.
 *
 * This exchange middleware is used to by clients to obtain an access token by
 * presenting the resource owner's password credentials.  These credentials are
 * typically obtained directly from the user, by prompting them for input.
 *
 * Callbacks:
 *
 * This middleware requires an `issue` callback, for which the function
 * signature is as follows:
 *
 *     function(client, username, password, scope, done) { ... }
 *
 * `client` is the authenticated client instance attempting to obtain an access
 * token.  `username` and `password` and the resource owner's credentials.
 * `scope` is the scope of access requested by the client.  `done` is called to
 * issue an access token:
 *
 *     done(err, accessToken, refreshToken, params)
 *
 * `accessToken` is the access token that will be sent to the client.  An
 * optional `refreshToken` will be sent to the client, if the server chooses to
 * implement support for this functionality.  Any additional `params` will be
 * included in the response.  If an error occurs, `done` should be invoked with
 * `err` set in idomatic Node.js fashion.
 *
 * Options:
 *
 *     userProperty    property of `req` which contains the authenticated client (default: 'user')
 *     scopeSeparator  separator used to demarcate scope values (default: ' ')
 *
 * Examples:
 *
 *     server.exchange(oauth2orize.exchange.password(function(client, username, password, scope, done) {
 *       AccessToken.create(client, username, password, scope, function(err, accessToken) {
 *         if (err) { return done(err); }
 *         done(null, accessToken);
 *       });
 *     }));
 *
 * References:
 *  - [Resource Owner Password Credentials](http://tools.ietf.org/html/draft-ietf-oauth-v2-28#section-1.3.3)
 *  - [Resource Owner Password Credentials Grant](http://tools.ietf.org/html/draft-ietf-oauth-v2-28#section-4.3)
 *
 * @param {Object} options
 * @param {Function} issue
 * @return {Function}
 * @api public
 */
module.exports = function(options, issue) {
  if (typeof options == 'function') {
    issue = options;
    options = undefined;
  }
  options = options || {};

  if (!issue) { throw new TypeError('oauth2orize.adok exchange requires an issue callback'); }

  var userProperty = options.userProperty || 'user';

  // For maximum flexibility, multiple scope spearators can optionally be
  // allowed.  This allows the server to accept clients that separate scope
  // with either space or comma (' ', ',').  This violates the specification,
  // but achieves compatibility with existing client libraries that are already
  // deployed.
  var separators = options.scopeSeparator || ' ';
  if (!Array.isArray(separators)) {
    separators = [ separators ];
  }

  return function adok(req, res, next) {
    if (!req.body) { return next(new Error('OAuth2orize requires body parsing. Did you forget app.use(express.bodyParser())?')); }

    // The 'user' property of `req` holds the authenticated user.  In the case
    // of the token endpoint, the property will contain the OAuth 2.0 client.
    var authorization = req.headers['authorization'];

    var parts = authorization.split(' ')
    if (parts.length < 2) { return this.fail(400); }

    var scheme = parts[0]
      , credentials = new Buffer(parts[1], 'base64').toString().split(':')
      , splitedCred = {};
    for (var i = 0; i < credentials.length; ++i) {
      var tmp = credentials[i].split('=');
      splitedCred[tmp[0]] = tmp[1];
    }

    var client = req[userProperty]
      , clientId = splitedCred['client_id']
      , device = req.body.device || splitedCred['device']
      , scope = req.body.scope;

  // , provider = splitedCred['provider'] || req.body.provider
  // , clientSecret = splitedCred['client_secret'] || req.body.client_secret
  // , clientToken = splitedCred['token'] || req.body.token
  // , userId = splitedCred['user_id'] || req.body.user_id
    if (!device) { return next(new TokenError('Missing required parameter: device', 'invalid_request')); }
    // if (!provider) { return next(new TokenError('Missing required parameter: provider', 'invalid_request')); }
    if (!clientId) { return next(new TokenError('Missing required parameter: client_id', 'invalid_request')); }
    // if (!clientSecret) { return next(new TokenError('Missing required parameter: client_secret', 'invalid_request')); }
    // if (!clientToken) { return next(new TokenError('Missing required parameter: token', 'invalid_request')); }
    // if (!userId) { return next(new TokenError('Missing required parameter: user_id', 'invalid_request')); }

    if (scope) {
      for (var i = 0, len = separators.length; i < len; i++) {
        var separated = scope.split(separators[i]);
        // only separate on the first matching separator.  this allows for a sort
        // of separator "priority" (ie, favor spaces then fallback to commas)
        if (separated.length > 1) {
          scope = separated;
          break;
        }
      }
      if (!Array.isArray(scope)) { scope = [ scope ]; }
    }

    function issued(err, accessToken, refreshToken, params) {
      if (err) { return next(err); }
      if (!accessToken) { return next(new TokenError('Invalid resource owner credentials', 'invalid_grant')); }
      if (refreshToken && typeof refreshToken == 'object') {
        params = refreshToken;
        refreshToken = null;
      }

      var tok = {};
      tok.access_token = accessToken;
      if (refreshToken) { tok.refresh_token = refreshToken; }
      if (params) { utils.merge(tok, params); }
      tok.token_type = tok.token_type || 'Bearer';

      var json = JSON.stringify(tok);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Pragma', 'no-cache');
      res.end(json);
    }

    try {
      var arity = issue.length;
      if (arity == 5) {
        // issue(client, provider, clientId, clientSecret, clientToken, userId, scope, issued);
        issue(client, clientId, device, scope, issued);
      } else { // arity == 4
        issue(client, clientId, device, issued);
      }
    } catch (ex) {
      return next(ex);
    }
  };
};
