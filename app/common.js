const os = require("os");
const fs = require("fs");
const path = require("path");
const {
    BrowserWindow
} = require('electron').remote

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
    return (/(^|\/)\.[^\/\.]/g).test(filename)
}

function fsIsImage(filepath) {
    if (fsIsFile(filepath)) {
        var extname = path.posix.extname(filepath);
        if (extname === ".png" || extname === ".jpg") {
            return true;
        }
    }
    return false;
}

function openLink(link) {
    let win = new BrowserWindow({
        width: 800,
        height: 600,
        fullscreen: true,
        webPreferences: {
            nodeIntegration: true
        }
    });
    win.on('closed', () => {
        win = null
    });
    win.loadURL(link);
    win.webContents.openDevTools();
}