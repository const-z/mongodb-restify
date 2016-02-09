var appModule = angular.module("appModule", []);

// "$scope", "$location", "$anchorScroll", "$timeout", "$interval", "$route", "appService", "utmService", 
appModule.controller("appController", function ($scope, $location, $anchorScroll, $timeout, $interval, $route, appService) {
    var pageSize = 20;
    $scope.databases = [];
    $scope.databaseSelected = null;
    $scope.collections = [];
    $scope.collectionSelected = null;
    $scope.collectionContent = null;
    $scope.contentPages = 0;
    

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
                selectCollection($scope.databaseSelected, $route.current.params.collection);
            });
        } else {
            $scope.collectionSelected = null;
            appService.getCollections($scope.databaseSelected, function (data) {
                $scope.collections = data;
            });
        }
    });

    function selectCollection(database, collection) {
        appService.getCount(database, collection, function (data) {
            $scope.collectionPages = data.count / pageSize;
            $scope.collectionSelected = collection;
            appService.getContent($scope.databaseSelected, $scope.collectionSelected, "?limit=20&skip=0", function (data) {                
                $scope.collectionContent = processContent(data);                                
            });
        });
    }
});

function processContent(data) {
    var tmpFields = {};
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