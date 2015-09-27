var net = require('net'),
    config = require('./config_' + (process.env.ENV || 'dev') + '.js'),
    exec = require('child_process').exec;

var client = net.connect(config.netServer,
    function() { //'connect' listener
      console.log('connected to server!');
    });
client.on('data', function(action) {
  action = JSON.parse(action.toString());
  console.log(action);

  if (action.name == 'lamp') {
    var command = 'pilight-send -p elro_800_switch -u 7 -s 21';
    if (action.action = 'on') {
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
  }

  //client.end();
});
client.on('end', function() {
  console.log('disconnected from server');
});