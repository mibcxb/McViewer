var imageBox;
var imagePreview;
var currentImgFile;
var imageFileArray = [];

let flipX = 0.3;
let flipY = 0.2;

$(document).ready(function () {
  imagePreview = document.getElementById("fileImagePreview");
  imageBox = document.getElementById("fileImageBox");
  imageBox.onclick = imageBoxOnClick;

  let imgUrl = new URL(window.location.href);
  let target = imgUrl.searchParams.get("target");
  let imgPath = Buffer.from(target, "hex").toString("utf-8");
  currentImgFile = new CsFile(imgPath);
  if (currentImgFile.isImageFile()) {
    reloadImageFile();
  }

  prepareImageFileArray(currentImgFile);

  Mousetrap.bind("left", function () {
    flipImageTo(-1);
  });
  Mousetrap.bind("right", function () {
    flipImageTo(1);
  });
});

function reloadImageFile() {
  currentImgFile.readFileAsync()
    .then(function (data) {
      imagePreview.src = "data:" + currentImgFile.mimeType() + ";base64," + data;
    });
}

function prepareImageFileArray(csFile) {
  let parentFile = csFile.getParentFile();
  parentFile.listFileAsync()
    .then(function (csFileList) {
      return filterByStatsAsync(csFileList);
    })
    .then(function (csFileList) {
      imageFileArray = csFileList;
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
      if (csFile.isImageFile()) {
        filtered.push(csFile);
      }
    }
  }
  return filtered;
}

function imageBoxOnClick(event) {
  console.log(event);

  let clientW = document.documentElement.clientWidth;
  let clientH = document.documentElement.clientHeight;

  if (event.clientY > clientH * (1 - flipY)) {
    if (event.clientX < clientW * flipX) {
      // 前一页
      flipImageTo(-1);
      return;
    } else if (event.clientX > clientW * (1 - flipX)) {
      // 后一页
      flipImageTo(1);
      return;
    }
  }

  if (event.target.tagName === "IMG") {
    if (imageBox.className === "image-fullsize") {
      imageBox.className = "image-preview";
    } else if (imageBox.className === "image-preview") {
      imageBox.className = "image-fullsize";
    }
  }
}

function flipImageTo(to) {
  var curIdx = currentIndex();
  if (curIdx === -1) {
    return;
  }

  var imgIdx = curIdx + to;
  if (0 <= imgIdx && imgIdx < imageFileArray.length) {
    currentImgFile = imageFileArray[imgIdx];
    reloadImageFile();
  }
}

function currentIndex() {
  var imgFileIndex = -1;
  for (var idx = 0; idx < imageFileArray.length; idx++) {
    if (currentImgFile.fullpath === imageFileArray[idx].fullpath) {
      imgFileIndex = idx;
      break;
    }
  }
  return imgFileIndex;
}