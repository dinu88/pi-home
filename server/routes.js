var https = require('https'),
    http = require('http');

module.exports = function (app, passport, account, config, logger, net) {
  "use strict";

  var netConnections = [];

  var broadcast = function(message) {
    for (var i = 0; i < netConnections.length; i++) {
      if (netConnections[i].writable) {
        netConnections[i].write(JSON.stringify(message));
      } else {
        console.log('client is not writable');
        netConnections[i].end();
        netConnections.splice(i, 1);
      }
    }
  };

  var netServer = net.createServer(function(netConnection) { //'connection' listener
    console.log('client connected');

    netConnections.push(netConnection);
    netConnection.id = netConnections.indexOf(netConnection);

    netConnection.on('data', function(data) {
      "use strict";
      data = JSON.parse(data.toString());
      if (data.name = 'ping') {
        console.log(data.id, 'ping');
        netConnection.write(JSON.stringify({name: 'pong', id: data.id}));
      } else if (data.name == 'temp') {
        console.log(data);
      }
    });

    setInterval(function() {
      netConnection.write(JSON.stringify({name: 'temp'}));
    }, 1000);

    netConnection.on('end', function() {
      console.log('client disconnected');
      netConnections.splice(netConnection.id, 1);
    });
    netConnection.on('error',function(){
      console.log("%j", arguments);
    });
    //netConnection.write('hello\r\n');
    //netConnection.pipe(netConnection);
  });

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
    broadcast(action);
    res.sendStatus(200);
  });

  app.get('*', function(req, res) {
    "use strict";
    res.render('index');
  });

  netServer.listen(config.app.NET_PORT, function() { //'listening' listener
    console.log(("NET server listening on port " + config.app.NET_PORT));
    console.log("Waiting client to connect...")
  });

};