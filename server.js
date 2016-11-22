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
parser.addArgument(['-s', '--showhidden'], {
    action: 'storeTrue',
    dest: 'hidden'
});
parser.addArgument(['-u', '--upload'], {
    action: 'storeTrue',
    dest: 'upload'
});
parser.addArgument(['-n', '--newfolder'], {
    action: 'storeTrue',
    dest: 'newfolder'
});
parser.addArgument(['-m', '--rename'], {
    action: 'storeTrue',
    dest: 'rename'
});

var config = parser.parseArgs();
var app = express();

app.use(bparser.json());
app.use(bparser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(config.tmp));
app.use(express.static(config.root, { dotfiles: config.hidden ? 'allow' : 'ignore' }));

Object.defineProperty(Array.prototype, 'contains', {
    enumerable: false,
    writable: true,
    value: function (item) { return this.indexOf(item) != -1 }
});

// extensions
var _archiveExts = ['zip', 'gz', 'tar', 'jar', 'rar'];
var _audioExts = ['mp3', 'flac', 'ogg'];
var _codeExts = ['js', 'ts', 'htm', 'html', 'py', 'sh', 'c', 'h', 'cpp', 'cs', 'java', 'css', 'xml', 'json'];
var _excelExts = ['xls', 'xlsx'];
var _imageExts = ['png', 'jpg', 'jpeg', 'tiff', 'gif'];
var _pdfExts = ['pdf'];
var _powerpointExts = ['ppt', 'pptx'];
var _textExts = ['txt', 'csv', 'rtf'];
var _videoExts = ['mp4', 'mov', 'mkv', 'avi'];
var _wordExts = ['doc', 'docx', 'odt'];

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

var flags = {
    del: config.del,
    upl: config.upload,
    nwf: config.newfolder,
    rnm: config.rename
};

var hashFilenames = function (files) {
    var copy = files.slice(0);
    copy.sort();
    return crypto.createHash('md5').update(copy.join('')).digest('hex');
};

var filepathMapper = function (file) {
    return file.path || '';
};

var countItems = function (dir) {
    try {
        return fs.readdirSync(dir).length;
    } catch (e) {
        return 0;
    }
};

var normalizeRelPath = function (p) {
    if (p.charAt(0) == '/') {
        p = p.substring(1);
    }
    return p;
};

var getListing = function (rpath, res) {
    if (!rpath) {
        res.sendStatus(400);
        return;
    }
    rpath = normalizeRelPath(rpath);
    var dir = path.join(config.root, rpath);
    fs.readdir(dir, 'utf8', function (err, files) {
        if (err) {
            res.sendStatus(400);
        } else {
            var listing = [];
            files.forEach(function (f) {
                if (!(!config.hidden && f.startsWith('.'))) { // yeah...sorry for this
                    try {
                        var stats = fs.lstatSync(path.join(dir, f));
                        var size = stats.isDirectory() ? countItems(path.join(dir, f)) : stats.size;
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
            res.status(200).send({ listing: listing, current: rpath, flags: flags });
        }
    });
};

var doMove = function (oldPath, newPath, isDir, res) {
    if (!oldPath || !newPath) {
        res.sendStatus(400);
        return;
    }
    oldPath = normalizeRelPath(oldPath);
    newPath = normalizeRelPath(newPath);

    // TODO
    res.sendStatus(400);
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
    getListing(rpath, res);
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
        var namehash = hashFilenames(files.map(filepathMapper));
        var filename = path.join(config.tmp, namehash + '.zip');
        fs.access(filename, fs.R_OK, function (error) {
            if (!error) { // file exists already
                res.status(200).send({ link: namehash + '.zip' });
            } else {
                try {
                    var archive = archiver('zip', {store: true});
                    var output = fs.createWriteStream(filename);
                    archive.pipe(output);
                    output.on('close', function () {
                        res.status(200).send({link: namehash + '.zip'});
                    });
                    output.on('error', function (err) {
                        console.error(err);
                        throw err;
                    });
                    files.forEach(function (file) {
                        var name = file.path.charAt(0) == '/' ? file.path.substring(1) : file.path;
                        if (file.directory) {
                            archive.directory(path.join(config.root, name), '/' + name.split('/').pop());
                        } else {
                            archive.file(path.join(config.root, name), {name: '/' + name.split('/').pop()});
                        }
                    });
                    archive.finalize();
                } catch (e) {
                    console.error(e);
                    res.sendStatus(500);
                }
            }
        });
    }
});

/**
 * Note: only active when delete is enabled
 *
 * {
 *   current: 'path',
 *   files: ['file1', 'file2', ...]
 * }
 */
app.post('/delete', function (req, res) {
    if (!config.del) {
        res.sendStatus(403);
        return;
    }

    var files = req.body.files;
    if (files.constructor !== Array || files.length == 0) {
        res.sendStatus(400);
    } else {
        files.forEach(function (file) {
            var filename = path.join(config.root, file);
            try {
                fs.removeSync(filename);
            } catch (e) {
                console.error(e);
            }
        });
        var curr = req.body.current;
        getListing(curr, res);
    }
});

/**
 * {
 *   currentPath: 'path',
 *   newPath: 'path',
 *   directory: bool
 * }
 */
app.post('/rename', function (req, res) {
    doMove(req.body.currentPath, req.body.newPath, req.body.directory, res);
});

/**
 * {
 *   current: 'path',
 *   folderName: 'name'
 * }
 */
app.post('/newfolder', function (req, res) {
    if (!config.newfolder) {
        res.sendStatus(403);
        return;
    }
    var c = req.body.current;
    var f = req.body.folderName;
    if (!c || !f) {
        res.sendStatus(400);
        return;
    }

    var p = path.join(config.root, normalizeRelPath(c), f.replace('/', ''));
    fs.access(p, fs.R_OK, function (err) {
        if (err) { // folder doesn't exist yet
            fs.mkdir(p, function (err) {
                if (err) {
                    res.sendStatus(500);
                } else {
                    getListing(req.body.current, res);
                }
            });
        } else {
            res.sendStatus(400);
        }
    });
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
