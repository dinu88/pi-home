var https = require('https'),
    http = require('http');

Object.defineProperty(global, '__stack', {
  get: function(){
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function(_, stack){ return stack; };
    var err = new Error;
    Error.captureStackTrace(err, arguments.callee);
    var stack = err.stack;
    Error.prepareStackTrace = orig;
    return stack;
  }
});

Object.defineProperty(global, '__line', {
  get: function(){
    return __stack[1].getLineNumber();
  }
});


module.exports = function (app, passport, account, config, logger, net) {
  "use strict";

  var netConnections = [];

  var broadcast = function(message) {
    for (var i = 0; i < netConnections.length; i++) {
      if (netConnections[i].writable) {
        netConnections[i].write(JSON.stringify(message));
      } else {
        console.log('client is not writable, drop connection');
        netConnections[i].end();
        spliceConnection(netConnections[i].id);
      }
    }
  };

  var spliceConnection = function(id) {
    for (var i in netConnections) {
      if (netConnections[i].id == id) {
        netConnections.splice(i);
      }
    }
    console.log(netConnections.length, __line);
  };

  var Thermostat = function() {
    var currentTemp = 0;
    var preferedTemp = 0;
    Object.defineProperty(this, 'currentTemp', {
      set: function(temp) {
        currentTemp = temp;
        toggleHeater();
      },
      get: function() {return currentTemp; }
    });
    Object.defineProperty(this, 'preferedTemp', {
      set: function(temp) {
        preferedTemp = temp;
        toggleHeater();
      },
      get: function() {return preferedTemp; }
    });

    var toggleHeater = function() {
      if (currentTemp < preferedTemp) {
        broadcast({name: 'heater', action: 'on'});
      } else {
        broadcast({name: 'heater', action: 'off'});
      }
    }

  };
  var thermostat = new Thermostat();


  var netServer = net.createServer(function(netConnection) { //'connection' listener
    console.log('client connected');

    netConnection.id = Math.floor(Math.random() * (99999 - 10000) + 10000);
    netConnections.push(netConnection);

    netConnection.on('data', function(data) {
      "use strict";
      data = JSON.parse(data.toString());
      if (data.name == 'ping') {
        console.log(data, 'ping', __line);
        netConnection.write(JSON.stringify({name: 'pong', id: data.id}));
      } else
      if (data.name == 'temp') {
        console.log(data, __line);
      } else
      if (data.name == 'sshTunnel') {
        console.log(data.data, __line);
      }
    });

    var temp = setInterval(function() {
      if (netConnection) {
        netConnection.write(JSON.stringify({name: 'temp'}));
      } else {
        clearInterval(temp);
      }
    }, 1000);

    netConnection.on('end', function() {
      console.log('client disconnected', __line);
      spliceConnection(netConnection.id);
    });
    netConnection.on('error',function(){
      console.log("%j", arguments, __line);
      netConnection.end();
      netConnection.destroy();
      netConnection.unref();
      spliceConnection(netConnection.id);
      netConnection = null;
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

  app.get('/home/light/:action', function(req, res) {
    var action = {
      name: 'light'
    };

    if (req.params.action == 'on') {
      action.action = 'on';
    } else {
      action.action = 'off';
    }
    broadcast(action);
    res.sendStatus(200);
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

  app.get('/home/heater/:action', function(req, res) {
    var action = {
      name: 'heater'
    };

    if (req.params.action == 'on') {
      action.action = 'on';
    } else {
      action.action = 'off';
    }
    broadcast(action);
    res.sendStatus(200);
  });

  app.get('/home/thermostat/:preferredTemperature', function(req, res) {
    thermostat.preferedTemp = req.params.preferredTemperature;
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