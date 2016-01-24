var appModule = angular.module("appModule", []);

// "$scope", "$location", "$anchorScroll", "$timeout", "$interval", "$route", "appService", "utmService", 
appModule.controller("appController", function ($scope, $location, $anchorScroll, $timeout, $interval, $route, appService) {
    $scope.databases = [];
    $scope.databaseSelected = null;
    $scope.collections = [];
    $scope.collectionSelected = null;
    $scope.collectionContent = null;

    appService.getDatabases(function (data) {
        $scope.databases = data.databases;
    });

    $scope.$on("$locationChangeSuccess", function (event, next, current) {

        var url = $location.search().url;
        if (url) {
            $location.search('url', null);
            $location.path(url);
        }

        if (!$route.current) {
            $scope.databaseSelected = null;
            return;
        }
        $scope.databaseSelected = $route.current.params.database;
        if ($route.current.params.collection) {
            $scope.collectionSelected = null;
            $scope.collectionContent = null;
            appService.getCollections($scope.databaseSelected, function (data) {
                $scope.collections = data;
                $scope.collectionSelected = $route.current.params.collection;
                appService.getContent($scope.databaseSelected, $scope.collectionSelected, function (data) {
                    $scope.collectionContent = processContent(data);
                    console.log($scope.collectionContent);
                })
            });
        } else {
            $scope.collectionSelected = null;
            appService.getCollections($scope.databaseSelected, function (data) {
                $scope.collections = data;
            });
        }
    });

    //Object.keys(a).length
});

function processContent(data) {
    var tmpFields = {};
    console.log("processContent");
    console.log(data);
    for (var i in data) {
        var keys = Object.keys(data[i]);
        console.log(keys);        
        for (var j in keys) {
            tmpFields[keys[j]] = 1;
        }
        console.log(tmpFields);
    }
    
    var fields = [];
    var fkeys = Object.keys(tmpFields);
    for (var i in fkeys) {
        fields.push(fkeys[i]);
    }
    
    return { fields: fields, content: data };
}