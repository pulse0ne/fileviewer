# Fileviewer
Little utility to view/download/delete files.

### Usage
```bash
node server.js -r /home/user/stuff
```

### Arguments
```
-r --root    (required) the absolute path to the root directory to be served

-p --port    (optional; default: 8080) the port to start the server on
-e --expiry  (optional; default: 60) the time in minutes a temporary file will live for
-t --tmp     (optional; default: ./tmp) the temporary folder for zipped files
-d --delete  (optional) when present, delete capability will be enabled
-s --sizeof  (optional) when present, will recursively calculate directory sizes (warning: potential performance impact)
```

### Notes
Lots of sensitive information will be passed over the line (file structure and information), so if used anywhere other than a LAN or closed environment, make sure you're serving everything over TLS (https).
This is especially important for the downloads: the links are created dynamically from information passed from the server. If there is a man-in-the-middle on the connection, they could dynamically change the download location to something malicious.
You have been warned.

### Known Issues
- Hidden files
- bad file names (non-url-encoded names)

## License
Licensed under MIT
