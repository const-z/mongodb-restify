var appModule = angular.module("appModule", []);

appModule.controller("AppController", function($scope, $location, $route, $timeout, $log, appService) {

    $scope.databases = [];
    $scope.databaseSelected = {};

    $scope.collections = [];
    $scope.collectionSelected = {};

    $scope.pageSize = 20;

    $scope.query = { order: "_id", limit: 10, page: 1 };

    appService.getDatabases(function(data) {
        $scope.databases = data.databases;
    });

    $scope.$on("$locationChangeSuccess", function(event, next, current) {
        var url = $location.search().url;
        if (url) {
            $location.search("url", null);
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

    $scope.gotoPage = function(page) {
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

        $scope.databaseSelected.name = database;
        appService.getDatabaseStats($scope.databaseSelected.name, function(data) {
            $scope.databaseSelected.stats = data.stats;
            $scope.databaseSelected.collections = data.collections;
            for (var i in data.collections) {
                loadCollectionStats(appService, $scope.databaseSelected, i, function(index, stats) {
                    $scope.databaseSelected.collections[index].stats = stats;
                });
            }
        });
    }

    function selectCollection(database, collection) {
        if (!database) {
            $scope.collectionSelected = {};
            return;
        }
        appService.getCollectionStats(database, collection, function(stats) {

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
                function(data) {
                    $scope.collectionSelected.content = processContent(data.data);
                });
        });
    }

    $scope.refreshContent = function() {
        selectCollection($scope.databaseSelected.name, $scope.collectionSelected.name);
    };
});

function loadCollectionStats(appService, database, collectionIndex, callback) {
    appService.getCollectionStats(database.name, database.collections[collectionIndex].name, function(stats) {
        callback(collectionIndex, stats);
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