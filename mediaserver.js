var express = require('express')
  , fs = require('fs')
  , im = require('imagemagick')
  , imageSize = require('image-size')
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

router.post('/upload', function(req, res, next) {
  var workflow = new (require('events').EventEmitter)();

  workflow.on('check request', function() {
    if (!req.body.type) {
      fs.unlink('./' + req.files.file.path);
      return workflow.emit('response', new Error('type required'));
    }

    workflow.emit('get file infos and check mime');
  });

  workflow.on('get file infos and check mime', function() {
    var reg = req.files.file.name.match(/^.*\.(jpg|jpeg|png)/i);
    workflow.outcome = { original: null, minified: null };
    workflow.imgName = reg[0];
    workflow.imgExt = reg[1];
    workflow.imgSize = imageSize('./' + req.files.file.path);

    req.app.ms.getFileMime('./' + req.files.file.path, function(err, mime) {
      if (err) { return workflow.emit('response', err); }

      workflow.imgMime = mime;
      // Should add some check on mimeType instead of extension of file (and thus setting file ext using mime)

      workflow.emit('save original file');
    });
  });

  workflow.on('save original file', function() {
    req.app.ms.getFileWriteStream('./' + req.files.file.path, workflow.imgMime, workflow.imgExt, req.body.type, function(err, writeStream) {
      if (err) { return workflow.emit('response', err); }

      fs.createReadStream('./'+req.files.file.path).pipe(writeStream);

      writeStream.on('close', function(file) {
        workflow.outcome.original = req.body.type + '/' + file.filename;

        workflow.emit('minify');
      });

      writeStream.on('error', function(err) {
        workflow.emit('response', err);
      })
    });
  });

  workflow.on('minify', function() {
    workflow.imgNameMin = workflow.imgName + '.min' + workflow.imgExt;

    im.resize({
        srcPath: './' + req.files.file.path
      , dstPath: req.app.Config.multer.dest + workflow.imgNameMin
      , quality: 0.7
      , width: 500
      , height: 500
      , format: workflow.imgExt
    }, function(err, stdout, stderr) {
      fs.unlink('./' + req.files.file.path);
      if (err) { return workflow.emit('response', err); }

      req.app.ms.getFileWriteStream(req.app.Config.multer.dest + workflow.imgNameMin, workflow.imgMime, workflow.imgExt, req.body.type + '.min', function(err, writeStream) {
        if (err) { return workflow.emit('response', err); }

        fs.createReadStream(req.app.Config.multer.dest + workflow.imgNameMin).pipe(writeStream);

        writeStream.on('close', function(file) {
          fs.unlink(req.app.Config.multer.dest + workflow.imgNameMin);

          workflow.outcome.minified = req.body.type + '/' + file.filename;

          return workflow.emit('response');
        });
      });
    });
  });

  workflow.on('response', function(err) {
    if (err) { return next(err); }

    return res.json(workflow.outcome);
  });

  workflow.emit('check request');
});

router.use(function(req, res, next) {
  if (req.files) {
    fs.unlink(req.files[Object.keys(req.files)[0]].path)
  }
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

module.exports = router;
