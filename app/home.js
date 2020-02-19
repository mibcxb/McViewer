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
  //filepath: rootDir,
  csFile: new CsFile(rootDir),
  children: []
}];

var editFilePath;
var imagePreview;
var fileGridContainer;
var currentFilePath;

let isDebug = false;
var isViewOpened = false;

$(document).ready(function () {
  $.fn.zTree.init($("#fileTreeDemo"), treeSettings, treeNodeData);
  zTree = $.fn.zTree.getZTreeObj("fileTreeDemo");
  editFilePath = document.getElementById("editFilePath");
  imagePreview = document.getElementById("fileImagePreview");
  fileGridContainer = document.getElementById("fileGridContainer");

  document.getElementById("btnBackward").onclick = backwardOnClick;

  loadRootList(zTree).then(function () {
    console.log('loadRootList done.')
  });
});

async function loadRootList(zTree) {
  var nodeList = zTree.getNodes();
  var parentNode = null;
  var parentPath = rootDir;

  var dirNames = homeDir.split("/");
  for (dirIdx in dirNames) {
    var filepath = path.posix.join(parentPath, dirNames[dirIdx]);
    for (subIdx in nodeList) {
      if (nodeList[subIdx].csFile.fullpath === filepath) {
        parentNode = nodeList[subIdx];
        parentPath = parentNode.csFile.fullpath;
        break;
      }
    }
    nodeList = await readFileList(zTree, parentNode);
  }
  zTree.refresh();

  reloadFileGrid(parentNode.csFile.fullpath);
}

async function readFileList(zTree, parentNode) {
  // 同步创建子节点列表
  var nodeList = [];
  var files = await parentNode.csFile.listFileAsync();
  for (index in files) {
    var csFile = files[index];
    var name = csFile.basename();
    var node = {
      name: name,
      csFile: csFile,
    };
    var treeNode = await createFileTreeNode(node);
    if (treeNode != null) {
      nodeList.push(treeNode);
    }
  }
  zTree.addNodes(parentNode, nodeList);
  return parentNode.children;
}

async function appendFileNodeList(zTree, parentNode) {
  var nodeList = [];
  var files = await parentNode.csFile.listFileAsync();
  for (index in files) {
    var csFile = files[index];
    var name = csFile.basename();
    var node = {
      name: name,
      csFile: csFile,
    };
    var treeNode = await createFileTreeNode(node);
    if (treeNode != null) {
      nodeList.push(treeNode);
    }
  }
  zTree.addNodes(parentNode, nodeList);
  zTree.refresh();
}

function removeFileNodeList(zTree, parentNode) {
  zTree.removeChildNodes(parentNode);
}

async function createFileTreeNode(node) {
  var csStats = null;
  try {
    csStats = await node.csFile.fileStatsAsync();
  } catch (err) {
    console.log(err);
  }
  if (csStats != null) {
    if (fsIsHidden(node.csFile.fullpath)) {
      return null;
    }
    if (csStats.isDirectory) {
      node.isParent = true;
      node.children = [];
      return node;
    } else if (node.csFile.isZipFile()) {
      node.isParent = false;
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
  createFileGrid(filepath).then(function () {
    console.log('createFileGrid done.');
  });
}

async function createFileGrid(filepath) {
  let csFile = new CsFile(filepath);
  var csStats = null;
  try {
    csStats = await csFile.fileStatsAsync();
  } catch (err) {
    console.log(err);
  }
  if (csStats != null) {
    var csFileList = null;
    if (csStats.isDirectory || csFile.isZipFile()) {
      csFileList = await csFile.listFileAsync();
    } else {
      csFileList = [];
    }
    if (csFileList != null) {
      csFileList = await filterByStatsAsync(csFileList);
      csFileList.forEach(csFile => {
        var element = createFileGridElement(csFile);
        if (element != null) {
          fileGridContainer.appendChild(element);
        }
      });
    }
  }
}

async function filterByStatsAsync(csFileList) {
  let filtered = [];
  if (csFileList) {
    var csFile;
    for (var i = 0; i < csFileList.length; i++) {
      csFile = csFileList[i];
      if (csFile.isHidden()) {
        continue;
      }
      var stats = null;
      try {
        stats = await csFile.fileStatsAsync();
      } catch (err) {
        console.log(err);
      }
      if (stats == null) {
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
  reloadFileGrid(treeNode.csFile.fullpath);
}

function fileTreeBeforeExpand(treeId, treeNode) {
  // console.log("beforeExpand : treeId=" + treeId + ", node=" + treeNode.name);
  return true;
}

function fileTreeOnExpand(event, treeId, treeNode) {
  // console.log("onExpand : " + event + ", treeId=" + treeId + ", node=" + treeNode.name);
  appendFileNodeList(zTree, treeNode).then(function () {
    console.log('appendFileNodeList done.')
  });
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
  if (isViewOpened) {
    return;
  }
  var image = event.target;
  var filepath = image.getAttribute("filepath");
  var csFile = new CsFile(filepath);
  if (csFile.isImageFile()) {
    var link = "file://" + __dirname + "/view.html?target=" + Buffer.from(filepath, "utf-8").toString("hex");
    openLink(link, !isDebug, isDebug, function () {
      isViewOpened = false;
    });
    isViewOpened = true;
  } else {
    reloadFileGrid(filepath);
  }
}

function backwardOnClick(event) {
  var csFile = new CsFile(currentFilePath);
  reloadFileGrid(csFile.getParentPath());
}