angular.module('piHome', ['ngMaterial'])
    .config(function($mdThemingProvider, $mdIconProvider) {
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
    .controller('piHome', function($scope, $http) {

        var toggleLight = function(action) {
            console.log(action.enabled);
            var href = 'http://chiriacdinu.com:8013/home/lamp/';
            if (action.enabled) {
                href = href + 'on';
            } else {
                href = href + 'off';
            }
            $http.get(href).then(function(response) {
                console.log(response);
            }, function(response) {
                console.error(response);
            });
        };

        var toggleHeater = function (action) {
            console.log(action.enabled);
        };

        $scope.settings = [
            { name: 'light', action: toggleLight, actionName: 'Light', icon: 'static/images/icons/wb_incandescent.svg', enabled: true },
            { name: 'heater', action: toggleHeater, actionName: 'Heater', icon: 'static/images/icons/wb_sunny.svg', enabled: false },
        ];

    });
