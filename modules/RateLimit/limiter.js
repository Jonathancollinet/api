'use strict';

exports = module.exports = function(req, res, next) {
  var ip = req.app.utils.Connection.getRemoteAddress(req);

  req.app.db.models.RateLimit
    .findOneAndUpdate({ ip: ip }, { $inc: { hits: 1 } }, { upsert: false })
    .exec(function(err, bucket) {
      if (err) {
        return next(error);
      }
      if (!bucket) {
        req.app.db.models.RateLimit.create({ ip: ip }, function(err, limiter) {
          if (err) {
            return next(error);
          }
          if (!limiter) {
            res.statusCode = 500;
            return res.json({error: 'RateLimit', message: 'Cant\' create rate limit bucket' });
          }
          var untilReset = req.app.Config.rateLimits.ttl - (new Date().getTime() - limiter.created.getTime());

          res.set('X-Rate-Limit-Limit', req.app.Config.rateLimits.maxHits);
          res.set('X-Rate-Limit-Remaining', req.app.Config.rateLimits.maxHits - 1);
          res.set('X-Rate-Limit-Reset', untilReset);

          return next();
        });
      } else {
        var untilReset = req.app.Config.rateLimits.ttl - (new Date().getTime() - bucket.created.getTime())
          , remaining = Math.max(0, req.app.Config.rateLimits.maxHits - bucket.hits);

        res.set('X-Rate-Limit-Limit', req.app.Config.rateLimits.maxHits);
        res.set('X-Rate-Limit-Remaining', remaining);
        res.set('X-Rate-Limit-Reset', untilReset);

        if (bucket.hits <= req.app.Config.rateLimits.maxHits) {
          return next();
        } else {
          res.statusCode = 429;
          return res.json({error: 'RateLimit', message: 'Too Many Requests' });
        }
      }
    }
  );
};
