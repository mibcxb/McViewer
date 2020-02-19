"use strict";
const os = require("os");
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path").posix;
const mime = require("mime");
const JSZip = require("jszip");

const CS_ZIP_DELEMITER = "#zip/";

/**
 * Representation a file interface in js
 * @constructor
 */
function CsFile(filepath, filename) {
  // if this constructor is used without `new`, it adds `new` before itself:
  if (!(this instanceof CsFile)) {
    return new CsFile(filepath, filename);
  }

  filepath = filepath === undefined ? "/" : filepath; // use '/' as the root path
  let tempPath = filename === undefined ? path.normalize(filepath) : path.join(filepath, filename);
  this.fullpath = tempPath;

  let segIdx = tempPath.search(CS_ZIP_DELEMITER);
  if (segIdx !== -1) {
    this.segment = tempPath.substring(segIdx + CS_ZIP_DELEMITER.length);
    this.zipPath = tempPath.substring(0, segIdx);
    this.zipFile = null;
  }
  this.csStats = null;

  this.basename = basename;
  this.extension = extension;
  this.mimeType = mimeType;
  this.fileStatsAsync = fileStatsAsync;
  this.getZipFileAsync = getZipFileAsync;
  this.listFileAsync = listFileAsync;
  this.readFileAsync = readFileAsync;
  this.isHidden = isHidden;
  this.isZipFile = isZipFile;
  this.isImageFile = isImageFile;
  this.getParentPath = getParentPath;
  this.getParentFile = getParentFile;
}

function basename() {
  return optBasename(this);
}

function extension() {
  return optExtension(this);
}

function mimeType() {
  return optMimeType(this);
}

function isHidden() {
  return checkHidden(this);
}

function isZipFile() {
  return checkZipFile(this);
}

function isImageFile() {
  return checkImageFile(this);
}

function getParentPath() {
  return detectParentPath(this);
}

function getParentFile() {
  return new CsFile(detectParentPath(this));
}

async function fileStatsAsync() {
  return await tryFileStatsAsync(this);
}

async function getZipFileAsync() {
  return await tryLoadZipFileAsync(this);
}

async function listFileAsync() {
  return await tryListFileAsync(this);
}

async function readFileAsync() {
  return await tryReadAsBase64(this);
}

// do not use this in these functions

function optBasename(csFile) {
  return csFile.segment === undefined ? path.basename(csFile.fullpath) : path.basename(csFile.segment);
}

function optExtension(csFile) {
  return path.extname(optBasename(csFile));
}

function optMimeType(csFile) {
  return mime.getType(optExtension(csFile));
}

function isRealFile(csFile) {
  return csFile.segment === undefined;
}

function checkHidden(csFile) {
  return /(^|\/)\.[^\/\.]/g.test(optBasename(csFile));
}

function checkZipFile(csFile) {
  return isRealFile(csFile) && optExtension(csFile) === ".zip";
}

function checkImageFile(csFile) {
  let extname = optExtension(csFile);
  return extname === ".png" || extname === ".jpg";
}

function detectParentPath(csFile) {
  if (isRealFile(csFile)) {
    return path.dirname(csFile.fullpath);
  }
  let dirname = path.dirname(csFile.segment);
  if (dirname === ".") {
    return csFile.zipPath;
  }
  return csFile.zipPath + CS_ZIP_DELEMITER + dirname + "/";
}

async function tryFileStatsAsync(csFile) {
  if (csFile.csStats == null) {
    if (isRealFile(csFile)) {
      csFile.csStats = await readFileStatsAsync(toRealPath(csFile.fullpath));
    } else {
      csFile.csStats = await readZipFileStatsAsync(toRealPath(csFile.zipPath), csFile.segment);
    }
  }
  return csFile.csStats;
}

async function checkReadableAsync(filepath) {
  return fsPromises.access(filepath, fs.constants.F_OK | fs.constants.R_OK);
}

function readFileStatsAsync(filepath) {
  return checkReadableAsync(filepath)
    .then(function () {
      return fsPromises.stat(filepath).then(function (stats) {
        return new Promise(function (resolve) {
          var csStats = {
            readable: true,
            isZipped: false,
            isSymbolicLink: stats.isSymbolicLink(),
            isDirectory: stats.isDirectory(),
            isFile: stats.isFile()
          };
          resolve(csStats);
        });
      });
    });
}

function readZipFileStatsAsync(filepath, segment) {
  return checkReadableAsync(filepath)
    .then(function () {
      return loadJsZipAsync(filepath);
    })
    .then(function (zip) {
      var zipFile = zip.files[segment];
      var readable = zipFile != null;
      return new Promise(function (resolve) {
        var csStats = {
          readable: readable,
        };
        if (readable) {
          csStats.isZipped = true;
          csStats.isSymbolicLink = false;
          csStats.isDirectory = zipFile.dir;
          csStats.isFile = !zipFile.dir;
        }
        resolve(csStats);
      });
    });
}

async function tryLoadZipFileAsync(csFile) {
  if (isRealFile(csFile) && optExtension(csFile) !== ".zip") {
    return null;
  }

  if (csFile.zipFile == null) {
    let filepath = isRealFile(csFile) ? csFile.fullpath : csFile.zipPath;
    csFile.zipFile = await loadJsZipAsync(toRealPath(filepath));
  }
  return csFile.zipFile;
}

async function loadJsZipAsync(filepath) {
  return fsPromises.readFile(filepath)
    .then(function (data) {
      return JSZip.loadAsync(data);
    })
}

async function tryListFileAsync(csFile) {
  if (csFile.fullpath === "/" && os.platform() === "win32") {
    var fileList = [];
    let drives = await stupidWinDriveList();
    drives.forEach(drive => {
      var file = new CsFile(drive);
      fileList.push(file);
    });
    return fileList;
  }

  var fileList = [];
  let csStats = null;
  try {
    csStats = await tryFileStatsAsync(csFile);
  } catch (err) {
    console.log(err);
  }
  if (csStats != null) {
    if (csStats.isDirectory || checkZipFile(csFile)) {
      if (csStats.isDirectory && !csStats.isZipped) {
        // 普通文件夹
        let files = await fsPromises.readdir(toRealPath(csFile.fullpath));
        files.forEach(filename => {
          var file = new CsFile(csFile.fullpath, filename);
          fileList.push(file);
        });
      } else {
        let zipFile = await tryLoadZipFileAsync(csFile);
        let files = Object.keys(zipFile.files);
        files.forEach(filename => {
          var testname = path.posix.dirname(filename) + "/";
          if (isRealFile(csFile)) {
            if (testname === "./") {
              var file = new CsFile(csFile.fullpath + CS_ZIP_DELEMITER, filename);
              fileList.push(file);
            }
          } else {
            if (testname === csFile.segment) {
              var file = new CsFile(csFile.zipPath + CS_ZIP_DELEMITER, filename);
              fileList.push(file);
            }
          }
        });
      }
    }
  }
  return fileList;
}

async function tryReadAsBase64(csFile) {
  var data = null;
  let csStats = await tryFileStatsAsync(csFile);
  if (!csStats.isDirectory) {
    if (isRealFile(csFile)) {
      data = await readFileAsBase64(csFile);
    } else {
      data = readZipFileAsBase64(csFile);
    }
  }
  return data;
}

async function readFileAsBase64(csFile) {
  return fsPromises.readFile(toRealPath(csFile.fullpath))
    .then(function (data) {
      return new Promise(function (res, ref) {
        try {
          let str = Buffer.from(data).toString('base64');
          res(str);
        } catch (err) {
          ref(err);
        }
      })
    });
}

async function readZipFileAsBase64(csFile) {
  return tryLoadZipFileAsync(csFile)
    .then(function (zipFile) {
      return zipFile.file(csFile.segment).async("base64");
    });
}

async function getDriveList() {
  if (os.platform() === "win32")
    return stupidWinDriveList();
  else
    return ["/"];
}

async function stupidWinDriveList() {
  return new Promise(function (resolve) {
    let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var drives = [];
    for (var i = 0; i < alphabet.length; i++) {
      let ch = alphabet.charAt(i);
      try {
        fs.accessSync(ch + ":", fs.constants.F_OK);
        drives.push("/" + ch);
      } catch (err) {}
    }
    resolve(drives);
  });
}

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

module.exports = CsFile;