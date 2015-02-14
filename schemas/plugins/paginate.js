'use strict';

module.exports = exports = function pagedFindPlugin (schema, filters) {
  schema.statics.paginate = function(options, cb) {
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
    query.lean();
    query.exec(function(err, results) {
      if (err) {
        return cb(err, null)
      }
      if (results.length < options.limit)
        output.has_more = false;
      output.items = results;
      cb(null, output);
    });
  };
};
