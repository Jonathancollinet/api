'use strict';

exports = module.exports = function(app, mongoose) {
  var clientSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    client: {
      id: { type: String, unique: true, required: true },
      secret: { type: String, unique: true, required: true }
    }
  });
  clientSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Client', clientSchema);
};
