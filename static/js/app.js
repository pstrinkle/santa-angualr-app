(function () {
    'use strict';

    var HolidayApp = angular.module('christmas_app', [
        'ngSanitize',
        'ngResource',
        'ui.bootstrap',
        'ngTagsInput',
        'ui.router',
    ]);

    HolidayApp.config(['$stateProvider', '$urlRouterProvider',
                       function($stateProvider, $urlRouterProvider) {

        $urlRouterProvider.otherwise('/');

        $stateProvider.state('start', {
            name: 'start',
            url: '/',
            templateUrl: 'start.html',
            controller: 'startCtrl',
        }).state('wishlist', {
            name: 'wishlist',
            url: '/wishlist',
            templateUrl: 'wishlist.html',
            controller: 'wishlistCtrl',
            params: {
                person: {},
            },
        }).state('favorites', {
            name: 'favorites',
            url: '/favorites',
            templateUrl: 'favorites.html',
            controller: 'favoriteCtrl',
            params: {
                gifts: [],
                person: {},
            },
        }).state('submission', {
            name: 'submission',
            url: '/submission',
            templateUrl: 'submission.html',
            controller: 'submissionCtrl',
            params: {
                gifts: [],
                person: {},
            },
        });
    }]);

    /* App.run, lets you initialize global stuff. */
    HolidayApp.run(function($rootScope, $state) {
        $rootScope.$on('$stateChangeError', console.log.bind(console));
    });

    HolidayApp.controller('startCtrl', ['$scope', '$state', '$timeout', function($scope, $state, $timeout) {
        /* Controller for initial state. */

        $scope.config = {
            name: {
                min_length: 3,
                max_length: 48,
            },
            types: [
                'good',
                'bad',
            ],
        };

        $scope.connecting = false;
        $scope.dynamic = 0;
        $scope.message = '!!! Connecting !!!';

        $scope.connect = function() {
            /* fake trying to connect, as it transitions to the next step. */
            $scope.connecting = true;
            $scope.dynamic = 50;

            $timeout(function(){
                $scope.dynamic = 75;

                $timeout(function() {
                    $scope.dynamic = 100;
                    $scope.message = 'Connected';

                    $timeout(function() {
                        $state.transitionTo('wishlist', {person: {name: $scope.name, behavior: $scope.behavior}});
                    }, 750);
                }, 1000);
            }, 1500);
        };
    }]);

    HolidayApp.controller('wishlistCtrl', ['$scope', '$state', function($scope, $state) {

        $scope.items = ['hippopotamus'];
        $scope.person = {};

        var suggestedItems = [
            'bicycle',
            'cake',
            'candycane',
            'hippopotamus',
            'lego',
            'nutcracker',
            'pie',
            'pony',
            'shoes',
            'slippers',
            'toys',
            'train',
            'wand',
            'wine',
        ];

        function initializeEverything() {
            if ($state.params.person.name === undefined) {
                $state.go('start');
            }

            angular.copy($state.params.person, $scope.person);
        }

        initializeEverything();

        $scope.loadSuggestions = function(query) {
            var returns = [];
            var lowered = query.toLowerCase();

            for (var i = 0; i < suggestedItems.length; i++) {
                if (suggestedItems[i].indexOf(lowered) === 0) {
                    returns.push({text: suggestedItems[i], color: randomColor()});
                }
            }

            return returns;
        };

        $scope.itemAdded = function(tag) {
        };

        $scope.itemRemoved = function(tag) {
        };

        $scope.nextStep = function() {
            $state.go('^.favorites', {gifts: $scope.items, person: $scope.person});
        };
    }]);

    HolidayApp.controller('favoriteCtrl', ['$scope', '$state', function($scope, $state) {

        $scope.items = [];
        $scope.person = {};

        function initializeEverything() {
            if ($state.params.gifts.length === 0) {
                $state.go('start');
            }

            angular.copy($state.params.gifts, $scope.items);
            angular.copy($state.params.person, $scope.person);
        }

        initializeEverything();

        $scope.submitRequest = function() {
            $state.go('^.submission', {gifts: $scope.items, person: $scope.person});
        };
    }]);

    HolidayApp.controller('submissionCtrl', ['$scope', '$state', '$timeout', function($scope, $state, $timeout) {

        /* You only need to attach a variable or method to $scope if you want the HTML to access it. */
        $scope.giftsize = '';
        $scope.person = {};
        $scope.submissions = [];
        var items = [];
        var sizes = [
            '',      /* default */
            'fa-lg',
            'fa-2x',
            'fa-3x',
            'fa-4x',
            'fa-5x',
        ];
        var tasks = [];

        var generateResponse = function() {
            // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
            var getRandomIntInclusive = function(min, max) {
                min = Math.ceil(min);
                max = Math.floor(max);
                return Math.floor(Math.random() * (max - min + 1)) + min;
            }

            var value = getRandomIntInclusive(0, 1);
            var response = 'rejected';

            if ($scope.person.behavior === 'good') {
                /* if their behavior was claimed to be good, weigh things more likely to be accepted. */
                if (value <= 0.75) {
                    response = 'accepted';
                }
            } else {
                if (value > 0.75) {
                    /* weight is to only 25% of responses in an even random distribution will return accepted. */
                    response = 'accepted';
                }
            }

            return response;
        };

        $scope.getResponse = function(item) {
            if (item.status !== 'done') {
                return 'pending';
            }

            return item.response;
        };

        function initializeEverything() {
            if ($state.params.gifts.length === 0) {
                $state.go('start');
            }

            angular.copy($state.params.gifts, items);
            angular.copy($state.params.person, $scope.person);

            for (var i = 0; i < items.length; i++) {
                $scope.submissions.push({status: 'pending', item: items[i].text, hide: false});
            }

            /* handle the items first to last */
            var uploadItem = function(index) {
                if (index === $scope.submissions.length) {
                    var total = $scope.submissions.length;
                    var accepted = 0;

                    for (var i = 0; i < $scope.submissions.length; i++) {
                        if ($scope.submissions[i].response === 'accepted') {
                            accepted += 1;

                            var size = Math.floor((accepted / total) * (sizes.length - 1));
                            $scope.giftsize = sizes[size];
                        } else {
                            //console.log('splicing out: ' + $scope.submissions[i].item);
                            //$scope.submissions.splice(i, 1);
                            $scope.submissions[i].hide = true;
                        }
                    }

                    return;
                }

                $scope.submissions[index].status = 'uploading';

                $timeout(function() {
                    $scope.submissions[index].response = generateResponse();
                    $scope.submissions[index].status = 'done';
                    uploadItem(index + 1);
                }, 1500);
            };

            uploadItem(0);
        }

        initializeEverything();
    }]);

})();
