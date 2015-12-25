var exec = require('child_process').exec;

var sendAction = function(switchType, actionArguments, fn) {
  "use strict";
  var command = 'pilight-send -p ' + switchType;
  for (var argument in actionArguments) {
    if (actionArguments[argument]) {
      command += ' -' + argument + ' ' + actionArguments[argument];
    } else {
      command += ' -' + argument;
    }
  }
  exec(command, function (error, stdout, stderr) {
    if (error) {
      if (fn) fn(error);
    } else {
      if (fn) fn();
    }
  });

};

var switcher = function(_switchType_, _actionArguments_, _onArguments_, _offArguments_) {
  "use strict";
  var switchType = _switchType_,
    actionArguments = _actionArguments_,
    onArguments = _onArguments_,
    offArguments = _offArguments_;

  this.on = function(fn) {
    var sendArguments = {};
    for (var argument in actionArguments) {
      sendArguments[argument] = actionArguments[argument];
    }
    for (var argument in onArguments) {
      sendArguments[argument] = onArguments[argument];
    }
    sendAction(switchType, sendArguments, fn);
  };

  this.off = function(fn) {
    var sendArguments = {};
    for (var argument in actionArguments) {
      sendArguments[argument] = actionArguments[argument];
    }
    for (var argument in offArguments) {
      sendArguments[argument] = offArguments[argument];
    }
    sendAction(switchType, sendArguments, fn);
  };

};

var pilight = {
  daemon: {
    send: sendAction
  },
  switcher: switcher
};

module.exports = pilight;