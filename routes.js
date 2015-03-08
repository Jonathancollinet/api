var express = require('express');
var router = express.Router();

exports.Router = function(app, passport) {
  if (app.Config.rateLimits.enabled)
    router.all('*', app.utils.RateLimit.limiter);
  router.all('*', passport.authenticate(['bearer'], { session: false }));

  // router.use(function(req, res, next) {
  //   res.set({
  //       'Pragma': 'private'
  //     , 'Cache-Control': 'private, no-cache'
  //   });
  //   next();
  // });
  // me

  router.get('/me', require('./api/users/index').me);
  router.get('/history', require('./api/users/index').history);
  router.get('/me/gallery', require('./api/users/index').gallery);
  router.get('/me/friends', require('./api/users/index').gallery);
  router.get('/me/badges', require('./api/users/index').gallery);
  router.delete('/deleteMyAccount', require('./api/users/index').delete);

  // users
  // router.get('/users', require('./api/users/index').listAll);
  // router.get('/users/findOne', require('./api/users/index').findOne);
  router.get('/users/count', require('./api/users/index').count);
  router.get('/users/:id', require('./api/users/index').findOne);
  router.get('/users/:id/gallery', require('./api/users/index').gallery);
  // router.get('/users/:id/exists', require('./api/users/index').exists);
  // router.post('/users', require('./api/users/index').create);
  // router.put('/users/:id', require('./api/users/index').updateId);

  // search
  router.post('/search/users', require("./api/search/index").users);

  // events
  router.get('/events', require('./api/events/index').listAll);
  router.get('/events/findOne', require('./api/events/index').findOne);
  router.get('/events/count', require('./api/events/index').count);
  router.get('/events/:id', require('./api/events/index').findId);
  router.get('/events/:id/gallery', require('./api/events/index').gallery)
  router.post('/events/:id/join', require('./api/events/index').join);
  router.get('/events/:id/exists', require('./api/events/index').exists);
  router.post('/events', require('./api/events/index').create);
  router.put('/events/:id', require('./api/events/index').updateId);
  router.delete('/events/:id', require('./api/events/index').delete);

  // eventRegisters
  // router.get('/eventregister', require('./api/eventRegister/index').listAll);
  // router.get('/eventregister/findOne', require('./api/eventRegister/index').findOne);
  // router.get('/eventregister/count', require('./api/eventRegister/index').count);
  // router.get('/eventregister/:id', require('./api/eventRegister/index').findId);
  // router.get('/eventregister/:id/exists', require('./api/eventRegister/index').exists);
  // router.post('/eventregister', require('./api/eventRegister/index').create);
  // router.put('/eventregister/:id', require('./api/eventRegister/index').updateId);
  // router.delete('/eventregister/:id', require('./api/eventRegister/index').delete);

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

  // validations
  router.get('/validations', require('./api/validations/index').listAll);
  router.get('/validations/:id/upvote', require('./api/validations/index').upVote);
  router.get('/validations/:id/downvote', require('./api/validations/index').downVote);
  // router.get('/validations/findOne', require('./api/validations/index').findOne);
  // router.get('/validations/count', require('./api/validations/index').count);
  // router.get('/validations/:id', require('./api/validations/index').findId);
  // router.get('/validations/:id/exists', require('./api/validations/index').exists);
  // router.post('/validations', require('./api/validations/index').create);
  // router.put('/validations/:id', require('./api/validations/index').updateId);
  // router.delete('/validations/:id', require('./api/validations/index').delete);

  // eventRegisters
  router.get('/eventRegister', require('./api/eventRegister/index').listAll);
  router.get('/eventRegister/findOne', require('./api/eventRegister/index').findOne);
  router.get('/eventRegister/count', require('./api/eventRegister/index').count);
  router.get('/eventRegister/:id', require('./api/eventRegister/index').findId);
  router.get('/eventRegister/:id/exists', require('./api/eventRegister/index').exists);
  router.post('/eventRegister', require('./api/eventRegister/index').create);
  router.put('/eventRegister/:id', require('./api/eventRegister/index').updateId);
  router.delete('/eventRegister/:id', require('./api/eventRegister/index').delete);

  return router;
}
