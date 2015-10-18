var net = require('net'),
    config = require('./config_' + (process.env.ENV || 'dev') + '.js'),
    exec = require('child_process').exec,
    ngrok = require('ngrok'),
    client;


var sshTunnelling = function (fn) {
  "use strict";
  var connection = ngrok.connect({
    proto: 'tcp', // http|tcp|tls
    addr: 22, // port or network address
    authtoken: config.ngrok.authtoken
  }, function (err, url) {
    if (err) {
      console.log(err);
      setTimeput(function() {
        sshTunnelling(fn);
      }, 5000)
    } else {
      fn(url);
    }
  });
};

var createClient = function() {
  "use strict";
  console.log('createClient');
  client = net.connect(config.netServer,
      function() { //'connect' listener
        console.log('connected to server!');
        if (config.ngrok.enabled) {
          sshTunnelling(function (url) {
            console.log(url);
            if (client)
              client.write(JSON.stringify({name: 'sshTunnel', 'data': url}))
          });
        }
        pingServer();
      });

  client.on('error', function(err) {
    console.log(err);
    client.end();
    if (err.code == 'ECONNREFUSED') {
      client = null;
      pingServer = null;
      setTimeout(function() {
        createClient();
      }, 10000);
    }
  });

  client.on('data', function(action) {
    try {
      action = JSON.parse(action.toString());
    } catch (e) {
      return console.error(e);
    }
    if (action) {
      if (action.name == 'light') {
        var command = 'pilight-send -p elro_800_switch -u 10 -s 22 -t';
        if (action.action == 'on') {
          command = command + ' -t';
        } else {
          command = command + ' -f';
        }
        exec(command,
            function (error, stdout, stderr) {
              console.log('stdout: ' + stdout);
              console.log('stderr: ' + stderr);
              if (error !== null) {
                console.log('exec error: ' + error);
              }
            })
      } else
      if (action.name == 'lamp') {
        var command = 'pilight-send -p elro_800_switch -u 12 -s 22 -f';
        if (action.action == 'on') {
          command = command + ' -t';
        } else {
          command = command + ' -f';
        }
        exec(command,
            function (error, stdout, stderr) {
              console.log('stdout: ' + stdout);
              console.log('stderr: ' + stderr);
              if (error !== null) {
                console.log('exec error: ' + error);
              }
            })
      } else
      if (action.name == 'heater') {
        var command = 'pilight-send -p elro_800_switch -u 8 -s 22 -f';
        if (action.action == 'on') {
          command = command + ' -t';
        } else {
          command = command + ' -f';
        }
        exec(command,
            function (error, stdout, stderr) {
              console.log('stdout: ' + stdout);
              console.log('stderr: ' + stderr);
              if (error !== null) {
                console.log('exec error: ' + error);
              }
            })
      } else
      if(action.name == 'temp') {
        //TODO move Adfruit DHT to this project
        if (process.env.ENV == 'prod')
          var command = 'sudo /home/pi/sources/Adafruit_Python_DHT/examples/AdafruitDHT.py 22 4';
        else
          var command = 'uname -a';
        exec(command,
            function (error, stdout, stderr) {
              if (error) {
                console.log('stderr: ' + stderr);
              }
              console.error(stdout);
              if (error !== null) {
                console.log('exec error: ' + error);
              } else {
                var s = JSON.stringify({name: 'temp', 'data': stdout});
                if (client)
                  client.write(s);
              }
            })
      } else
      if (action.name == 'pong') {
        console.log(action.id, 'pong');
        pongs.push(action.id);
      }
    }


    //client.end();
  });

  var pongs = [];
  var timeouts = [1000, 2000, 4000];

  var pingServer = function() {
    if (client) {
      var ping = {name: 'ping', id: Math.floor(Math.random() * (99999 - 10000) + 10000)};
      console.log(ping.id, 'ping');
      if (client)
        client.write(JSON.stringify(ping));
      var pingTimeout = [];

      var clearTimeouts = function() {
        for (var j = 0; j < pingTimeout.length; j++) {
          clearTimeout(pingTimeout[j]);
        }
      };

      var createTimeout = function(i, time) {
        return setTimeout(function() {
          if (pongs.indexOf(ping.id) !== -1) {
            pongs.splice(pongs.indexOf(ping.id), 1);
            if (pingServer) pingServer();
            clearTimeouts();
          } else if (i === timeouts.length - 1) {
            client = null;
            pingServer = null;
            clearTimeouts();
            setTimeout(function() {
              createClient();
            }, 10000);
          }
        }, time);
      };

      for (var i = 0; i < timeouts.length; i++) {
        pingTimeout[i] = createTimeout(i, timeouts[i]);
      }
    }
  };

  client.on('end', function() {
    console.log('disconnected from server');
    client = null;
    pingServer = null;
    createClient();
  });
};

createClient();