var config = require('./config_' + (process.env.ENV || 'dev') + '.js'),
  adfruit_dht = require('./libs/adfruit/adfruit').dht,
  pilight = require('./libs/pilight/pilight'),
  Thermostat = require('./libs/thermostat'),
  thermostat;

adfruit_dht.init(22, 4, function(err, data) {
  "use strict";
  if (err) console.log(err, 'err');
  else {
    console.log(data, 'data');
    var heaterSwitcher = new pilight.switcher('elro_800_switch', {u: 8, s: 22}, {t: false}, {f: false});
    thermostat = new Thermostat(adfruit_dht, heaterSwitcher);
    thermostat.init(23);
    thermostat.on();
  }
});

