var express = require('express')
  , zlib = require('zlib')
  , router = express.Router();

router.get('/:root/:file.:type.:min?', function(req, res, next) {
  if (req.params.min && req.params.type != 'min')
    return next();

  var find = {
    filename: req.params.file + '.' + (req.params.min ? req.params.type + '.' + req.params.min : req.params.type)
  }

  var root = req.params.root + (req.params.min ? '.min' : '');
  req.app.ms.getFileReadStream(find, root, function(err, stream) {
    if (err) { return next(err); }
    if (!stream) { return next(new Error('Stream argument ' + stream)); }

    var statusCode = req.app.ms.Grid.setCacheControl(stream.metadatas, req, res);
    res.status(statusCode)
    if (statusCode == 304) {
      return res.send();
    }
    var acceptEncoding = req.headers['accept-encoding'] && (req.headers['accept-encoding'].split(', ').indexOf('gzip') != -1);
    var gzip = req.app.Config.gzip && acceptEncoding;
    if (!gzip) {
      res.setHeader('Content-Length', stream.file.length);
    } else {
      res.setHeader('Content-Encoding', 'gzip');
      return stream.pipe(zlib.createGzip(null)).pipe(res);
    }
    return stream.pipe(res);
  });
});

module.exports = router;
