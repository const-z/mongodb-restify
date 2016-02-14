var appModule = angular.module("appModule", []);

appModule.controller("appController", function ($scope, $location, $route, appService) {

    $scope.databases = [];
    $scope.databaseSelected = {};

    $scope.collections = [];
    $scope.collectionSelected = {};

    $scope.pageSize = 20;

    appService.getDatabases(function (data) {
        $scope.databases = data.databases;
    });

    $scope.$on("$locationChangeSuccess", function (event, next, current) {
        // console.log($scope.requestsLog);
        var url = $location.search().url;
        if (url) {
            $location.search('url', null);
            $location.path(url);
        }
        if (!!$route.current && $route.current.params.database) {
            selectDatabase($route.current.params.database);
        } else {
            selectDatabase(null);
            return;
        }
        if ($route.current.params.collection) {
            selectCollection($scope.databaseSelected.name, $route.current.params.collection);
        } else {
            selectCollection(null);
        }
    });

    $scope.gotoPage = function (page) {
        if (page < 1) {
            page = 1;
        } else if (page > $scope.collectionSelected.pages) {
            page = $scope.collectionSelected.pages;
        }
        $location.path("/data/" + $scope.databaseSelected.name + "/" + $scope.collectionSelected.name + "/page/" + page);
    };

    function selectDatabase(database) {
        if (!database) {
            $scope.databaseSelected = {};
            return;
        }
        $scope.databaseSelected.name = $route.current.params.database;
        appService.getDatabaseStats($scope.databaseSelected.name, function (stats) {
            $scope.databaseSelected.stats = stats;
        });
    }

    function selectCollection(database, collection) {
        if (!database) {
            $scope.collectionSelected = {};
            return;
        }
        appService.getCollectionStats(database, collection, function (stats) {
            $scope.collectionSelected.stats = stats;
            $scope.collectionSelected.pages = Math.ceil(stats.count / $scope.pageSize);
            $scope.collectionSelected.name = collection;

            $scope.collectionSelected.pageNum = !!$route.current.params.pageNum ? +$route.current.params.pageNum : 1;
            if ($scope.collectionSelected.pageNum < 1) {
                $scope.gotoPage(1);
                return;
            } else if ($scope.collectionSelected.pageNum > $scope.contentPages) {
                $scope.gotoPage($scope.collectionSelected.pages);
                return;
            }

            appService.getContent(database, collection,
                "?limit=" + $scope.pageSize + "&skip=" + (($scope.collectionSelected.pageNum - 1) * $scope.pageSize),
                function (data) {
                    $scope.collectionSelected.content = processContent(data);
                });
        });
    }

    $scope.refreshContent = function () {
        selectCollection($scope.databaseSelected.name, $scope.collectionSelected.name);
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
    return { fields: fields, rows: data };
}