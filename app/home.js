var zTree;
var treeSettings = {
  data: {
    keep: {
      parent: true
    }
  },
  callback: {
    onClick: fileTreeOnClick,
    beforeExpand: fileTreeBeforeExpand,
    onExpand: fileTreeOnExpand,
    onCollapse: fileTreeOnCollapse
  }
};
var treeNodeData = [{
  name: "根目录",
  filepath: rootDir,
  children: []
}];

var editFilePath;
var imagePreview;
var fileGridContainer;
var currentFilePath;

let isDebug = true;

$(document).ready(function () {
  $.fn.zTree.init($("#fileTreeDemo"), treeSettings, treeNodeData);
  zTree = $.fn.zTree.getZTreeObj("fileTreeDemo");
  editFilePath = document.getElementById("editFilePath");
  imagePreview = document.getElementById("fileImagePreview");
  fileGridContainer = document.getElementById("fileGridContainer");

  document.getElementById("btnBackward").onclick = backwardOnClick;

  loadRootList(zTree);
});

function loadRootList(zTree) {
  var nodeList = zTree.getNodes();
  var parentNode = null;
  var parentPath = rootDir;

  var dirNames = homeDir.split(path.sep);
  for (dirIdx in dirNames) {
    var filepath = path.posix.join(parentPath, dirNames[dirIdx]);
    for (subIdx in nodeList) {
      if (nodeList[subIdx].filepath === filepath) {
        parentNode = nodeList[subIdx];
        parentPath = nodeList[subIdx].filepath;
        break;
      }
    }
    nodeList = readFileList(zTree, parentNode, parentPath);
  }
  zTree.refresh();

  reloadFileGrid(parentNode.filepath);
}

function readFileList(zTree, parentNode, filepath) {
  // 同步创建子节点列表
  var nodeList = [];
  var files = fs.readdirSync(filepath);
  for (index in files) {
    var name = files[index];
    var node = {
      name: name,
      filepath: path.posix.join(filepath, name)
    };
    var treeNode = createFileTreeNode(node);
    if (treeNode != null) {
      nodeList.push(treeNode);
    }
  }
  zTree.addNodes(parentNode, nodeList);
  return parentNode.children;
}

function appendFileNodeList(zTree, parentNode) {
  var nodeList = [];
  var folder = parentNode.filepath;
  fs.readdir(folder, (err, files) => {
    if (err !== null) {
      console.log(err);
      return;
    }

    for (index in files) {
      var name = files[index];
      var node = {
        name: name,
        filepath: path.posix.join(folder, name)
      };
      var treeNode = createFileTreeNode(node);
      if (treeNode != null) {
        nodeList.push(treeNode);
      }
    }
    zTree.addNodes(parentNode, nodeList);
    zTree.refresh();
  });
}

function removeFileNodeList(zTree, parentNode) {
  zTree.removeChildNodes(parentNode);
}

function createFileTreeNode(node) {
  if (fsIsHidden(node.filepath)) {
    return null;
  }
  if (fsIsDirectory(node.filepath)) {
    node.isParent = true;
    node.children = [];
    return node;
  } else if (fsIsFile(node.filepath)) {
    node.isParent = false;
    var extname = path.posix.extname(node.filepath);
    if (extname === ".zip") {
      node.icon = "../res/img/zip.png";
      return node;
    }
  }
  return null;
}

function reloadFileGrid(filepath) {
  if (filepath == null) {
    return;
  }
  if (currentFilePath === filepath) {
    return;
  }

  currentFilePath = filepath;
  editFilePath.value = currentFilePath;

  fileGridContainer.innerHTML = "";
  createFileGrid(filepath);
}

function createFileGrid(filepath) {
  let csFile = new CsFile(filepath);
  csFile.fileStatsAsync()
    .then(function (csStats) {
      if (csStats.isDirectory || csFile.isZipFile()) {
        return csFile.listFileAsync();
      }
      return new Promise(function (resolve) {
        resolve([]);
      });
    })
    .then(function (csFileList) {
      return filterByStatsAsync(csFileList);
    })
    .then(function (csFileList) {
      if (csFileList) {
        csFileList.forEach(csFile => {
          var element = createFileGridElement(csFile);
          if (element != null) {
            fileGridContainer.appendChild(element);
          }
        });
      }
    });
}

async function filterByStatsAsync(csFileList) {
  let filtered = [];
  if (csFileList) {
    var csFile;
    for (var i = 0; i < csFileList.length; i++) {
      csFile = csFileList[i];
      var stats = await csFile.fileStatsAsync();
      if (csFile.isHidden()) {
        continue;
      }
      if (stats.isDirectory || csFile.isZipFile() || csFile.isImageFile()) {
        filtered.push(csFile);
      }
    }
  }
  return filtered;
}

function createFileGridElement(csFile) {
  var imageLabel = document.createElement("div");
  imageLabel.className = "file-grid-imagelabel";
  imageLabel.textContent = csFile.basename();

  var image = document.createElement("img");
  image.id = "fileImageThumb";
  if (csFile.csStats.isDirectory) {
    image.src = "../res/img/folder_2.png";
  } else if (csFile.isZipFile()) {
    image.src = "../res/img/zip_mid.png";
  } else if (csFile.isImageFile()) {
    csFile.readFileAsync()
      .then(function (data) {
        image.src = "data:" + csFile.mimeType() + ";base64," + data;
      });
  }
  image.setAttribute("filepath", csFile.fullpath);

  var imageBox = document.createElement("div");
  imageBox.className = "file-grid-image";
  imageBox.setAttribute("filepath", csFile.fullpath);
  imageBox.appendChild(image);
  imageBox.onclick = imageBoxOnClick;
  imageBox.ondblclick = imageBoxOnDoubleClick;

  var fileBox = document.createElement("div");
  fileBox.className = "file-grid-filebox";

  fileBox.appendChild(imageBox);
  fileBox.appendChild(imageLabel);
  return fileBox;
}

function fileTreeOnClick(event, treeId, treeNode) {
  // console.log("onClick : " + event + ", treeId=" + treeId + ", node=" + treeNode.name);
  reloadFileGrid(treeNode.filepath);
}

function fileTreeBeforeExpand(treeId, treeNode) {
  // console.log("beforeExpand : treeId=" + treeId + ", node=" + treeNode.name);
  return true;
}

function fileTreeOnExpand(event, treeId, treeNode) {
  // console.log("onExpand : " + event + ", treeId=" + treeId + ", node=" + treeNode.name);
  appendFileNodeList(zTree, treeNode);
}

function fileTreeOnCollapse(event, treeId, treeNode) {
  // console.log("onCollapse : " + event + ", treeId=" + treeId + ", node=" + treeNode.name);
  removeFileNodeList(zTree, treeNode);
}

function imageBoxOnClick(event) {
  var image = event.target;
  var filepath = image.getAttribute("filepath");
  let csFile = new CsFile(filepath);
  if (csFile.isImageFile()) {
    csFile.readFileAsync()
      .then(function (data) {
        imagePreview.src = "data:" + csFile.mimeType() + ";base64," + data;
      });
  }
}

function imageBoxOnDoubleClick(event) {
  var image = event.target;
  var filepath = image.getAttribute("filepath");
  var csFile = new CsFile(filepath);
  if (csFile.isImageFile()) {
    var link = "file://" + __dirname + "/view.html?target=" + Buffer.from(filepath).toString("base64");
    openLink(link, !isDebug, isDebug);
  } else {
    reloadFileGrid(filepath);
  }
}

function backwardOnClick(event) {
  var csFile = new CsFile(currentFilePath);
  reloadFileGrid(csFile.getParentPath());
}