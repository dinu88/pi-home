angular.module('piHome', ['ngMaterial', 'ui.router'])
    .config(function ($stateProvider, $urlRouterProvider, $locationProvider) {
      "use strict";
      $locationProvider.html5Mode(true);
      $stateProvider
          .state('main', {
            url: '/',
            views: {
              'body': {
                templateUrl: 'partials/index.html',
                controller: 'piHome'
              }
            }
          }).state('logIn', {
        url: '/login',
        views: {
          body: {
            templateUrl: 'partials/login.html',
            controller: 'login'
          }
        }
      });
    })
    .config(function ($mdThemingProvider, $mdIconProvider) {
      $mdThemingProvider.theme('default')
          .primaryPalette('blue-grey', {
            'default': '900', // by default use shade 800 from the pink palette for primary intentions
            'hue-1': '100', // use shade 100 for the <code>md-hue-1</code> class
            'hue-2': '400', // use shade 600 for the <code>md-hue-2</code> class
            'hue-3': 'A100' // use shade A100 for the <code>md-hue-3</code> class
          })
          // If you specify less than all of the keys, it will inherit from the
          // default shades
          .accentPalette('teal', {
            'default': '500' // use shade 200 for default, and keep all other shades the same
          });
    })
    .controller('piHome', function ($scope, $http) {

      var socket = io();

      $scope.currentTemp = false;
      $scope.preferedTemp = 22;


      socket.on('action', function (msg) {
        if (msg.action.setTemp) {
          $scope.currentTemp = msg.action.setTemp;
        }
      });
      socket.on('devices', function (devices) {
        console.log(devices);
        for (var i = 0; i < devices.length; i++) {
          if (devices[i].status) {
            setDeviceStatus(devices[i]);
          }
        }
        $scope.$apply();
      });


      //var server = 'http://chiriacdinu.com:8013';
      var server = 'http://localhost:8013';

      $http.get(server + '/home/data/preferedTemp').success(function (preferedTemp) {
        "use strict";
        $scope.preferedTemp = parseFloat(preferedTemp);
      });
      $http.get(server + '/home/data/currentTemp').success(function (currentTemp) {
        "use strict";
        $scope.currentTemp = currentTemp;
      });
      $http.get(server + '/home/data/devices').success(function (devices) {
        "use strict";
        console.log(devices);
        for (var i = 0; i < devices.length; i++) {
          if (devices[i].status) {
            setDeviceStatus(devices[i]);
          }
        }
      });

      var setDeviceStatus = function (device) {
        "use strict";
        for (var i = 0; i < $scope.settings.length; i++) {
          if ($scope.settings[i].name == device.query) {
            if (device.status == 'on') {
              $scope.settings[i].enabled = true;
            } else {
              $scope.settings[i].enabled = false;
            }
          }
        }
      };

      var toggleAction = function (action) {
        "use strict";
        console.log(action);
        var href = server + '/home/' + action.name + '/' + (action.enabled ? 'on' : 'off');
        $http.get(href).then(function (response) {
          console.log(response);
        }, function (response) {
          console.error(response);
        });
      };

      var setPreferredTemperature = function (temp) {
        "use strict";
        var href = server + '/home/thermostat/' + temp;
        $http.get(href).then(function (response) {
          console.log(response);
        }, function (response) {
          console.error(response);
        });
      };

      $scope.settings = [
        {
          name: 'light',
          action: toggleAction,
          actionName: 'Light',
          icon: 'static/images/icons/wb_incandescent.svg',
          enabled: false
        },
        {
          name: 'lamp',
          action: toggleAction,
          actionName: 'Lamp',
          icon: 'static/images/icons/wb_incandescent.svg',
          enabled: false
        },
        {
          name: 'heater',
          action: toggleAction,
          actionName: 'Heater',
          icon: 'static/images/icons/wb_sunny.svg',
          enabled: false
        },
        {
          name: 'thermostat',
          action: setPreferredTemperature,
          actionName: 'Thermostat',
          icon: 'static/images/icons/wb_sunny.svg'
        },
        {
          name: 'socket',
          action: toggleAction,
          actionName: 'Socket Power',
          icon: 'static/images/icons/ic_power_black_24px.svg'
        }
      ];

    })
    .controller('login', function ($scope, $http, $location) {
      "use strict";
      console.log('login');
      $scope.user = {
        username: '',
        password: ''
      };

      $scope.logIn = function () {
        $http.post('/login?dynamic=true', $scope.user).success(function (res, status) {
          if (status == 200) {
            //TODO create states, use $state.go to switch state
            window.location.pathname = '/';
          }
        }).error(function (err) {
          console.log(err);
        })
      }
    });
