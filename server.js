/**
 * Created by tsned on 11/14/16.
 */
'use strict';

var archiver = require('archiver');
var argparse = require('argparse');
var bparser = require('body-parser');
var crypto = require('crypto');
var express = require('express');
var fs = require('fs-extra');
var path = require('path');

var parser = argparse.ArgumentParser();
parser.addArgument(['-p', '--port'], {
    action: 'store',
    dest: 'port',
    type: 'int',
    defaultValue: 8080
});
parser.addArgument(['-r', '--root'], {
    required: true,
    action: 'store',
    dest: 'root'
});
parser.addArgument(['-t', '--tmp'], {
    action: 'store',
    dest: 'tmp',
    defaultValue: path.join(__dirname, 'tmp')
});
parser.addArgument(['-e', '--expiry'], {
    action: 'store',
    dest: 'expiry',
    type: 'int',
    defaultValue: 60
});
parser.addArgument(['-d', '--delete'], {
    action: 'storeTrue',
    dest: 'del'
});
parser.addArgument(['-s', '--sizeof'], {
    action: 'storeTrue',
    dest: 'sizeof'
});

var config = parser.parseArgs();
var app = express();

app.use(bparser.json());
app.use(bparser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(config.tmp));
app.use(express.static(config.root));

Object.defineProperty(Array.prototype, 'contains', {
    enumerable: false,
    writable: true,
    value: function (item) { return this.indexOf(item) != -1; }
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

var hashFilenames = function (files) {
    var copy = files.slice(0);
    copy.sort();
    return crypto.createHash('md5').update(copy.join('')).digest('hex');
};

var filepathMapper = function (file) {
    return file.path || '';
};

var sizeof = function (dir) {
    var total = 0;
    try {
        var s = fs.lstatSync(dir);
        if (s.isFile()) {
            total += s.size;
        } else if (s.isDirectory()) {
            var files = fs.readdirSync(dir);
            files.forEach(function (f) {
                total += sizeof(path.join(dir, f));
            });
        }
    } catch (e) {
        return 0;
    }
    return total;
};

var tmpRegistry = [];

setTimeout(function () {
    var now = Date.now();
    tmpRegistry.forEach(function (entry, ix, arr) {
        if (entry.expires > now) {
            // delete
            fs.remove(entry.file, function (err) {
                if (err) console.error('Could not remove the file: ', err);
                arr.splice(ix, 1); // remove from registry
            });
        }
    });
}, 1000 * 60 * 2);

/**
 * {
 *   requestPath: '/path/to/folder'
 * }
 */
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
            res.sendStatus(400);
        } else {
            var listing = [];
            files.forEach(function (f) {
                if (!f.startsWith('.')) {
                    try {
                        var stats = fs.lstatSync(path.join(dir, f));
                        var size = stats.isDirectory && config.sizeof ? sizeof(path.join(dir, f)) : stats.size;
                        var entry = {
                            id: stats.ino,
                            name: f,
                            size: size,
                            modified: stats.mtime.getTime(),
                            directory: stats.isDirectory(),
                            type: stats.isDirectory() ? 'folder' : getType(f)
                        };
                        listing.push(entry);
                    } catch (e) {
                        console.error('Could not stat file:', e);
                    }
                }
            });
            res.status(200).send({ listing: listing, current: rpath });
        }
    });
});

/**
 * {
 *   files: [
 *     {
 *       path: 'path/to/file.zip',
 *       directory: false
 *     },
 *     ...
 *   ]
 * }
 */
app.post('/download', function (req, res) {
    var files = req.body.files;
    if (files.constructor !== Array || files.length == 0) {
        res.sendStatus(400);
    } else if (files.length == 1 && !files[0].directory) { // singular file case: send link
        var p = files[0].path;
        res.status(200).send({ link: p });
    } else { // bulk or folder: create a zip and send link to that
        try {
            var archive = archiver('zip', {store: true});
            var namehash = hashFilenames(files.map(filepathMapper));
            // TODO: check for existing file based on hash
            var filename = path.join(config.tmp, namehash + '.zip');
            var output = fs.createWriteStream(filename);
            archive.pipe(output);
            output.on('close', function () {
                res.status(200).send({link: namehash + '.zip'});
            });
            output.on('error', function (err) {
                throw err;
            });
            files.forEach(function (file) {
                var name = file.path.charAt(0) == '/' ? file.path.substring(1) : file.path;
                if (file.directory) {
                    archive.directory(path.join(config.root, name), '/' + name.split('/').pop());
                } else {
                    archive.file(path.join(config.root, name), { name: '/' + name.split('/').pop() });
                }
            });
            archive.finalize();
        } catch (e) {
            console.error(e);
            res.sendStatus(500);
        }
    }
});

/**
 * Note: only active when delete is enabled
 *
 * {
 *   files: ['path1', 'path2', ...]
 * }
 */
app.post('/delete', function (req, res) {
    res.sendStatus(403);
});

try {
    fs.ensureDirSync(config.tmp);
    fs.emptyDirSync(config.tmp);
} catch (e) {
    console.error('Could not create tmp directory: ', e);
    process.exit(1);
}

// start up server
app.listen(config.port);
