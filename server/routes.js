var https = require('https'),
    http = require('http'),
    net = require('net'),
    JsonSocket = require('json-socket');

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


module.exports = function (app, passport, account, config, logger) {
  "use strict";

  var spliceConnection = function(id) {
    for (var i = 0; i < netSockets.length; i++) {
      if (netSockets[i].id == id) {
        netSockets.splice(i, 1);
      }
    }
  };

  var broadcast = function(message) {
    for (var i = 0; i < netSockets.length; i++) {
      //console.log(i, __line);
      if (netSockets[i] && !netSockets[i].isClosed()) {
        //console.log(message, __line);
        netSockets[i].sendEndMessage(message);
      }
      //else {
      //  console.log('client is not writable, drop connection');
      //  netSockets.slice(i, 1);
      //  broadcast(message);
      //  break;
      //  //TODO: splice connection
      //  //netConnections[i].end();
      //  //spliceConnection(netConnections[i].id);
      //}
    }
  };

  var Thermostat = function() {
    var currentTemp = 0;
    var preferedTemp = 22;
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

    var toggleTimeout = null;

    var toggleHeater = function() {
      if (currentTemp < preferedTemp) {
        broadcast({name: 'heater', action: 'on'});
      } else {
        broadcast({name: 'heater', action: 'off'});
      }
      if (toggleTimeout) clearTimeout(toggleTimeout);
      var action = {
        name: 'temp'
      };
      broadcast(action);
      toggleTimeout = setTimeout(toggleHeater, 150000);
    }

  };
  var thermostat = new Thermostat();

  var netServer = net.createServer();

  var netSockets = [];

  netServer.on('connection', function(socket) { //This is a standard net.Socket
    socket = new JsonSocket(socket); //Now we've decorated the net.Socket to be a JsonSocket
    socket.id = Math.floor(Math.random() * (99999 - 10000) + 10000);
    netSockets.push(socket);
    var action = {
      name: 'temp'
    };
    socket.sendMessage(action);
    socket.on('message', function(data) {
      if (data.name == 'temp') {
        console.log(data, __line);
        var temp = data.data.split(' ')[0].split('=')[1].split('*')[0];
        if (parseFloat(temp))  {
          thermostat.currentTemp(temp);
        }
      } else
      if (data.name == 'sshTunnel') {
        console.log(data.data, __line);
      }
    });

    socket.on('end', function() {
      console.log('client disconnected', __line);
      spliceConnection(socket.id);
    });
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