# Fileviewer
Little utility to view/download/delete files.

![fileviewer](https://github.com/pulse0ne/fileviewer/blob/master/fileviewer.png?raw=true)

### Basic Usage
```bash
node server.js -r /home/user/stuff
```

### Advanced Usage
#### All options (long-form)
```bash
node server.js --root /home/user/stuff --port 1776 --expiry 120 --tmp ./abc --delete --upload --newfolder --rename --showhidden
```

#### All options (short-form)
```bash
node server.js -r /home/user/stuff -p 1776 -e 120 -t ./abc -d -u -n -m -s
```

### Arguments
```
-r --root       (required) the absolute path to the root directory to be served

-p --port       (optional; default: 8080) the port to start the server on
-e --expiry     (optional; default: 60) the time in minutes a temporary file will live for
-t --tmp        (optional; default: ./tmp) the temporary folder for zipped files

-d --delete     (optional) when present, delete capability will be enabled
-u --upload     (optional) when present, upload capability will be enabled
-n --newfolder  (optional) when present, new folder capability will be enabled
-m --rename     (optional) when present, rename capability will be enabled
-s --showhidden (optional) when present, shows hidden files
```

### TODOs
- Hide icon buttons when disabled?
- Add upload capability
- Add rename capability
- Add move capability?

### Notes
- Lots of sensitive information will be passed over the line (file structure and information, files can be downloaded, etc.), so if used anywhere other than a LAN or closed environment, make sure you're serving everything over TLS (https).
This is especially important for the downloads: the links are created dynamically from information passed from the server. If there is a man-in-the-middle on the connection, they could dynamically change the download location to something malicious.
You have been warned.
- Some browsers (notably, Chrome) chose to implement an unstable sort for Array#sort. This causes problems when we try to do custom sorting (prioritizing directories then sorting on name, for instance). To remedy this, I used/modified a stable merge-sort implementation from the [mout](https://github.com/mout/mout) suite.

## License
Licensed under MIT

## Dependency Credits
Thanks to the wonderful people behind these projects:
- [jprichardson](https://github.com/jprichardson) for [node-fs-extra](https://github.com/jprichardson/node-fs-extra)
- [archiverjs](https://github.com/archiverjs) for [node-archiver](https://github.com/archiverjs/node-archiver)
- [nodeca](https://github.com/nodeca) for [argparse](https://github.com/nodeca/argparse)
- [expressjs](https://github.com/expressjs) for [express](https://github.com/expressjs/express) and [body-parser](https://github.com/expressjs/body-parser)
- [angular](https://github.com/angular) for [angular.js](https://github.com/angular/angular.js) and [Angular Material](https://github.com/angular/material)
- [chieffancypants](https://github.com/chieffancypants) for [angular-loading-bar](https://github.com/chieffancypants/angular-loading-bar)
- [mout](https://github.com/mout) for the stable [merge-sort](https://github.com/mout/mout/master/src/array/sort.js) implementation
- The Fontawesome Team for [fontawesome](http://fontawesome.io/)
- [StackOverflow](http://stackoverflow.com/) for answering my stupid questions
