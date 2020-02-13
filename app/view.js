var imagePreview;
var currentFilePath;

$(document).ready(function () {
    imagePreview = document.getElementById('fileImagePreview');

    let imgUrl = new URL(window.location.href);
    let target = imgUrl.searchParams.get('target');
    let decode = Buffer.from(target, 'base64').toString('utf-8');
    imagePreview.src = decode;
});