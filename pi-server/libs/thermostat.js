var Thermostat = function(_thermometer_) {
  "use strict";

  var thermometer = _thermometer_,
    currentTemp, preferredTemp, active,
    loopInterval;

  var tempRange = 0.2;

  this.init = function(_preferredTemp_) {
    if (_preferredTemp_) {
      preferredTemp = _preferredTemp_;
    }
    thermometer.getTemp = function(err, temp) {
      if (err) {
        return 'error getting thermometer temperature'
      } else {
        currentTemp = temp;
      }
    }
  };

  this.tempRange = function(_tempRange_) {
    tempRange = _tempRange_;
  };

  this.preferredTemp = function(_preferredTemp_) {
    preferredTemp = _preferredTemp_;
  };

  this.on = function() {
    active = true;

  };

  this.off = function() {
    active = false;
  };

  //var getTempInterval = function() {
  //  loopGetTempInterval = setInterval()
  //}

};


module.exports = Thermostat;
