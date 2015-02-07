'use strict';

var ttl = require('mongoose-ttl');
var rateLimitSchema;

exports = module.exports = function(app, mongoose) {
  rateLimitSchema = new mongoose.Schema({
    ip: { type: String, required: true, trim: true, match: /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/ },
    created: { type: Date, default: Date.now },
    hits: { type: Number, default: 1, required: true, max: app.Config.rateLimits.maxHits }
  });
  rateLimitSchema.plugin(ttl, { ttl: app.Config.rateLimits.ttl, interval: app.Config.rateLimits.cron });
  app.db.model('RateLimit', rateLimitSchema);
};
