var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', require('./views/homepage').init);

module.exports = router;
