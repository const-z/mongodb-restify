var app = angular.module("DataResourceDashboard", ["appModule", "ngRoute", "ngMaterial"]);

app.factory("appService", ["$http", function ($http) {
    var obj = {};

    obj.getDatabases = function (callback) {
        $http.get("/_meta/databases").then(function (response) {
            callback(response.data);
        });
    };

    obj.getCollections = function (database, callback) {
        $http.get("/_meta/" + database + "/collections").then(function (response) {
            callback(response.data);
        });
    };

    obj.getContent = function (database, collection, options, callback) {
        $http({
            url: "/_data/" + database + "/" + collection + options,
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            data: ""
        }).success(function (response) {
            callback(response);
        }).error(function (error) {
            callback(error, true);
        });
    };

    obj.getCount = function (database, collection, callback) {
        $http.get("/_meta/" + database + "/" + collection + "/count", { headers: { "content-type": "application/json" } }).then(
            function (response) {
                callback(response.data);
            });
    };

    obj.getDatabaseStats = function (database, callback) {
        $http.get("/_meta/" + database + "/stats", { headers: { "content-type": "application/json" } }).then(
            function (response) {
                callback(response.data);
            });
    };

    obj.getCollectionStats = function (database, collection, callback) {
        $http.get("/_meta/" + database + "/" + collection + "/stats", { headers: { "content-type": "application/json" } }).then(
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

    ///

    // $provide.factory('LoggingHttpInterceptor', function ($q, $rootScope) {
    //     $rootScope.requestsLog = [];
    //     return {
    //         request: function (config) {
    //             $rootScope.requestsLog.push(config);
    //             return config || $q.when(config);
    //         },
    //         requestError: function (rejection) {
    //             return $q.reject(rejection);
    //         },
    //         response: function (response) {
    //             return response || $q.when(response);
    //         },
    //         responseError: function (rejection) {
    //             return $q.reject(rejection);
    //         }
    //     };
    // });
    // $httpProvider.interceptors.push('LoggingHttpInterceptor');
});

app.run(["$rootScope", "$location", "$window", "$route", "$filter", function ($rootScope, $location, $window, $route, $filter) {

}]);