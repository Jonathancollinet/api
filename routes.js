var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', require('./views/homepage').init);

// users
router.get('/users', require('./api/users/index').listAll);
router.get('/users/findOne', require('./api/users/index').findOne);
router.get('/users/count', require('./api/users/index').count);
router.get('/users/:id', require('./api/users/index').findId);
router.get('/users/:id/exists', require('./api/users/index').exists);
router.post('/users', require('./api/users/index').create);
router.put('/users/:id', require('./api/users/index').updateId);
router.delete('/users/:id', require('./api/users/index').delete);
router.post('/signup', require('./views/signup').init);
router.post('/login', require('./views/login').init);

module.exports = router;
