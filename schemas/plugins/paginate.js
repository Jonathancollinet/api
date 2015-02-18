'use strict';

module.exports = exports = function pagedFindPlugin (schema, filters) {
  schema.statics.paginate = function(options, cb) {
    var mediaserverUrl = require('../../config').imageUrl;
    var thisSchema = this;
    if (!options)
      options = {};
    if (!options.filters) {
      options.filters = {};
    }

    if (!options.keys) {
      options.keys = '';
    }

    if (!options.limit) {
      options.limit = 20;
    }

    if (!options.sort) {
      options.sort = {};
    }

    var output = {
      items: null,
      has_more: true
    };

    var query = thisSchema.find(options.filters, options.keys);
    query.limit(options.limit);
    query.sort(options.sort);
    for (var i in options.populate)
      query.populate(options.populate[i].path, options.populate[i].keys);
    query.lean();
    query.exec(function(err, results) {
      if (err) {
        return cb(err, null)
      }
      if (results.length < options.limit)
        output.has_more = false;
      if (options.subPopulate && results.length) {
        options.subPopulate.model.populate(results, options.subPopulate.path, function(err, popResults) {
          if (err)
            return cb(err, null);
          var skeys = options.subPopulate.keys.split(' ');
          var workflow = new (require('events').EventEmitter)();

          workflow.on('parse object', function(items, i) {
            var k = 0;
            while (k < skeys.length && items[i].acc.roles) {
              if (typeof items[i].acc.roles.account[skeys[k]] == 'function') {
                items[i].acc[skeys[k].slice(3)] = items[i].acc.roles.account[skeys[k]]();
              } else if (items[i].acc.roles.account[skeys[k]])
                items[i].acc[skeys[k]] = items[i].acc.roles.account[skeys[k]];
              ++k;
            }
            if (items[i].acc.roles && items[i].acc.picture) {
              items[i].acc.picture = mediaserverUrl + items[i].acc.picture;
            }
            if (i == (items.length - 1)) {
              return workflow.emit('parse end', items);
            }
            items[i].acc.roles = undefined;
            workflow.emit('parse object', items, i + 1);
          });

          workflow.on('parse end', function(toReturn) {
            output.items = toReturn || [];
            output.last_item = toReturn[toReturn.length - 1].date;
            return cb(null, output);
          });

          workflow.emit('parse object', popResults, 0);
        });
      } else {
        output.items = results;
        if (results.length)
          output.last_item = results[results.length - 1].date;
        cb(null, output);
      }
    });
  };
};
