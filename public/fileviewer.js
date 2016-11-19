'use strict';

var _app = angular.module('fileviewerApp', ['ngMaterial', 'angular-loading-bar']);

_app.config(['$mdThemingProvider', 'cfpLoadingBarProvider', function (themingProvider, loadingBar) {
    themingProvider.theme('default')
        .primaryPalette('light-blue')
        .accentPalette('orange')
        .dark();

    loadingBar.includeSpinner = false;
}]);

_app.service('$httpService', ['$http', '$mdToast', function ($http, $mdToast) {
    var self = this;

    var showErrorToast = function (msg) {
        $mdToast.show({
            hideDelay: 5000,
            position: 'top right',
            controller: function ($scope) { $scope.msg = msg },
            template:
            '<md-toast class="notification">' +
            '  <span class="md-toast-text" flex>' +
            '    <span class="error buffer-right fa fa-times fa16"></span>{{msg}}' +
            '  </span>' +
            '</md-toast>'
        });
    };

    self.getListing = function (path, callback) {
        $http.get('/listing', { params: { requestPath: path }}).then(function success(response) {
            callback(response.data);
        }, function error() {
            showErrorToast('Could not retrieve file listing');
        });
    };

    self.downloadFiles = function (files, callback) {
        $http.post('/download', { files: files }).then(function success(response) {
            callback(response.data.link);
        }, function error() {
            showErrorToast('Could not download files');
        });
    };

    self.deleteFiles = function (files, current, callback) {
        $http.post('/delete', { files: files, current: current }).then(function success(response) {
            callback(response.data);
        }, function error(response) {
            if (response.status == 403) {
                showErrorToast('Deletions are not enabled on the server');
            } else {
                showErrorToast('Could not delete files');
            }
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
        $scope.currSort = ['lex', 'descend'];

        var scrollList = document.getElementById('scroll-list');
        if (Ps) {
            //Ps.initialize(scrollList, { wheelSpeed: 2, suppressScrollX: true });
        }

        // TODO: fix chrome's fucked up sorting nonsense
        var sorting = new (function () {
            var self = this;
            self.lex = new (function () {
                var _sort = function (a, b, descend) {
                    // prioritize directories, then sort on name
                    if (a.directory ^ b.directory) {
                        return a.directory ? -1 : 1;
                    } else {
                        return descend ? a.name.toLowerCase() > b.name.toLowerCase() : a.name.toLowerCase() < b.name.toLowerCase();
                    }
                };

                this.descend = function (a, b) { return _sort(a, b, true) };
                this.ascend = function (a, b) { return _sort(a, b, false) };
                return this;
            })();

            self.size = new (function () {
                var _sort = function (a, b, descend) {
                    // prioritize directories, then sort on size
                    if (a.directory ^ b.directory) {
                        return a.directory ? -1 : 1;
                    } else {
                        return descend ? a.size > b.size : a.size < b.size;
                    }
                };

                this.descend = function (a, b) { return _sort(a, b, true) };
                this.ascend = function (a, b) { return _sort(a, b, false) };
                return this;
            })();

            self.mod = new (function () {
                var _sort = function (a, b, descend) {
                    // prioritize directories, then sort on modified
                    if (a.directory ^ b.directory) {
                        return a.directory ? -1 : 1;
                    } else {
                        return descend ? a.modified > b.modified : a.modified < b.modified;
                    }
                };

                this.descend = function (a, b) { return _sort(a, b, true) };
                this.ascend = function (a, b) { return _sort(a, b, false) };
                return this;
            })();

            self.get = function (sort) {
                if (!sort || sort.constructor !== String) {
                    return self.lex.descend;
                }
                var s = sort.split('.');
                if (s.length != 2) {
                    return self.lex.descend;
                }
                var first = this[s[0]];
                if (!first) {
                    return self.lex.descend;
                }
                var second = first[s[1]];
                if (!second) {
                    return self.lex.descend;
                }
                return second;
            };

            return self;
        })();

        var currentSort = sorting.get('lex.descend');

        var listingCb = function (data) {
            data.listing.sort(currentSort);
            $scope.listing = data.listing;
            if (data.current !== '') {
                $scope.currentPath = data.current.split('/');
            } else {
                $scope.currentPath = [];
            }
            $scope.selectedItems = [];
            //$timeout(function () { Ps.update(scrollList) }, 0);
        };

        var fileObjectMapper = function (file) {
            var path = $scope.currentPath.join('/') + '/' + file.name;
            return {
                path: path,
                directory: file.directory
            };
        };

        var filePathMapper = function (file) {
            return $scope.currentPath.join('/') + '/' + file.name;
        };

        var showDownloadToast = function (link) {
            $mdToast.show({
                hideDelay: false,
                position: 'top right',
                controller: function ($scope) {
                    $scope.link = link;
                    $scope.close = $mdToast.hide;
                },
                template:
                    '<md-toast class="notification">' +
                    '  <span class="md-toast-text" flex>Download ready:</span>' +
                    '  <a class="md-primary md-button" href="{{link}}" target="_blank" ng-click="close()">Download</a>' +
                    '  <a class="md-button md-warn" href="" ng-click="close()">Cancel</a>' +
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
            http.downloadFiles(files, showDownloadToast);
        };

        $scope.deleteClicked = function () {
            var files = $scope.selectedItems.map(filePathMapper);
            var current = $scope.currentPath.join('/');
            http.deleteFiles(files, current, listingCb);
        };

        $scope.changeSort = function (stype) {
            if ($scope.currSort[0] == stype) {
                $scope.currSort = $scope.currSort[1] == 'descend' ? [stype, 'ascend'] : [stype, 'descend'];
            } else {
                $scope.currSort = [stype, 'descend'];
            }
            currentSort = sorting.get($scope.currSort.join('.'));
            $scope.listing.sort(currentSort);
        };

        http.getListing('/', listingCb);

    }
]);

_app.filter('humanSize', function () {
    return function (b, d) {
        if (d) return (!b || b <= 0) ? '0 items' : (b == 1 ? b + ' item' : b + ' items');
        if (!b || b <= 0) return '0 B';
        var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        var i = Math.floor(Math.log(b) / Math.log(1024));
        return parseFloat((b / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
    }
});
