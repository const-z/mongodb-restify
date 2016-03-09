var app = angular.module("DataResourceDashboard", ["appModule", "ngRoute"]);

app.factory("appService", ["$http", function ($http) {
    var obj = {};

    obj.getDatabases = function (callback) {
        $http.get("/_meta").then(function (response) {
            callback(response.data);
        });
    };

    obj.getContent = function (database, collection, options, callback) {
        $http.get("/_data/" + database + "/" + collection + options, { headers: { "content-type": "application/json" } }).then(
            function (response) {
                callback(response);
            }, function (error) {
                callback(error, true);
            });
    };

    obj.getCount = function (database, collection, query, callback) {
        query = query ? "?query=" + encodeURIComponent(query) : "";
        $http.get("/_meta/" + database + "/" + collection + "/count" + query, { headers: { "content-type": "application/json" } }).then(
            function (response) {
                callback(response.data);
            });
    };

    obj.getDatabaseStats = function (database, callback) {
        $http.get("/_meta/" + database, { headers: { "content-type": "application/json" } }).then(
            function (response) {
                callback(response.data);
            });
    };

    obj.getCollectionStats = function (database, collection, callback) {
        $http.get("/_meta/" + database + "/" + collection, { headers: { "content-type": "application/json" } }).then(
            function (response) {
                callback(response.data);
            });
    };

    return obj;
}]);

app.config(function ($routeProvider, $locationProvider, $provide, $httpProvider) {
    $routeProvider.when('/data/:database', {
        controller: 'appController'
    });

    $routeProvider.when('/data/:database/:collection', {
        controller: 'appController'
    });

    $routeProvider.when('/data/:database/:collection/page/:pageNum', {
        controller: 'appController'
    });

    $routeProvider.when('/data/:database/:collection/:command', {
        controller: 'appController'
    });

    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
    $locationProvider.html5Mode(true);
    
    // , {
    //   'default': '400', // by default use shade 400 from the pink palette for primary intentions
    //   'hue-1': '100', // use shade 100 for the <code>md-hue-1</code> class
    //   'hue-2': '600', // use shade 600 for the <code>md-hue-2</code> class
    //   'hue-3': 'A100' // use shade A100 for the <code>md-hue-3</code> class
    // })
    // // If you specify less than all of the keys, it will inherit from the
    // // default shades
    // .accentPalette('purple', {
    //   'default': '200' // use shade 200 for default, and keep all other shades the same
    // })
    // .dark();
});

app.run(["$rootScope", "$location", "$window", "$route", "$filter", function ($rootScope, $location, $window, $route, $filter) {
    $rootScope.goto = function(path) {
        $location.path(path);
    }
}]);