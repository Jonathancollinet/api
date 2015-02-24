var mongoose = require('mongoose')
  , moment = require('moment')
  , express = require('express')
  , config = require('../config')
  , Identity = require('fake-identity')
  , Ipsum = require('lorem-ipsum')
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
          , hashtag: self.company.split(' ')
          , desc: Ipsum({ count: 1, units: 'paragraphs'}).slice(0, Math.floor(Math.random() * 301) % 300)
	  , picture: 'http://lorempixel.com/500/500/nightlife/' + ((i + 1) % 11)
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
