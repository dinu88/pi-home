var Thermostat = function(_thermometer_, _heater_) {
  "use strict";

  var thermometer = _thermometer_,
    heater = _heater_,
    currentTemp, preferredTemp, active;

  var loopInterval = 30000; //30 seconds

  var tempRange = 0.1;

  this.init = function(_preferredTemp_) {
    if (_preferredTemp_) {
      preferredTemp = _preferredTemp_;
    }
    thermometer.getTemp(function(err, temp) {
      if (err) {
        return 'error getting thermometer temperature'
      } else {
        currentTemp = temp;
      }
    });
  };

  this.tempRange = function(_tempRange_) {
    tempRange = _tempRange_;
  };

  this.preferredTemp = function(_preferredTemp_) {
    preferredTemp = _preferredTemp_;
  };

  this.on = function() {
    if (!active) {
      active = true;
      loop();
    }
  };

  this.off = function() {
    active = false;
  };

  var loop = function() {
    if (active) {
      thermometer.getTemp(function(err, temp){
        if (err) {

          console.error(err);
          setTimeout(function() {
            loop();
          }, loopInterval);

        } else {

          currentTemp = temp;
          if (currentTemp < (preferredTemp - tempRange)) {
            console.log('thermostat: currentTemp: ' + currentTemp + '  switch heater on');
            heater.on();
          } else if(currentTemp > (preferredTemp + tempRange)) {
            console.log('thermostat: currentTemp: ' + currentTemp + '  switch heater off');
            heater.off();
          }

          setTimeout(function() {
            loop();
          }, loopInterval);

        }
      });
    }
  }

};


module.exports = Thermostat;
