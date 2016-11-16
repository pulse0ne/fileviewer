/**
 * Created by tsned on 11/14/16.
 */
'use strict';

Object.defineProperty(Array.prototype, 'contains', {
    enumerable: false,
    writable: true,
    value: function (item) {
        return this.indexOf(item) != -1;
    }
});

var _app = angular.module('DownloadApp', ['ngMaterial']);
_app.controller('DownloadController', [
    '$scope',
    '$http',
    '$window',
    '$mdToast',
    '$mdDialog',
    '$timeout',
    function ($scope, $http, $window, $mdToast, $mdDialog, $timeout) {
        $scope.dirs = [];
        $scope.files = [];

        // extensions
        var _archiveExts = ['zip', 'gz', 'tar', 'jar'];
        var _audioExts = ['mp3', 'flac', 'ogg'];
        var _codeExts = ['js', 'htm', 'html', 'py', 'sh', 'c', 'h', 'cpp', 'java', 'css', 'xml', 'json'];
        var _excelExts = ['xls', 'xlsx'];
        var _imageExts = ['png', 'jpg', 'jpeg', 'tiff', 'gif'];
        var _pdfExts = ['pdf'];
        var _powerpointExts = ['ppt', 'pptx'];
        var _textExts = ['txt', 'csv', 'rtf'];
        var _videoExts = ['mp4', 'mov', 'mkv', 'avi'];
        var _wordExts = ['doc', 'docx'];

        var getFaClass = function (filename) {
            var ext = filename.split('.').pop();

            if (_archiveExts.contains(ext)) {
                return 'fa-file-archive-o maroon';
            } else if(_audioExts.contains(ext)) {
                return 'fa-file-audio-o navy';
            } else if(_codeExts.contains(ext)) {
                return 'fa-file-code-o green';
            } else if(_excelExts.contains(ext)) {
                return 'fa-file-excel-o purple';
            } else if (_imageExts.contains(ext)) {
                return 'fa-file-image-o yellow';
            } else if (_pdfExts.contains(ext)) {
                return 'fa-file-pdf-o red';
            } else if (_powerpointExts.contains(ext)) {
                return 'fa-file-powerpoint-o orange';
            } else if (_textExts.contains(ext)) {
                return 'fa-file-text-o olive';
            } else if (_videoExts.contains(ext)) {
                return 'fa-file-video-o fuschia';
            } else if (_wordExts.contains(ext)) {
                return 'fa-file-word-o blue';
            } else {
                return 'fa-file-o';
            }
        };

        $scope.itemclicked = function (item) {
            // var confirm = $mdDialog.confirm()
            //     .title('Download file?')
            //     .textContent('Would you like to download this file?')
            //     .ariaLabel('Download')
            //     .ok('Okay')
            //     .cancel('Cancel');
            //
            // $mdDialog.show({
            //     template: '<md-progress-circular md-mode="indeterminate" md-diameter="64"></md-progress-circular>',
            //     onComplete: function () {}
            // });
            //
            // // TODO: wrap
            // $mdDialog.show(confirm).then(function() {
            //
            // });

            $http.post('/download', { file: item.filename }).then(function success(response) {
                if (response.data.fileLocation) {
                    $window.open(response.data.fileLocation, 'Download', '_blank');
                }
            }, function error() {
                $mdToast.show($mdToast.simple().textContent('Could not download file.').position('top right'));
            });
        };

        $http.get('/filelist').then(function success(response) {
            if (response.data.files && response.data.files.constructor === Array) {
                response.data.files.forEach(function (file) {
                    var entry = {
                        filename: file.filename,
                        bytes: file.bytes
                    };

                    if (file.directory) {
                        entry.faclass = 'fa-folder-o';
                        $scope.dirs.push(entry);
                    } else {
                        entry.faclass = getFaClass(file.filename);
                        $scope.files.push(entry);
                    }
                });
            }
        }, function error() {
            $mdToast.show($mdToast.simple().textContent('Could not get file listing.').position('top right'));
            $timeout(function() { $window.location.reload(); }, 10000);
        });
    }
]);

_app.filter('humanSize', function () {
    return function (b) {
        if (!b || b <= 0) return '0 Bytes';
        var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        var i = Math.floor(Math.log(b) / Math.log(1024));
        return parseFloat((b / Math.pow(1024, i)).toFixed(1)) + ' ' + sizes[i];
    }
});