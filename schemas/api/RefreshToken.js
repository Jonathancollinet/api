'use strict';

exports = module.exports = function(app, mongoose) {
  var refreshTokenSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    device: {
      id: { type: String, required: true },
      name: { type: String, required: true },
    },
    token: { type: String, unique: true, required: true },
    created: { type: Date, default: Date.now }
  });
  refreshTokenSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('RefreshToken', refreshTokenSchema);
};
