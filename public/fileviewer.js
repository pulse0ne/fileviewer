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
            response.data.listing.sort(filesort);
            callback(response.data);
        }, function error() {
            console.error('Could not retrieve file listing at ', path);
            // TODO: $mdToast or something
        });
    };

    self.downloadFiles = function (files, callback) {
        self.processingRequest = true;
        $http.post('/download', { files: files }).then(function success(response) {
            callback(response.data.link);
        }, function error() {
            console.error('Could not download files');
            // TODO: $mdToast or something
        });
    };
}]);

_app.controller('fileviewerController', [
    '$scope',
    '$timeout',
    '$mdToast',
    '$httpService',
    function ($scope, $timeout, $mdToast, http) {
        $scope.currentPath = [];
        $scope.listing = [];
        $scope.selectedItems = [];

        var scrollList = document.getElementById('scroll-list');
        if (Ps) {
            Ps.initialize(scrollList, { wheelSpeed: 2, suppressScrollX: true });
        }

        var listingCb = function (data) {
            $scope.listing = data.listing;
            if (data.current !== '') {
                $scope.currentPath = data.current.split('/');
            } else {
                $scope.currentPath = [];
            }
            $scope.selectedItems = [];
            $timeout(function () { Ps.update(scrollList); }, 0);
        };

        var fileObjectMapper = function (file) {
            var path = $scope.currentPath.join('/') + '/' + file.name;
            return {
                path: path,
                directory: file.directory
            };
        };

        var showDownloadToast = function (link) {
            $mdToast.show({
                hideDelay: false,
                position: 'top right',
                controller: function ($scope) {
                    $scope.link = link;
                    $scope.close = function () {
                        $mdToast.hide();
                    };
                },
                template:
                    '<md-toast>' +
                    '  <span class="md-toast-text" flex>Download ready:</span><br>' +
                    '  <a class="faux-button" href="{{link}}" target="_blank" ng-click="close()">Download</a>' +
                    '  <span class="faux-button fa fa-times-circle" ng-click="close()"></span>' +
                    '</md-toast>'
            });
        };

        $scope.listClicked = function (event, item) {
            event.stopPropagation();
            if (item.directory) {
                var path = $scope.currentPath.join('/');
                path = path.endsWith('/') ? path + item.name : path + '/' + item.name;
                http.getListing(path, listingCb);
            } else {
                $scope.toggle(item);
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
            http.getListing(requestPath, listingCb);
        };

        $scope.downloadClicked = function () {
            var files = $scope.selectedItems.map(fileObjectMapper);
            http.downloadFiles(files, function (link) {
                // TODO: generate link
                console.log(link);
                showDownloadToast(link);
            });
        };

        http.getListing('/', listingCb);

    }
]);

_app.filter('humanSize', function () {
    return function (b) {
        if (!b || b <= 0) return '0 B';
        var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        var i = Math.floor(Math.log(b) / Math.log(1024));
        return parseFloat((b / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
    }
});
