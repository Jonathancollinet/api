'use strict';
var ttl = require('mongoose-ttl');

exports = module.exports = function(app, mongoose) {
  var accessTokenSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    device: {
      id: { type: String, required: true },
      name: { type: String, required: true },
    },
    token: { type: String, unique: true, required: true },
    created: { type: Date, default: Date.now }
  });
  accessTokenSchema.set('autoIndex', (app.get('env') === 'development'));
  accessTokenSchema.plugin(ttl, { ttl: app.Config.token.expires_in * 1000, interval: app.Config.rateLimits.cron });
  app.db.model('AccessToken', accessTokenSchema);
};
