var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', require('./views/homepage').init);

router.post('/signup', require('./views/signup').init);
router.post('/login', require('./views/login').init);

module.exports = router;
