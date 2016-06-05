var app = angular.module("DataResourceDashboard", ["appModule", "ngRoute"]);

app.factory("appService", ["$http", function($http) {
    var obj = {};

    obj.getDatabases = function(callback) {
        $http.get("/_meta").then(function(response) {
            callback(response.data);
        });
    };

    obj.getContent = function(database, collection, options, callback) {
        $http.get("/_data/" + database + "/" + collection + options, { headers: { "content-type": "application/json" } }).then(
            function(response) {
                callback(response);
            }, function(error) {
                callback(error, true);
            });
    };

    obj.getCount = function(database, collection, query, callback) {
        query = query ? "?query=" + encodeURIComponent(query) : "";
        $http.get("/_meta/" + database + "/" + collection + "/count" + query, { headers: { "content-type": "application/json" } }).then(
            function(response) {
                callback(response.data);
            });
    };

    obj.getDatabaseStats = function(database, callback) {
        $http.get("/_meta/" + database, { headers: { "content-type": "application/json" } }).then(
            function(response) {
                callback(response.data);
            });
    };

    obj.getCollectionStats = function(database, collection, callback) {
        $http.get("/_meta/" + database + "/" + collection, { headers: { "content-type": "application/json" } }).then(
            function(response) {
                callback(response.data);
            });
    };

    return obj;
}]);

app.config(function($routeProvider, $locationProvider, $provide, $httpProvider) {
    $routeProvider.when("/data/:database", {
        controller: "appController"
    });

    $routeProvider.when("/data/:database/:collection", {
        controller: "appController"
    });

    $routeProvider.when("/data/:database/:collection/page/:pageNum", {
        controller: "appController"
    });

    $routeProvider.when("/data/:database/:collection/:command", {
        controller: "appController"
    });

    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
    $locationProvider.html5Mode(true);

    $provide.factory("LoggingHttpInterceptor", function($q, $rootScope) {
        $rootScope.requestsLog = [];
        return {
            request: function(config) {
                var r = {};
                r.headers = config.headers;
                r.url = config.url;
                r.method = config.method;

                $rootScope.requestsLog.push(r);
                console.log(config);
                return config || $q.when(config);
            },
            requestError: function(rejection) {
                return $q.reject(rejection);
            },
            response: function(response) {
                return response || $q.when(response);
            },
            responseError: function(rejection) {
                return $q.reject(rejection);
            }
        };
    });
    $httpProvider.interceptors.push("LoggingHttpInterceptor");
});

app.run(["$rootScope", "$location", "$window", "$route", "$filter", function($rootScope, $location, $window, $route, $filter) {
    $rootScope.goto = function(path) {
        $location.path(path);
    };
}]);