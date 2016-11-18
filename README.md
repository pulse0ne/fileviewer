# Fileviewer
Little utility to view/download/delete files.

### Usage
```bash
node server.js -r /home/user/stuff
```

### Arguments
```
-r --root       (required) the absolute path to the root directory to be served

-p --port       (optional; default: 8080) the port to start the server on
-e --expiry     (optional; default: 60) the time in minutes a temporary file will live for
-t --tmp        (optional; default: ./tmp) the temporary folder for zipped files
-d --delete     (optional) when present, delete capability will be enabled
-s --showhidden (optional) when present, shows hidden files (can be re-hidden on client-side)
```

### Notes
Lots of sensitive information will be passed over the line (file structure and information, files can be downloaded, etc.), so if used anywhere other than a LAN or closed environment, make sure you're serving everything over TLS (https).
This is especially important for the downloads: the links are created dynamically from information passed from the server. If there is a man-in-the-middle on the connection, they could dynamically change the download location to something malicious.
You have been warned.

## License
Licensed under MIT

## Dependency Credits
- [jprichardson](https://github.com/jprichardson) for [node-fs-extra](https://github.com/jprichardson/node-fs-extra)
- [archiverjs](https://github.com/archiverjs) for [node-archiver](https://github.com/archiverjs/node-archiver)
- [nodeca](https://github.com/nodeca) for [argparse](https://github.com/nodeca/argparse)
- [expressjs](https://github.com/expressjs) for [express](https://github.com/expressjs/express) and [body-parser](https://github.com/expressjs/body-parser)
- The Fontawesome Team for [fontawesome](http://fontawesome.io/)
- [angular](https://github.com/angular) for [angular.js](https://github.com/angular/angular.js) and [Angular Material](https://github.com/angular/material)
- [chieffancypants](https://github.com/chieffancypants) for [angular-loading-bar](https://github.com/chieffancypants/angular-loading-bar)
- [noraesae](https://github.com/noraesae) for [perfect-scrollbar](https://github.com/noraesae/perfect-scrollbar)
- [StackOverflow](http://stackoverflow.com/) for answering my stupid questions
