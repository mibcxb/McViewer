'use strict';
const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path').posix;
const mime = require('mime');
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

    filepath = (filepath === undefined ? "/" : filepath); // use '/' as the root path
    let tempPath = (filename === undefined) ?
        path.normalize(filepath) : path.join(filepath, filename);
    this.fullpath = tempPath;

    let segIdx = tempPath.search(CS_ZIP_DELEMITER);
    if (segIdx === -1) {
        // 普通文件
        this.fileStats = fs.statSync(tempPath);
    } else {
        // 压缩文件
        this.segment = tempPath.substring(segIdx + CS_ZIP_DELEMITER.length);
        this.zipPath = tempPath.substring(0, segIdx);
        this.zipFile = null;
    }

    this.basename = basename;
    this.extension = extension;
    this.mimeType = mimeType;
    this.isFile = isFile;
    this.isDirectory = isDirectory;
    this.getZipFile = getZipFile;
}

function basename() {
    return this.segment === undefined ? path.basename(this.fullpath) : path.basename(this.segment);
}

function extension() {
    return path.extname(this.basename());
}

function mimeType() {
    return mime.getType(this.extension());
}

function isFile() {
    if (this.segment === undefined)
        return this.fileStats.isFile();
    else
        this.getZipFile() //.files[this.segment].isFile;
}

function isDirectory() {
    if (this.segment === undefined)
        return this.fileStats.isDirectory();
    else {
        let zipFile = this.getZipFile(); //.files[this.segment].isDir;
        return zipFile //.files[this.segment].isDir;
    }
}

function getZipFile() {
    if (this.segment === undefined) return null;
    if (this.zipFile == null) {
        tryLoadZipFile(this.zipPath);
    }
    console.log(1);
    return this.zipFile;
}

async function tryLoadZipFile(filepath) {
    try {
        console.log(2);
        this.zipFile = await loadZipFileAsync(filepath);
    } catch (e) {
        console.log(4);
        console.error(e);
    }
}

async function loadZipFileAsync(filepath) {
    return new JSZip.external.Promise(function (resolve, reject) {
        fs.readFile(filepath, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    }).then(function (data) {
        console.log(3);
        return JSZip.loadAsync(data);
    });
}

module.exports = CsFile;