var appModule = angular.module("appModule", []);

function toNumberOrZero(n) {
    var c = 0;
    try {
        n = (" " + n).replace(" ", "").replace(",", ".");
        c = parseFloat(n);
        if (isNaN(c)) {
            c = 0;
        }
    } catch (e) {
        c = 0;
    }
    return c;
}

function toNumberOrException(n) {
    var c = 0;
    n = (" " + n).replace(" ", "").replace(",", ".");
    c = parseFloat(n);
    if (isNaN(c)) {
        throw new Error("Неправильный формат данных: " + n);
    }
    return c;
}

function hex2a(hex) {
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

appModule.controller("appController", ["$scope", "$location", "$anchorScroll", "$timeout", "$interval", "$route", "appService", "utmService", function ($scope, $location, $anchorScroll, $timeout, $interval, $route, appService, utmService) {
    $scope.subject = {};
    $scope.wayBillList = [];
    $scope.wayBillArchiveList = [];
    utmService.getSubject(function (data) {
        $scope.subject = data;
    });

    var checkDocs = function () {
        utmService.checkOutWayBill(function (data) {
            var load = $scope.wayBillList.length <= 0;
            $scope.wayBillList = []
            $scope.wayBillArchiveList = []
            for (var i in data) {
                if (data[i].status!="confirmed"){
                    $scope.wayBillList.push(data[i]);
                } else {
                    $scope.wayBillArchiveList.push(data[i]);
                }
            }
            // $scope.wayBillList = data;
            if (load) {
                $route.reload();
            }
            $timeout(checkDocs, 5000);
        });
    };
    checkDocs();

    $scope.go = function (path) {
        $location.path(path);
    };

}]);

appModule.controller("subjectController", ["$scope", "$location", "$route", "appService", "utmService", function ($scope, $location, $route, appService, utmService) {
}]);

appModule.controller("restsController", ["$scope", "$location", "$route", "$timeout", "appService", "utmService", function ($scope, $location, $route, $timeout, appService, utmService) {
    $scope.rests = {};
    utmService.checkOutRests(function (data) {
        //todo отсортировать массив по дате и выбрать послдений элемент
        $scope.rests = data[data.length - 1];
    });
}]);

appModule.controller("wayBillListController", ["$scope", "$location", "appService", "utmService", function ($scope, $location, appService, utmService) {
    $scope.archiveVisible = false;
}]);

appModule.controller("wayBillDetailController", ["$scope", "$location", "appService", "utmService", "$routeParams", function ($scope, $location, appService, utmService, $routeParams) {
    var list = utmService.wayBillList;
    $scope.selected = null;
    for (var i in list) {
        if (list[i].wayBillNumber === $routeParams.waybillnum && list[i].fsrarid === $routeParams.fsrarid && list[i].date === $routeParams.date) {
            $scope.selected = list[i];
            break;
        }
    }    
}]);
