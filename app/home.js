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

$(document).ready(function () {
  $.fn.zTree.init($("#fileTreeDemo"), treeSettings, treeNodeData);
  zTree = $.fn.zTree.getZTreeObj("fileTreeDemo");
  editFilePath = document.getElementById('editFilePath');
  imagePreview = document.getElementById('fileImagePreview');
  fileGridContainer = document.getElementById('fileGridContainer');

  document.getElementById('btnBackward').onclick = backwardOnClick;

  loadRootList(zTree);
});

function loadRootList(zTree) {
  var nodes = zTree.getNodes();
  var rootNode = nodes[0];
  appendFileNodeList(zTree, rootNode);
  reloadFileGrid(rootNode.filepath);
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
  if (fsIsDirectory(currentFilePath)) {
    // 创建文件列表
    createFolderGrid(currentFilePath);
  } else if (fsIsFile(currentFilePath)) {
    // 显示压缩文件中的文件
  }
}

function createFolderGrid(folder) {
  fs.readdir(folder, (err, files) => {
    if (err !== null) {
      console.log(err);
      return;
    }

    for (index in files) {
      var name = files[index];
      var filepath = path.posix.join(folder, name)
      var fileBoxElement = createFileBoxElement(filepath);
      if (fileBoxElement == null) {
        continue;
      }
      fileGridContainer.appendChild(fileBoxElement);
    }
  });
}

function createFileBoxElement(filepath) {
  if (fsIsHidden(filepath)) {
    return null;
  }
  var basename = path.posix.basename(filepath);

  var imageLabel = document.createElement('div');
  imageLabel.className = "file-grid-imagelabel";
  imageLabel.textContent = basename;

  var image = document.createElement('img');
  image.id = "fileImageThumb";
  if (fsIsDirectory(filepath)) {
    image.src = "../res/img/folder.png";
  } else if (fsIsImage(filepath)) {
    image.src = filepath;
  } else {
    return null;
  }
  image.setAttribute("filepath", filepath);

  var imageBox = document.createElement('div');
  imageBox.className = "file-grid-image";
  imageBox.setAttribute("filepath", filepath);
  imageBox.appendChild(image);
  imageBox.onclick = imageBoxOnClick;
  imageBox.ondblclick = imageBoxOnDoubleClick;

  var fileBox = document.createElement('div');
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
  if (fsIsImage(filepath)) {
    imagePreview.src = filepath;
  }
}

function imageBoxOnDoubleClick(event) {
  var image = event.target;
  var filepath = image.getAttribute("filepath");
  if (fsIsImage(filepath)) {
    var link = "file://" + __dirname + "/view.html?target=" + Buffer.from(filepath).toString('base64');
    openLink(link);
  } else if (fsIsDirectory(filepath)) {
    reloadFileGrid(filepath);
  }
}

function backwardOnClick(event) {
  var parentPath = path.posix.dirname(currentFilePath);
  reloadFileGrid(parentPath);
}