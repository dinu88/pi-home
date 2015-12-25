var sensor, pin, ready,
  TEMP, HUMIDITY,
  command = 'sudo python ' + __dirname + '/Adafruit_Python_DHT/examples/AdafruitDHT.py',
  exec = require('child_process').exec;

var parseResults = function (result) {
  "use strict";
  result = result.split('  ');
  ready = true;
  return {
    temp: parseFloat(result[0].split('=')[1].replace('*', '')),
    humidity: parseFloat(result[1].split('=')[1].replace('%', ''))
  }
};

var updateData = function (done) {
  "use strict";
  //Keep this For Testing
  //var data = parseResults('Temp=22.1*  Humidity=51.8%');
  //TEMP = data.temp;
  //HUMIDITY = data.humidity;
  //ready = true;
  //done(null);

  exec(command + ' ' + sensor + ' ' + pin, function (error, stdout, stderr) {
    if (error) {
      done(error);
    } else {
      var data = parseResults(stdout);
      TEMP = data.temp;
      HUMIDITY = data.humidity;
      ready = true;
      done(null);
    }
  });
};

var getData = function (type, fn) {
  "use strict";
  updateData(function (err) {
    if (err) {
      fn(err);
    } else {
      if (type) {
        if (type.temp && type.humidity) {
          fn(null, {temp: TEMP, humidity: HUMIDITY});
        } else if (type.temp) {
          fn(null, TEMP);
        } else if (type.humidity) {
          fn(null, HUMIDITY);
        }
      } else {
        fn(null, {temp: TEMP, humidity: HUMIDITY});
      }
    }
  });
};

var dhtNotReady = function (fn) {
  "use strict";
  var message = '';
  if (sensor && pin) {
    if (fn) fn('dht not ready');
    message = 'dht not ready';
  } else {
    if (fn) fn('dht not initialised');
    message = 'dht not initialised'
  }
  return message;
};

var dht = {
  init: function (_sensor_, _pin_, fn) {
    "use strict";
    var sensors = [22, 11, 2302];
    if (sensors.indexOf(_sensor_) != -1 && _pin_) {
      sensor = _sensor_;
      pin = _pin_;
      getData(null, fn);
    } else {
      fn('incorrect parameters');
    }
  },
  getTemp: function (fn) {
    "use strict";
    if (ready) {
      getData({temp: true}, fn);
    } else {
      dhtNotReady(fn)
    }
  },
  getHumidity: function (fn) {
    "use strict";
    if (ready) {
      getData({humidity: true}, fn);
    } else {
      dhtNotReady(fn);
    }
  },
  getData: function (fn) {
    "use strict";
    if (ready) {
      getData(null, fn);
    } else {
      dhtNotReady(fn);
    }
  },
  getLatestTemp: function (fn) {
    "use strict";
    if (ready) {
      if (fn) fn(null, {temp: TEMP});
      return {temp: TEMP};
    } else {
      dhtNotReady(fn);
      return dhtNotReady();
    }
  },
  getLatestHumidity: function (fn) {
    "use strict";
    if (ready) {
      fn(null, {humidity: HUMIDITY});
    } else {
      dhtNotReady(fn);
    }
  },
  getLatestData: function (fn) {
    "use strict";
    if (ready) {
      if (fn) {
        fn(null, {humidity: HUMIDITY, temp: TEMP});
      }
      return {humidity: HUMIDITY, temp: TEMP}
    } else {
      if (fn) {
        dhtNotReady(fn);
      }
      return dhtNotReady();
    }
  }
};

module.exports = {
  dht: dht
};