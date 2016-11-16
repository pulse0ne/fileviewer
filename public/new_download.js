'use strict';

var _app = angular.module('fileviewerApp', ['ngMaterial', 'angular-loading-bar']);

_app.config(['$mdThemingProvider', 'cfpLoadingBarProvider', function (themingProvider, loadingBar) {
    themingProvider.theme('default')
        .primaryPalette('light-blue')
        .accentPalette('orange')
        .dark();

    loadingBar.includeSpinner = false;
}]);

_app.service('$httpService', ['$http', function ($http) {
    var self = this;
    self.processingRequest = false;

    var filesort = function (a, b) {
        // when we have the same type, sort on name
        if ((a.directory && b.directory) || (!a.directory && !b.directory)) {
            return a.name.toLowerCase() > b.name.toLowerCase();
        } else {
            return a.directory ? -1 : 1;
        }
    };

    self.getListing = function (path, callback) {
        self.processingRequest = true;
        $http.get('/listing', { params: { requestPath: path }}).then(function success(response) {
            self.processingRequest = false;
            response.data.listing.sort(filesort);
            callback(response.data);
        }, function error() {
            console.error('Could not retrieve file listing at ', path);
            // TODO: $mdToast or something
            self.processingRequest = false;
        });
    };
}]);

_app.controller('fileviewerController', ['$scope', '$httpService', function ($scope, http) {
    $scope.currentPath = [];
    $scope.listing = [];
    $scope.selectedItems = [];

    $scope.listClicked = function (event, item) {
        event.stopPropagation();
        if (item.directory) {
            var path = $scope.currentPath.join('/') + '/' + item.name;
            http.getListing(path, function (data) {
                $scope.listing = data.listing;
                if (data.current !== '') {
                    $scope.currentPath = data.current.split('/');
                } else {
                    $scope.currentPath = [];
                }
            });
        }
    };

    $scope.selectAll = function () {
        if ($scope.allSelected()) {
            $scope.selectedItems = [];
        } else {
            $scope.listing.forEach(function (entry) {
                if ($scope.selectedItems.indexOf(entry) == -1) {
                    $scope.selectedItems.push(entry);
                }
            });
        }
    };

    $scope.allSelected = function () {
        return $scope.listing.length != 0 && $scope.selectedItems.length == $scope.listing.length;
    };

    $scope.isSelected = function (item) {
        return $scope.selectedItems.indexOf(item) > -1;
    };

    $scope.toggle = function (item) {
        var ix = $scope.selectedItems.indexOf(item);
        if (ix > -1) {
            $scope.selectedItems.splice(ix, 1);
        } else {
            $scope.selectedItems.push(item);
        }
    };

    $scope.crumbClicked = function (loc) {
        var c = $scope.currentPath.slice(0);
        c.splice(c.lastIndexOf(loc) + 1);
        var requestPath = c.join('/'); // relative to root
        http.getListing(requestPath, function (data) {
            $scope.listing = data.listing;
            if (data.current !== '') {
                $scope.currentPath = data.current.split('/');
            } else {
                $scope.currentPath = [];
            }
        });
    };

    http.getListing('/', function (data) {
        $scope.listing = data.listing;
        if (data.current !== '') {
            $scope.currentPath = data.current.split('/');
        } else {
            $scope.currentPath = [];
        }
    });

}]);

_app.filter('humanSize', function () {
    return function (b) {
        if (!b || b <= 0) return '0 Bytes';
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        var i = Math.floor(Math.log(b) / Math.log(1024));
        return parseFloat((b / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
    }
});
