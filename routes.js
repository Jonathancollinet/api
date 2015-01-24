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

// events
router.get('/events', require('./api/events/index').listAll);
router.get('/events/findOne', require('./api/events/index').findOne);
router.get('/events/count', require('./api/events/index').count);
router.get('/events/:id', require('./api/events/index').findId);
router.get('/events/:id/exists', require('./api/events/index').exists);
router.post('/events', require('./api/events/index').create);
router.put('/events/:id', require('./api/events/index').updateId);
router.delete('/events/:id', require('./api/events/index').delete);

// notifications
router.get('/notifications', require('./api/notifications/index').listAll);
router.get('/notifications/findOne', require('./api/notifications/index').findOne);
router.get('/notifications/count', require('./api/notifications/index').count);
router.get('/notifications/:id', require('./api/notifications/index').findId);
router.get('/notifications/:id/exists', require('./api/notifications/index').exists);
router.post('/notifications', require('./api/notifications/index').create);
router.put('/notifications/:id', require('./api/notifications/index').updateId);
router.delete('/notifications/:id', require('./api/notifications/index').delete);

// badges
router.get('/badges', require('./api/badges/index').listAll);
router.get('/badges/findOne', require('./api/badges/index').findOne);
router.get('/badges/count', require('./api/badges/index').count);
router.get('/badges/:id', require('./api/badges/index').findId);
router.get('/badges/:id/exists', require('./api/badges/index').exists);
router.post('/badges', require('./api/badges/index').create);
router.put('/badges/:id', require('./api/badges/index').updateId);
router.delete('/badges/:id', require('./api/badges/index').delete);

router.post('/signup', require('./views/signup').init);
router.post('/login', require('./views/login').init);

module.exports = router;
