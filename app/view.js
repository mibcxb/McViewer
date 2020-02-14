var imageBox;
var imagePreview;
var currentImgPath;
var imageFileArray = [];

let flipX = 0.3;
let flipY = 0.2;

$(document).ready(function() {
  imagePreview = document.getElementById("fileImagePreview");
  imageBox = document.getElementById("fileImageBox");
  imageBox.onclick = imageBoxOnClick;

  let imgUrl = new URL(window.location.href);
  let target = imgUrl.searchParams.get("target");
  currentImgPath = Buffer.from(target, "base64").toString("utf-8");
  imagePreview.src = currentImgPath;

  prepareImageFileArray(path.posix.dirname(currentImgPath));

  Mousetrap.bind("left", function() {
    flipImageTo(-1);
  });
  Mousetrap.bind("right", function() {
    flipImageTo(1);
  });
});

function prepareImageFileArray(filepath) {
  if (fsIsDirectory(filepath)) {
    let folder = filepath;
    fs.readdir(folder, (err, files) => {
      if (err !== null) {
        console.log(err);
        return;
      }

      for (index in files) {
        var name = files[index];
        var imageFilePath = path.posix.join(folder, name);
        if (fsIsImage(imageFilePath)) {
          imageFileArray.push(imageFilePath);
        }
      }
    });
  }
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
  var imgIdx = imageFileArray.indexOf(currentImgPath) + to;
  if (0 <= imgIdx && imgIdx < imageFileArray.length) {
    currentImgPath = imageFileArray[imgIdx];
    imagePreview.src = currentImgPath;
  }
}
