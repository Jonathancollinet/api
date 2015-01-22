'use strict';

exports = module.exports = function(app, mongoose) {
  var walk = require('walk'),
      walker, options;

  options = {
    followLinks: false,
    listeners: {
      file: function(root, stat, next) {
        console.log("Loading "+stat.name+" model...");
        require(root+stat.name)(app, mongoose); 
        next();
      }
    }
  };

  walker = walk.walkSync('./schemas/', options);
};
