var appModule = angular.module("appModule", []);

appModule.controller("appController", function ($scope, $location, $anchorScroll, $timeout, $interval, $route, appService) {

    $scope.databases = [];
    $scope.databaseSelected = null;

    $scope.collections = [];
    $scope.collectionSelected = null;
    $scope.collectionContent = null;

    $scope.pageSize = 20;
    $scope.contentPages = 1;
    $scope.contentPageNum = 1;
    $scope.contentCount = 0;

    appService.getDatabases(function (data) {
        $scope.databases = data.databases;
    });

    $scope.$on("$locationChangeSuccess", function (event, next, current) {

        var url = $location.search().url;
        if (url) {
            $location.search('url', null);
            $location.path(url);
        }
        $scope.contentPages = 0;
        $scope.contentPageNum = 1;
        $scope.contentCount = 0;
        if (!!$route.current && $route.current.params.database) {
            $scope.databaseSelected = $route.current.params.database;
        } else {
            $scope.databaseSelected = null;
            return;
        }        
        if ($route.current.params.collection) {
            selectCollection($scope.databaseSelected, $route.current.params.collection);
        } else {
            $scope.collectionSelected = null;
        }
    });

    $scope.gotoPage = function (page) {
        if (page < 1) {
            page = 1;
        } else if (page > $scope.contentPages) {
            page = $scope.contentPages;
        }
        $location.path("/data/" + $scope.databaseSelected + "/" + $scope.collectionSelected + "/page/" + page);
    };

    function selectCollection(database, collection) {
        appService.getCount(database, collection, function (data) {
            $scope.contentPages = Math.ceil(data.count / $scope.pageSize);
            $scope.contentCount = data.count;
            $scope.collectionSelected = collection;

            $scope.contentPageNum = !!$route.current.params.pageNum ? +$route.current.params.pageNum : 1;
            if ($scope.contentPageNum < 1) {
                $scope.gotoPage(1);
                return;
            } else if ($scope.contentPageNum > $scope.contentPages) {
                $scope.gotoPage($scope.contentPages);
                return;
            }

            appService.getContent($scope.databaseSelected, $scope.collectionSelected,
                "?limit=" + $scope.pageSize + "&skip=" + (($scope.contentPageNum - 1) * $scope.pageSize),
                function (data) {
                    $scope.collectionContent = processContent(data);
                });
        });
    }

    $scope.refreshContent = function () {
        selectCollection($scope.databaseSelected, $scope.collectionSelected);
    };

    $scope.dbTree = [];
    getTreeDB(appService, function (data) {
        $scope.dbTree = data;
    });
});

function getTreeDB(appService, callback) {
    var result = [];
    appService.getDatabases(function (data) {
        var dbs = data.databases;
        var count = dbs.length;
        for (var i in dbs) {
            getTreeCollections(appService, dbs[i].name, function (childrens, dbName) {
                result.push({ name: dbName, childrens: childrens });
                if (--count == 0) {
                    callback(result);
                }
            });
        }
    });
}

function getTreeCollections(appService, dbName, callback) {
    appService.getCollections(dbName, function (data) {
        callback(data, dbName);
    });
}

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