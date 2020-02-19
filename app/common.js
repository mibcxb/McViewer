const os = require("os");
const fs = require("fs");
const path = require("path");
const {
    BrowserWindow
} = require("electron").remote;
const Mousetrap = require("mousetrap");
const JSZip = require("jszip");
const CsFile = require("./csfile");

const rootDir = "/"; // os.platform() === 'win32' ? "" : "/";
const homeDir = toUnixPath(os.homedir());

function toUnixPath(filepath) {
    if (os.platform() === "win32") {
        var tempPath = "/";
        tempPath = tempPath + path.posix.normalize(filepath);
        tempPath = tempPath.replace(":\\", "/");
        tempPath = tempPath.replace("\\", "/");
        filepath = tempPath;
    }
    return filepath;
}

function toRealPath(filepath) {
    filepath = path.posix.normalize(filepath);
    var realpath = null;
    if (/\/[A-Z]{1}\/.+/.test(filepath)) {
        var prefix = filepath.charAt(1) + ":";
        var suffix = filepath.substring(2);
        realpath = prefix + suffix;
    } else if (/^\/[A-Z]{1}$/.test(filepath)) {
        realpath = filepath.charAt(1) + ":\\";
    } else {
        realpath = filepath;
    }
    if (realpath != null && os.platform() === "win32") {
        realpath = path.win32.normalize(realpath);
    }
    return realpath;
}

function osIsWindows() {
    return os.platform().startsWith("win");
}

function fsIsFile(filepath) {
    try {
        return fs.statSync(filepath).isFile();
    } catch (err) {
        console.error(err);
        return false;
    }
}

function fsIsDirectory(filepath) {
    try {
        return fs.statSync(filepath).isDirectory();
    } catch (err) {
        console.error(err);
        return false;
    }
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

function openLink(link, fullscreen, isDebug, onClosed) {
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        fullscreen: fullscreen,
        alwaysOnTop: true,
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.on("closed", () => {
        win = null;
        if (onClosed) {
            onClosed();
        }
    });
    win.loadURL(link);
    if (isDebug) {
        win.webContents.openDevTools();
    }
}