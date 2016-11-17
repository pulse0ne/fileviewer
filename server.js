/**
 * Created by tsned on 11/14/16.
 */
'use strict';

var argparse = require('argparse');
var bparser = require('body-parser');
var express = require('express');
var fs = require('fs-extra');
var path = require('path');

var parser = argparse.ArgumentParser();
parser.addArgument(['-p', '--port'], {
    action: 'store',
    dest: 'port',
    defaultValue: 8080
});
parser.addArgument(['-r', '--root'], {
    required: true,
    action: 'store',
    dest: 'root'
});

var config = parser.parseArgs();
var app = express();

app.use(bparser.json());
app.use(bparser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));

Object.defineProperty(Array.prototype, 'contains', {
    enumerable: false,
    writable: true,
    value: function (item) {
        return this.indexOf(item) != -1;
    }
});

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

var getType = function (filename) {
    var ext = filename.split('.').pop();

    if (_archiveExts.contains(ext)) {
        return 'archive';
    } else if(_audioExts.contains(ext)) {
        return 'audio';
    } else if(_codeExts.contains(ext)) {
        return 'code';
    } else if(_excelExts.contains(ext)) {
        return 'excel';
    } else if (_imageExts.contains(ext)) {
        return 'image';
    } else if (_pdfExts.contains(ext)) {
        return 'pdf';
    } else if (_powerpointExts.contains(ext)) {
        return 'powerpoint';
    } else if (_textExts.contains(ext)) {
        return 'text';
    } else if (_videoExts.contains(ext)) {
        return 'video';
    } else if (_wordExts.contains(ext)) {
        return 'word';
    } else {
        return 'file';
    }
};

app.get('/listing', function (req, res) {
    var rpath = req.query.requestPath;
    if (rpath === undefined) {
        res.sendStatus(500);
        return;
    }
    if (rpath.charAt(0) == '/') {
        rpath = rpath.substring(1);
    }
    var dir = path.join(config.root, rpath);
    fs.readdir(dir, 'utf8', function (err, files) {
        if (err) {
            res.sendStatus(500);
        } else {
            var listing = [];
            files.forEach(function (f) {
                try {
                    var stats = fs.lstatSync(path.join(dir, f));
                    var entry = {
                        id: stats.ino,
                        name: f,
                        size: stats.size,
                        modified: stats.mtime.getTime(),
                        directory: stats.isDirectory(),
                        type: stats.isDirectory() ? 'folder' : getType(f)
                    };
                    listing.push(entry);
                } catch (e) {
                    console.error('Could not stat file:', e);
                }
            });
            res.status(200).send({ listing: listing, current: rpath });
        }
    });
});

app.listen(config.port);

//var archiver = require('archiver');
//var bparser = require('body-parser');
//var express = require('express');
//var fs = require('fs-extra');
//var path = require('path');
//
//var config = null;
//try {
//    config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf8'));
//    if (!config.downloadsLocation || !config.listenPort || !config.tmpPrefix) {
//        throw "Missing items in configuration";
//    }
//} catch (e) {
//    console.error('Problem with config file:', e);
//    process.exit(1);
//}
//
//try {
//    fs.accessSync('./tmp', fs.F_OK);
//} catch (e) {
//    try {
//        fs.mkdirSync('./tmp');
//    } catch (x) {
//        console.error('Could not create "tmp" directory:', x);
//        process.exit(1);
//    }
//}
//
//var app = express();
//
//app.use(bparser.json());
//app.use(bparser.urlencoded({ extended: true }));
//app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(config.downloadsLocation));
//app.use(express.static(path.join(__dirname, 'tmp')));
//
//var tmpRegistry = [];
//
//// check every 5 minutes for expired tmp files
//setTimeout(function () {
//    var now = Date.now();
//    tmpRegistry.forEach(function (entry, ix, obj) {
//        if (entry.expires > now) {
//            // delete from disk
//            fs.remove(entry.file, function (err) {
//                if (err) {
//                    console.error('Could not remove the file:', err);
//                }
//                // remove from registry
//                obj.splice(ix, 1);
//            });
//        }
//    });
//}, 1000 * 60 * 5);
//
//var relocateFile = function (filepath) {
//    var file = encodeURI(filepath.split('/').pop());
//    var newpath = path.join(__dirname, 'tmp', file);
//    for (var i = tmpRegistry.length - 1; i >= 0; i--) {
//        if (tmpRegistry[i].file == newpath) {
//            tmpRegistry[i].expires = Date.now() + (1000 * 60 * 60);
//            return path.join('/tmp', file);
//        }
//    }
//    fs.copySync(filepath, newpath);
//    tmpRegistry.push({
//        file: newpath,
//        expires: Date.now() + (1000 * 60 * 60)
//    });
//    return path.join('/tmp', file);
//};
//
//app.get('/filelist', function (req, res) {
//    fs.readdir(config.downloadsLocation, 'utf8', function (err, files) {
//        if (err) {
//            res.sendStatus(500);
//        } else {
//            var listing = [];
//            files.forEach(function (f) {
//                try {
//                    var stats = fs.lstatSync(path.join(config.downloadsLocation, f));
//                    var entry = {
//                        filename: f,
//                        bytes: stats.size,
//                        directory: stats.isDirectory()
//                    };
//                    if (entry.directory || stats.isFile()) {
//                        listing.push(entry);
//                    }
//                } catch (e) {
//                    console.log('Could not stat file ' + f + ': ' + e);
//                }
//            });
//            res.status(200).send({ files: listing });
//        }
//    });
//});
//
//app.post('/download', function (req, res) {
//    var filename = req.body.file;
//    var absPath = path.join(config.downloadsLocation, filename);
//    fs.lstat(absPath, function (err, stats) {
//       if (!stats.isFile()) {
//           // fs.mkdtemp(config.tmpPrefix, function (err, folder) {
//           //     if (err) {
//           //         res.sendStatus(500);
//           //     } else {
//           //         var archive = archiver('zip', {store: true});
//           //         var zippath = path.join(folder, filename + '.zip');
//           //         var output = fs.createWriteStream(zippath);
//           //         archive.pipe(output);
//           //         archive.directory(absPath, '/');
//           //         archive.finalize();
//           //         output.on('close', function () {
//           //             res.append('x-filename', filename + '.zip');
//           //             res.sendFile(zippath, function (err) {
//           //                 if (err) {
//           //                     res.sendStatus(500);
//           //                 }
//           //             });
//           //         });
//           //     }
//           // });
//           fs.mkdtemp(config.tmpPrefix, function (err, folder) {
//               if (err) {
//                   res.sendStatus(500);
//               } else {
//                   var archive = archiver('zip', {store: true});
//                   var zippath = path.join(folder, filename + '.zip');
//                   var output = fs.createWriteStream(zippath);
//                   archive.pipe(output);
//                   archive.directory(absPath, '/');
//                   archive.finalize();
//                   output.on('close', function () {
//                       res.status(200).send({fileLocation: relocateFile(zippath)});
//                   });
//               }
//           });
//       } else {
//           // res.append('x-filename', filename);
//           // res.sendFile(absPath, function (err) {
//           //     if (err) {
//           //         res.sendStatus(500);
//           //     }
//           // });
//           res.status(200).send({ fileLocation: relocateFile(absPath) });
//       }
//    });
//    // fs.lstat(absPath, function (err, stats) {
//    //     if (err) {
//    //         res.sendStatus(500);
//    //     } else {
//    //         if (!stats.isFile()) {
//    //             // 1. make local 'downloads' directory, if it doesn't exist already (probably should be done early, and made express.static)
//    //             // 2a. make sure the zip doesn't already exist here, for whatever reason
//    //             // 2b. if it doesn't exist, create the zip in this directory
//    //             // 3. store the file info in some sort of registry so that a sweeper can come along periodically and remove items after some amount of time
//    //             // 4. send the location of the file so the client can go pick it up (in a new tab, for mobile)
//    //             // 5. ???
//    //             // 6. profit
//    //         }
//    //     }
//    // });
//});
//
//app.listen(config.listenPort);
