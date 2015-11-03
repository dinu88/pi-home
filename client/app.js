var net = require('net'),
    config = require('./config_' + (process.env.ENV || 'dev') + '.js'),
    exec = require('child_process').exec,
    ngrok = require('ngrok'),
    JsonSocket = require('json-socket'),
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
      setTimeout(function() {
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
  client = new JsonSocket(new net.Socket());
  client.on('connect', function() { //Don't send until we're connected
    console.log('connected to server!');

    //if (config.ngrok.enabled) {
    //  sshTunnelling(function (url) {
    //    console.log(url);
    //    if (client)
    //      client.sendMessage({name: 'sshTunnel', 'data': url});
    //  });
    //}

    client.sendMessage({a: 5, b: 7});
    client.on('message', function(action) {
      if (action.name == 'light') {
        var command = 'pilight-send -p elro_800_switch -u 10 -s 22';
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
        var command = 'pilight-send -p elro_800_switch -u 12 -s 22';
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
        var command = 'pilight-send -p elro_800_switch -u 8 -s 22';
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
                var s = {name: 'temp', 'data': stdout};
                if (client)
                  client.sendMessage(s);
              }
            })
      }
    });
  });

  client.connect(config.netServer.port, config.netServer.host);

  client.on('end', function() {
    console.log('disconnected from server');
    client = null;
    createClient();
  });
};

createClient();