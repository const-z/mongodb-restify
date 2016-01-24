var app = angular.module("MongoDBRestify", ["appModule", "ngRoute", "ui.bootstrap"]);

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

    obj.getContent = function (database, collection, callback) {
        // $http.get("/_data/" + database + "/" + collection, { 'Content-Type': 'application/json' }).then(function (response) {
            
        // });
        $http({
            url: "/_data/" + database + "/" + collection,
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
            data: ""
        }).success(function (response) {
            callback(response);
        }).error(function (error) {
            callback(error);
        });
    };

    return obj;
}]);

app.config(["$routeProvider", "$locationProvider", function ($routeProvider, $locationProvider) {
    // $routeProvider.when('/WayBill', {
    //     templateUrl: 'way-bill-list.html',
    //     controller: 'wayBillListController',
    //     resolve: function () {
    //         return [{ name: "Товарные накладные", path: "/WayBill" }];
    //     }
    // }).when('/WayBill/:fsrarid/:date/:waybillnum', {
    //     templateUrl: 'way-bill-detail.html',
    //     controller: 'wayBillDetailController',
    //     resolve: function ($route, $filter) {
    //         return [
    //             { name: "Товарные накладные", path: "/WayBill" }, 
    //             { name: "Накладная №" + $route.current.params.waybillnum + " от " + $filter("date")($route.current.params.date, "dd.MM.yyyy"), path: "/WayBill/" + $route.current.params.fsrarid + '/' + $route.current.params.date + '/' + $route.current.params.waybillnum }];
    //     }
    // }).when('/rests', {
    //     templateUrl: 'rests.html',
    //     controller: 'restsController',
    //     resolve: function() {
    //         return [{ name: "Остатки", path: "/rests" }];
    //     }
    // }).when('/subject', {
    //     templateUrl: 'subject.html',
    //     controller: 'subjectController',
    //     resolve: function() {
    //         return [{ name: "Пользователь", path: "/subject" }];
    //     }
    // }).when('/', {
    //     templateUrl: 'subject.html',
    //     controller: 'subjectController',
    //     resolve: function() {
    //         return [{ name: "Пользователь", path: "/subject" }];
    //     }
    // });
    
    $routeProvider.when('/data/:database', {
        //templateUrl: 'way-bill-list.html',
        controller: 'appController'
        // resolve: function () {
        //     console.log("meta");
        //     //return [{ name: "Товарные накладные", path: "/WayBill" }];
        // }
    });

    $routeProvider.when('/data/:database/:collection', {
        controller: 'appController'
    });

    $routeProvider.when('/data/:database/:collection/:command', {
        controller: 'appController'
    });

    $locationProvider.html5Mode({
        enabled: true,
        requireBase: false
    });
    // $locationProvider.html5Mode(true);
}]);


app.run(["$rootScope", "$location", "$window", "$route", "$filter", function ($rootScope, $location, $window, $route, $filter) {
    // $rootScope.breadCrumbs = [];
    // $rootScope.$on("$locationChangeSuccess", function (event, next, current) {
    //     // $rootScope.path
    //     console.log("change");
    //     if ($route.current && angular.isFunction($route.current.$$route.resolve)) {
    //         $route.current.$$route.resolve($route, $filter);
    //         // $rootScope.breadCrumbs = $route.current.$$route.resolve($route, $filter);            
    //     } else {
    //         // $rootScope.breadCrumbs = [];
    //     }
    // });
}]);