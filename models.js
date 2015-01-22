'use strict';

var ignore = ['./schemas/plugins'];


exports = module.exports = function(app, mongoose) {
  var walk = require('walk'),
      walker, options;

  options = {
    followLinks: false,
    listeners: {
      file: function(root, stat, next) {
        root = root.replace('\\', '/').replace('//', '/');
        if (ignore.indexOf(root) != -1)
          return next();
        console.log("Loading "+stat.name+" model...");
        require(root+stat.name)(app, mongoose);
        next();
      }
    }
  };

  walker = walk.walkSync('./schemas/', options);
};
