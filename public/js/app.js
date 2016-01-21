var app = angular.module("utmClientApp", ["appModule", "ngRoute", "ui.bootstrap"]);

app.factory("appService", ["$http", function ($http) {
    var obj = {};
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
}]);


app.run(["$rootScope", "$location", "$window", "$route", "$filter", function ($rootScope, $location, $window, $route, $filter) {
    $rootScope.breadCrumbs = [];
    $rootScope.$on("$locationChangeSuccess", function (event, next, current) {
        if ($route.current && angular.isFunction($route.current.$$route.resolve)) {
            $rootScope.breadCrumbs = $route.current.$$route.resolve($route, $filter);            
        } else {
            $rootScope.breadCrumbs = [];
        }
    });
}]);