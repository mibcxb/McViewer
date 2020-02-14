const os = require("os");
const fs = require("fs");
const path = require("path");
const {
    BrowserWindow
} = require("electron").remote;
const Mousetrap = require("mousetrap");
const JSZip = require("jszip");

const rootDir = "/"; // os.platform() === 'win32' ? "" : "/";
const homeDir = path.resolve(os.homedir());

function osIsWindows() {
    return os.platform().startsWith("win");
}

function fsIsFile(filepath) {
    return fs.statSync(filepath).isFile();
}

function fsIsDirectory(filepath) {
    return fs.statSync(filepath).isDirectory();
}

function fsIsHidden(filepath) {
    var filename = path.posix.basename(filepath);
    // TODO check on windows
    return /(^|\/)\.[^\/\.]/g.test(filename);
}

function fsCheckExtName(filename, ...extNames) {
    if (extNames == null || extNames.length === 0) {
        return false;
    }
    var extname = path.posix.extname(filename);
    for (var i = 0; i < extNames.length; i++) {
        if (extname === extNames[i]) {
            return true;
        }
    }
    return false;
}

function fsCheckFileExtName(filepath, ...extNames) {
    if (fsIsFile(filepath)) {
        if (extNames == null || extNames.length === 0) {
            return true;
        }
        var extname = path.posix.extname(filepath);
        for (var i = 0; i < extNames.length; i++) {
            if (extname === extNames[i]) {
                return true;
            }
        }
    }
    return false;
}

function fsIsZip(filepath) {
    return fsCheckFileExtName(filepath, ".zip");
}

function fsIsImage(filepath) {
    return fsCheckFileExtName(filepath, ".png", ".jpg");
}

function zipFileList(filepath, callback) {
    let isCallback = typeof callback === "function";
    fs.readFile(currentFilePath, function (err, data) {
        if (err) {
            if (isCallback) {
                callback(err);
            }
        }
        JSZip.loadAsync(data).then(function (zip) {
            if (isCallback) {
                callback(null, zip);
            }
        });
    });
}

function openLink(link, fullscreen, isDebug) {
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        fullscreen: fullscreen,
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.on("closed", () => {
        win = null;
    });
    win.loadURL(link);
    if (isDebug) {
        win.webContents.openDevTools();
    }
}