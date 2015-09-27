var https = require('https'),
    http = require('http');

module.exports = function (app, passport, account, config, logger, netConnection) {
  "use strict";

  app.get('/', function(req, res) {
    "use strict";
    res.render('index');
  });

  app.get('/login', function(req, res) {
    "use strict";
    if (req.user)
      res.redirect('/');
    else
      res.render('index');
  });

  app.post('/login', passport.authenticate('local', { failureFlash: 'Invalid username or password.'}), function(req, res) {
    "use strict";
    if (req.query.r) {
      res.redirect(req.query.r);
    } else if (req.query.dynamic) {
      res.send(200);
    } else {
      res.redirect('/');
    }
  });

  app.get('/logout', function(req, res) {
    "use strict";
    req.logout();
    res.redirect('/')
  });

  app.get('/home/lamp/:action', function(req, res) {
    var action = {
      name: 'lamp'
    };

    if (req.params.action == 'on') {
      action.action = 'on';
    } else {
      action.action = 'off';
    }
    action = JSON.stringify(action);
    netConnection.write(action);
    res.sendStatus(200);
  });

  app.get('*', function(req, res) {
    "use strict";
    res.render('index');
  });

};