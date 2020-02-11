const os = require("os");
const fs = require("fs");
const path = require("path");

const rootDir = "/"; // os.platform() === 'win32' ? "" : "/";
const homeDir = path.resolve(os.homedir());

var zTree;
var treeSettings = {
  data: {
    keep: { parent: true }
  },
  callback: {
    onClick: fileTreeOnClick,
    beforeExpand: fileTreeBeforeExpand,
    onExpand: fileTreeOnExpand,
    onCollapse: fileTreeOnCollapse
  }
};
var treeNodeData = [{ name: "根目录", filepath: rootDir, children: [] }];

$(document).ready(function() {
  $.fn.zTree.init($("#fileTreeDemo"), treeSettings, treeNodeData);
  zTree = $.fn.zTree.getZTreeObj("fileTreeDemo");
  loadRootList(zTree);
});

function loadRootList(zTree) {
  var nodes = zTree.getNodes();
  appendFileNodeList(zTree, nodes[0]);
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
      if (name.startsWith(".")) {
        continue;
      }
      var subNode = { name: name, filepath: path.posix.join(folder, name), children: [] };
      nodeList.push(subNode);
    }
    zTree.addNodes(parentNode, nodeList);
    zTree.refresh();
  });
}

function removeFileNodeList(zTree, parentNode) {
  zTree.removeChildNodes(parentNode);
}

function fileTreeOnClick(event, treeId, treeNode) {
  console.log("onClick : " + event + ", treeId=" + treeId + ", node=" + treeNode.name);
}
function fileTreeBeforeExpand(treeId, treeNode) {
  console.log("beforeExpand : treeId=" + treeId + ", node=" + treeNode.name);
  return true;
}
function fileTreeOnExpand(event, treeId, treeNode) {
  console.log("onExpand : " + event + ", treeId=" + treeId + ", node=" + treeNode.name);
  appendFileNodeList(zTree, treeNode);
}
function fileTreeOnCollapse(event, treeId, treeNode) {
  console.log("onCollapse : " + event + ", treeId=" + treeId + ", node=" + treeNode.name);
  removeFileNodeList(zTree, treeNode);
}
