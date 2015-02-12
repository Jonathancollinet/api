'use strict';
var ttl = require('mongoose-ttl');

exports = module.exports = function(app, mongoose) {
  var adokAccessTokenSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    device: {
      id: { type: String, required: true },
      name: { type: String, required: true },
    },
    token: { type: String, unique: true, required: true },
    created: { type: Date, default: Date.now }
  });
  adokAccessTokenSchema.set('autoIndex', (app.get('env') === 'development'));
  adokAccessTokenSchema.plugin(ttl, { ttl: app.Config.token.adok.expires_in * 1000, interval: app.Config.rateLimits.cron });
  app.db.model('AdokAccessToken', adokAccessTokenSchema);
};
