/*global chrome, console*/

var contexts = ["page", "selection", "link", "editable", "image", "video", "audio"];

var createdWindows = [];

var windowOptions = function(done) {
  chrome.windows.getCurrent(function (window) {
    var options = {'url': "http://chiriacdinu.com:8013/",
      'type': 'popup',
      'height': 460,
      'width': 300,
      'focused': true,
      'top': window.top + 90,
      'left': window.width + window.left - 315
    };
    done(options);
  });
};

var closeWindows = function() {
  if (createdWindows.length) {
    for (var i in createdWindows) {
      chrome.windows.get(createdWindows[i], function (window) {
        if (chrome.runtime.lastError) {
          console.warn(chrome.runtime.lastError.message);
        } else {
          chrome.windows.remove(window.id);
        }
      });
    }
    createdWindows = [];
  }
};

//chester icon click event listener
chrome.browserAction.onClicked.addListener(function() {
  "use strict";
  console.log('createWindow');

  windowOptions(function(options) {
    closeWindows();
    chrome.windows.create(options, function (window) {
      createdWindows.push(window.id);
    });
  });

});