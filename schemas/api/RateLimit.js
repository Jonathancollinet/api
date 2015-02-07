'use strict';

exports = module.exports = function(app, mongoose) {
  var rateLimitSchema = new mongoose.Schema({
    ip: { type: String, required: true, trim: true, match: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/ },
    created: { type: Date, default: Date.now, expires: app.Config.rateLimits.ttl },
    hits: { type: Number, default: 1, required: true, max: app.Config.rateLimits.maxHits }
  });
  rateLimitSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('RateLimit', rateLimitSchema);
};
