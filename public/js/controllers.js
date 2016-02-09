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
    $scope.contentPageNum = 1;
    $scope.contentCount = 0;
    $scope.contentPagesRange = { from: 0, to: 0 };

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
            $scope.contentPageNum = !!$route.current.params.pageNum ? $route.current.params.pageNum : 1;            
            console.log($scope.contentPageNum);
            $scope.contentPages = data.count / pageSize;
            $scope.contentCount = data.count;
            $scope.collectionSelected = collection;
            appService.getContent($scope.databaseSelected, $scope.collectionSelected, "?limit=" + pageSize + "&skip=" + ($scope.contentPageNum * pageSize), function (data) {
                $scope.collectionContent = processContent(data);
            });
        });
    }
});

// function setRange(count, pageSize, pageNum) {
//     var pages = Math.ceil(count/pageSize);
//     var pageBlocks = pages / 5;
//     for (var i=0; i<pageBlocks; i++) {
//         if (i*5<) {
            
//         }                
//     }
     
//     // var to = 0;
//     // if (pages<=pageNum) {
//     //     to = pages;
//     // } else if (pageNum) {
        
//     // }
//     // var from = to - 5;
//     // return {from: from, to: to};
// }

function processContent(data) {
    var tmpFields = {};
    for (var i in data) {
        var keys = Object.keys(data[i]);
        for (var j in keys) {
            tmpFields[keys[j]] = 1;
        }
    }
    var fields = [];
    var fkeys = Object.keys(tmpFields);
    for (var i in fkeys) {
        fields.push(fkeys[i]);
    }
    return { fields: fields, content: data };
}