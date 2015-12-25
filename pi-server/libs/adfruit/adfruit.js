var sensor, pin, ready,
  command = 'sudo python ' + __dirname + '/Adafruit_Python_DHT/examples/AdafruitDHT.py',
  exec = require('child_process').exec;

var parseResults = function(result) {
  "use strict";
  console.log(result, 'result');
};

var dht = {
  init: function(_sensor_, _pin_, fn) {
    "use strict";
    var sensors = [22, 11];
    if (sensors.indexOf(_sensor_) != -1 && _pin_) {
      sensor = _sensor_;
      pin = _pin_;
      ready = true;
      exec(command + ' ' + _sensor_ + ' ' + _pin_, function(error, stdout, stderr) {
        if (error) {
          fn(error);
        } else {
          parseResults(stdout);
        }
      });
    } else {
      fn('incorrect parameters');
    }
  },
  temp: function(fn) {
    "use strict";
    if (ready) {

    }
  }
};

module.exports = {
  dht: dht
};