'use strict';

exports = module.exports = function(req, id, done) {
  req.app.db.models.User.findById(id).populate('roles.account').exec(function(err, user) {
    if (err) {
      return done(err);
    }
    var to_return = {
        id: user._id
      , name: user.roles.account.name.full
      , picture: user.roles.account.picture
    };
    done(null, to_return);
  });
};
