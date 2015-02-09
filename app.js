var config = require('./config'),
    express = require('express'),
    http = require('http'),
    spdy = require('spdy'),
    path = require('path'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    mongoose = require('mongoose')
    passport = require('passport');

var SpdyOptions = {
  key: config.ssl.key,
  cert: config.ssl.certificate,
  autoSpdy31: true
};


var routes = require('./routes.js');
var app = express();

// linking configuration file
app.Config = config;

// setting utilities
app.utils = require('./modules');

// setting up Database
app.db = mongoose.createConnection(config.mongodb.uri);
app.db.on('error', console.error.bind(console, 'mongoose connection error: '));
app.db.once('open', function() {
  console.log("Connected to mongodb " + config.mongodb.uri);
});

// loading Database's models
require('./models')(app, mongoose)
app.db.models.Client.InstallAdokApplications(app);
app.db.models.RateLimit.startTTLReaper();
// console.log(app.db.models.RateLimit);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.locals.pretty = true;

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride());
// app.use(cookieParser(config.cookieSecret));
app.use(express.static(path.join(__dirname, 'public')));

app.use(passport.initialize());

// routes.enableOauth2(app);
routes.oauth2.setApp(app);

require('./passport')(app, passport);

/* GET home page. */
app.get('/', require('./views/homepage').init);

app.use('/', routes.Router(app, passport));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

exports.app = app;

app.set('port', config.port || process.env.PORT || 8080);

if (app.Config.ssl.enabled) {
  var server = spdy.createServer(SpdyOptions, app);

  server.listen(app.get('port'), function() {
    console.log('Server listening on HTTPS -> https://localhost:' + server.address().port);
  });
} else {
  var server = http.createServer(app);

  server.listen(app.get('port'), function() {
    console.log('Server listening on HTTP -> http://localhost:' + server.address().port)
  });
}
