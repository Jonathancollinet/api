var mongoose = require('mongoose')
  , moment = require('moment')
  , express = require('express')
  , config = require('../config')
  , Identity = require('fake-identity')
  , assert = require('assert')
  , usleep = require('sleep').usleep
  , app = express();

app.Config = config;
app.utils = require('../modules')

describe('test', function(){
  var user;
  before(function(done) {
    app.db = mongoose.createConnection(config.mongodb.uri);
    app.db.on('error', done);
    app.db.once('open', function() {
      require('../models')(app, mongoose);
      done();
    });
  });

  describe('Event Generator', function() {
    it('models should have been loaded', function() {
      assert(app.db.models.Event);
      assert(app.db.models.User);
      assert(app.db.models.Account);
    });
    it('should find an user', function() {
      app.db.models.User.findOne().exec(function(err, res) {
        if (err) { throw new Error(err); }
        user = res;
        assert(res);
      })
    })
    it('should write to DB', function() {
      var newUsers = Identity.generate(500);
      var allToSave = [];
      for (var i in newUsers) {
        var self = newUsers[i];
        var toSave = {
            title: self.company
          , place: self.street + ', ' + self.zipCode + ' ' + self.city + ' ' + self.state
          , latLng: [ ((Math.random() * 1000) % 80).toFixed(4), ((Math.random() * 1000) % 80).toFixed(4)]
          , photos: ''
          , acc: user._id
          , accType: 'account'
        };
        allToSave.push(toSave);
      }
      app.db.models.Event.create(allToSave, function(err, res) {
        if (err) { throw new Error(err); }
      });
    });
  });
});
