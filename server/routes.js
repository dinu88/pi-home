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


module.exports = function (app, passport, account, config, logger, io) {
  "use strict";

  var devices = [
    {
      name: 'Light',
      query: 'light',
      action: {
        on: 'pilight-send -p elro_800_switch -u 10 -s 22 -t',
        off: 'pilight-send -p elro_800_switch -u 10 -s 22 -f'
      }
    }, {
      name: 'Lamp',
      query: 'lamp',
      action: {
        on: 'pilight-send -p elro_800_switch -u 12 -s 22 -t',
        off: 'pilight-send -p elro_800_switch -u 12 -s 22 -f'
      }
    }, {
      name: 'Heater',
      query: 'heater',
      action: {
        on: 'pilight-send -p elro_800_switch -u 8 -s 22 -t',
        off: 'pilight-send -p elro_800_switch -u 8 -s 22 -f'
      }
    }, {
      name: 'Socket',
      query: 'socket',
      action: {
        on: 'pilight-send -p elro_800_switch -u 14 -s 22 -t',
        off: 'pilight-send -p elro_800_switch -u 14 -s 22 -f'
      }
    }
  ];

  var spliceConnection = function(id, type) {
    if (!type || type == 'net') {
      for (var i = 0; i < netSockets.length; i++) {
        if (netSockets[i].id == id) {
          netSockets.splice(i, 1);
        }
      }
    } else {
      for (var i = 0; i < webSockets.length; i++) {
        if (webSockets[i].id == id) {
          webSockets.splice(i, 1);
        }
      }
    }

  };

  var broadcast = function(message) {
    if (message.destionation == 'net') {
      console.log(message, __line);
      for (var i = 0; i < netSockets.length; i++) {
        console.log(i);
        if (netSockets[i] && !netSockets[i].isClosed()) {
          netSockets[i].sendEndMessage(message);
        }
      }
    }
    if (message.destionation == 'web') {
      io.emit('action', msg);
      //for (var i = 0; i < webSockets.length; i++) {
      //  if (webSockets[i] && !webSockets[i].isClosed()) {
      //    webSockets[i].sendEndMessage(message);
      //  }
      //}
    }
  };

  var Thermostat = function() {
    var currentTemp = 0;
    var preferedTemp = 22;
    Object.defineProperty(this, 'currentTemp', {
      set: function(temp) {
        currentTemp = temp;
        //setTimeout(toggleHeater, 150000);
        var msg = {
          id: 1,
          destination: 'web',
          action: {
            setTemp: currentTemp
          }
        };
        broadcast(msg);
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
      //Keep temp in +/- 0.2 degree of prefered temp
      //this will prevent system to switch heater on/off to much times
      if (currentTemp < (preferedTemp - 0.2)) {
        broadcast({name: 'heater', action: 'on'});
      } else if (currentTemp > (preferedTemp + 0.2)) {
        broadcast({name: 'heater', action: 'off'});
      }
      if (toggleTimeout) clearTimeout(toggleTimeout);
      var action = {
        destionation: 'net',
        action: 'temp'
      };
      broadcast(action);
      toggleTimeout = setTimeout(toggleHeater, 150000);
    }

  };
  var thermostat = new Thermostat();

  var netServer = net.createServer();

  var netSockets = [];
  var webSockets = [];

  netServer.on('connection', function(socket) { //This is a standard net.Socket
    socket = new JsonSocket(socket); //Now we've decorated the net.Socket to be a JsonSocket
    socket.id = Math.floor(Math.random() * (99999 - 10000) + 10000);
    netSockets.push(socket);
    var action = {
      action: 'temp'
    };
    socket.sendMessage(action);
    socket.on('message', function(data) {
      if (data.name == 'temp') {
        console.log(data, __line);
        var temp = data.data.split(' ')[0].split('=')[1].split('*')[0];
        if (parseFloat(temp))  {
          thermostat.currentTemp = temp;
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

  app.get('/', account.isAuthenticated, function(req, res) {
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
      res.sendStatus(200);
    } else {
      res.redirect('/');
    }
  });

  app.get('/logout', function(req, res) {
    "use strict";
    req.logout();
    res.redirect('/')
  });

  var createDeviceQuery = function(device) {
    app.get('/home/' + device.query + '/:action', account.isAuthenticated, function(req, res) {
      console.log(device.query, req.params.action, __line);
      device.status = req.params.action;
      var msg = {
        id: 1,
        destionation: 'net',
        action: device.action[req.params.action]
      };
      broadcast(msg);
      io.emit('devices', devices);
      res.sendStatus(200);
    });
  };

  for (var i = 0; i < devices.length; i++) {
    createDeviceQuery(devices[i])
  }

  app.get('/home/thermostat/:preferredTemperature', account.isAuthenticated, function(req, res) {
    console.log('thermostat.preferedTemp = ' + req.params.preferredTemperature, __line);
    thermostat.preferedTemp = req.params.preferredTemperature;
    res.sendStatus(200);
  });

  app.get('/home/data/currentTemp', account.isAuthenticated, function(req, res) {
    res.send(thermostat.currentTemp);
  });
  app.get('/home/data/preferedTemp', account.isAuthenticated, function(req, res) {
    res.send(thermostat.preferedTemp);
  });
  app.get('/home/data/devices', account.isAuthenticated, function(req, res) {
    res.send(devices);
  });

  app.get('*', function(req, res) {
    "use strict";
    res.render('index');
  });

  io.on('connection', function(socket){
    console.log('user connected');
    webSockets.push(socket);
    socket.on('disconnect', function(){
      console.log('user disconnected');
      spliceConnection(socket.id, 'web');
    });
  });

  netServer.listen(config.app.NET_PORT, function() { //'listening' listener
    console.log(("NET server listening on port " + config.app.NET_PORT));
    console.log("Waiting client to connect...")
  });

};