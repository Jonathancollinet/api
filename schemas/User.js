'use strict';

exports = module.exports = function(app, mongoose) {
  var userSchema = new mongoose.Schema({
    username: { type: String, default: ''},
    password: String,
    email: { type: String, unique: true },
    banned: { type: Boolean, default: false},
    roles: {
      admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
      account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }
    },
    isActive: String,
    timeCreated: { type: Date, default: Date.now },
    resetPasswordToken: String,
    facebook: {},
    google: {},
    search: [String]
  });

  userSchema.pre('remove', function(next) {
    var that = this;
    app.db.models.AdokAccessToken.remove({ user: that._id }).exec(function(e, r) {
      if (e) { return next(e); }
      app.db.models.AccessToken.remove({ user: that._id }).exec(function(e, r) {
        if (e) { return next(e); }
        app.db.models.RefreshToken.remove({ user: that._id }).exec(function(e, r) {
          if (e) { return next(e); }
          app.db.models.Admin.remove({ _id: that.roles.admin }).exec(function(e, r) {
            if (e) { return next(e); }
            app.db.models.Account.remove({ _id: that.roles.account }).exec(function(e, r) {
              if (e) { return next(e); }
              app.db.models.Event.remove({ acc: that._id }).exec(function(e, r) {
                if (e) { return next(e); }
                app.db.models.Notification.remove({ $or: [{ from: { account: that.roles.account } }, { to: that.roles.account }] }).exec(function(e, r) {
                  if (e) { return next(e); }
                  app.ms.events.remove({ metadata: { user: that._id } }, function(e, r) {
                    if (e) { return next(e); }
                    app.ms.events_min.remove({ metadata: { user: that._id } }, function(e, r) {
                      if (e) { return next(e); }
                      app.ms.avatars.remove({ metadata: { user: that._id } }, function(e, r) {
                        if (e) { return next(e); }
                        app.ms.avatars_min.remove({ metadata: { user: that._id } }, function(e, r) {
                          if (e) { return next(e); }
                          return next();
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });

  userSchema.methods.canPlayRoleOf = function(role) {
    if (role === "admin" && this.roles.admin) {
      return true;
    }
    if (role === "account" && this.roles.account) {
      return true;
    }
    return false;
  };

  userSchema.methods.defaultReturnUrl = function() {
    var returnUrl = '/';
    if (this.canPlayRoleOf('account')) {
      returnUrl = '/account/';
    }
    if (this.canPlayRoleOf('admin')) {
      returnUrl = '/admin/';
    }
    return returnUrl;
  };

  userSchema.methods.getprovider = function() {
    return this.facebook ? 'facebook' : 'google';
  };

  userSchema.statics.encryptPassword = function(password) {
    return require('crypto').createHmac('sha512', app.get('crypto-key')).update(password).digest('hex');
  };

  userSchema.plugin(require('./plugins/pagedFind'));
  userSchema.index({ email: 1 }, { unique: true });
  userSchema.index({ timeCreated: 1 });
  userSchema.index({ resetPasswordToken: 1 });
  userSchema.index({ 'facebook.id': 1 });
  userSchema.index({ 'google.id': 1 });
  userSchema.index({ search: 1 });
  userSchema.set('autoIndex', (app.get('env') === 'development'));
  app.db.model('User', userSchema);
};
