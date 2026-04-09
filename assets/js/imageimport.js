//Bulk Import of Images
const fileInput = document.getElementById('inputGroupFile01');

//************* start on the file upload *****////
let fileList = [];
let collector = [];
let thumbnails = document.getElementsByClassName('img-container');
//adding a listener to the file upload button.
fileInput.addEventListener('change', function (event) {
    fileList = [];
    for (var i = 0; i < fileInput.files.length; i++) {
        if (fileInput.files[i].type == 'image/bmp' | fileInput.files[i].type == 'image/png' | fileInput.files[i].type == 'image/jpeg') {
            fileList.push(fileInput.files[i]);
            document.querySelector('.invalid-tooltip-11').style.display = "none";
        }
        else {
            document.querySelector('.invalid-tooltip-11').innerHTML = 'This image format is not supported, please use .jpg,.png or.bmp';
            document.querySelector('.invalid-tooltip-11').style.display = "block";
        }
    }

    if (fileList < 1) {
        for (i = 0; i < thumbnails.length; i++) {
            thumbnails[i].firstElementChild.src = '../assets/img/noimage.jpg';
        }
    }

    let k = 0;
    let processedCount = 0;
    const totalFiles = fileList.length;
    
    if (totalFiles === 0) {
        for (i = 0; i < thumbnails.length; i++) {
            thumbnails[i].firstElementChild.src = '../assets/img/noimage.jpg';
        }
        return;
    }
    
    // Upload without processing/cropping
    fileList.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            if (k < thumbnails.length) {
                thumbnails[k].firstElementChild.src = e.target.result;
                collector[k] = e.target.result;
            }
            k++;
            processedCount++;
            
            if (processedCount === totalFiles) {
                console.log('All images uploaded without cropping');
            }
        };
        reader.readAsDataURL(file);
    });
});


// Single import for images
const image1 = document.getElementById('importImageButton1');
const image2 = document.getElementById('importImageButton2');
const image3 = document.getElementById('importImageButton3');
const image4 = document.getElementById('importImageButton4');
const image5 = document.getElementById('importImageButton5');
const image6 = document.getElementById('importImageButton6');

const imageInput1 = document.getElementById('imageInput1');
const imageInput2 = document.getElementById('imageInput2');
const imageInput3 = document.getElementById('imageInput3');
const imageInput4 = document.getElementById('imageInput4');
const imageInput5 = document.getElementById('imageInput5');
const imageInput6 = document.getElementById('imageInput6');

// First Image Single import
image1.addEventListener('click', () => {
    imageInput1.click();
    upload_shortcut(imageInput1, 0)
});
// Second Image Single import
image2.addEventListener('click', () => {
    imageInput2.click();
    upload_shortcut(imageInput2, 1)
});
// Third Image Single import
image3.addEventListener('click', () => {
    imageInput3.click();
    upload_shortcut(imageInput3, 2)
});

// Fourth Image Single import
image4.addEventListener('click', () => {
    imageInput4.click();
    upload_shortcut(imageInput4, 3)
});

// Fifth Image Single import
image5.addEventListener('click', () => {
    imageInput5.click();
    upload_shortcut(imageInput5, 4)
});

// Sixth Image Single import
image6.addEventListener('click', () => {
    imageInput6.click();
    upload_shortcut(imageInput6, 5)
});

function upload_shortcut(imageinput, state) {
    imageinput.addEventListener('change', function (event) {
        if (imageinput.files[0] == undefined) {
            thumbnails[state].firstElementChild.src = '../assets/img/noimage.jpg';
        } else if (imageinput.files[0].type == 'image/bmp' | imageinput.files[0].type == 'image/png' | imageinput.files[0].type == 'image/jpeg') {
            selectedFile = event.target.files[0];
            
            // Upload without processing/cropping
            const reader = new FileReader();
            reader.onload = function(e) {
                thumbnails[state].firstElementChild.src = e.target.result;
                collector[state] = e.target.result;
            };
            reader.readAsDataURL(selectedFile);
        } else {
            document.querySelector('.invalid-tooltip-11').innerHTML = 'This image format is not supported, please use .jpg,.png or.bmp';
            document.querySelector('.invalid-tooltip-11').style.display = "block";
        }
    })
}