'use strict';

exports = module.exports = function(app, mongoose) {
  var clientSchema = new mongoose.Schema({
    name: { type: String, unique: true, required: true },
    client: {
      id: { type: String, unique: true, required: true },
      secret: { type: String, unique: true, required: true }
    }
  });
  clientSchema.statics.InstallAdokApplications = function() {
    app.db.models.Client.findOne({ name: 'Adok Android'}).exec(function(err, res) {
      if (!res) {
        app.db.models.Client.create({name: 'Adok Android', client: { id: app.utils.Tokens.Generate(), secret: app.utils.Tokens.Generate() }}, function(err, res) {
          app.db.models.Client.findOne({ name: 'Adok iOS'}).exec(function(err, res) {
            if (!res)
              app.db.models.Client.create({name: 'Adok iOS', client: { id: app.utils.Tokens.Generate(), secret: app.utils.Tokens.Generate() }}, function(err, res) {});
          });
        });
      }
    });
  };

  clientSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('Client', clientSchema);
};
