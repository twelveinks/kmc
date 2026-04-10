//import a few js'
const fs = require('fs');
var path = require('path');
const video = document.getElementById('video');
const cameraView = document.getElementById('camera-view');
const button = document.getElementById('camera_button');
const cameraBody= document.getElementById('camerabody');
const cameraContent = document.getElementById('camera-content');
const cameraDialog  = document.getElementById('camera-dialog');
const select = document.getElementById('select');
// const capture = document.getElementById('capture');
let cameraRadioL = document.getElementById('cameraRadio1');
let cameraRadioS = document.getElementById('cameraRadio2');

let currentStream;
var canvas = null;
var photo = null;
var startbutton = null;
var data = null;
var homeDir = require('os').homedir();

// Validation: Enable camera button only when patient info is filled
function validatePatientInfo() {
  const firstName = document.getElementById('firstName');
  const lastName = document.getElementById('lastName');
  const patientNo = document.getElementById('patient_no');
  const cameraWarning = document.getElementById('camera-warning');
  
  if (firstName && lastName && patientNo) {
    const isValid = firstName.value.trim() !== '' && 
                    lastName.value.trim() !== '' && 
                    patientNo.value.trim() !== '';
    
    button.disabled = !isValid;
    
    if (isValid) {
      button.title = 'Click to open camera';
      if (cameraWarning) cameraWarning.style.display = 'none';
    } else {
      button.title = 'Please enter patient information first';
      if (cameraWarning) cameraWarning.style.display = 'block';
    }
  }
}

// Add event listeners to patient info fields
document.addEventListener('DOMContentLoaded', function() {
  const firstName = document.getElementById('firstName');
  const lastName = document.getElementById('lastName');
  const patientNo = document.getElementById('patient_no');
  
  if (firstName) firstName.addEventListener('input', validatePatientInfo);
  if (lastName) lastName.addEventListener('input', validatePatientInfo);
  if (patientNo) patientNo.addEventListener('input', validatePatientInfo);
  
  // Run validation on page load
  validatePatientInfo();
});

// camera to enlarge screen and decrease screen
cameraRadioL.addEventListener('change', () => {
  if (cameraRadioL.checked) {
    cameraDialog.classList.remove('camera-small');
    cameraDialog.classList.add('camera-large');
    cameraBody.style.height = '80vh';
  }
});

cameraRadioS.addEventListener('change', () => {
  if (cameraRadioS.checked) {
    cameraDialog.classList.remove('camera-large');
    cameraDialog.classList.add('camera-small');
    cameraBody.style.height = '400px';
  }
});

const settings = require('../lib/settings.js');

var folders = {};
folders.baseDir = settings.get('photoSavePath');
folders.create = function (name, data, callback) {
  // converting blob data before use
  // var filename='myimage.png';
  var block = data.split(";");
  var contentType = block[0].split(":")[1];
  // get the real base64 content of the file
  var realData = block[1].split(",")[1];
  var blob = b64toBlob(realData, contentType);
  var filename = 'image.png';
  var blobs = blob;
  function toArrayBuffer(blobs, cb) {
    let fileReader = new FileReader();
    fileReader.onload = function () {
      let arrayBuffer = this.result;
      cb(arrayBuffer);
    };
    fileReader.readAsArrayBuffer(blob);
  }

  function toBuffer(ab) {
    let buffer = new Buffer.alloc(ab.byteLength);
    let arr = new Uint8Array(ab);
    for (let i = 0; i < arr.byteLength; i++) {
      buffer[i] = arr[i];
    }
    return buffer;
  }

  //creating the new location depending on the users name............................
  var dir = path.join(folders.baseDir, '/', name);
  if (folders.baseDir) {
    fs.mkdir(dir, { recursive: true }, (err) => {
      if (err) {
        toArrayBuffer(blobs, function (ab) {
          var buffer = toBuffer(ab);
          var date = new Date().toUTCString().replace(/[^\d\/]/g, '');
          var filelabel = 'img ' + date + '.png';
          console.log(filelabel);
          var filename = filelabel
          var file = folders.baseDir + '/' + name + '/' + filelabel;
          fs.writeFile(file, buffer, function (err) {
            if (err) {
              console.error('Failed to save image ' + err);
            } else {
              console.log('Saved image: ' + file);
            }
          });
        });
      } else {
        toArrayBuffer(blobs, function (ab) {
          var buffer = toBuffer(ab);
          var date = new Date().toUTCString().replace(/[^\d\/]/g, '');
          var filelabel = 'img ' + date + '.png';
          console.log(filelabel);
          var filename = filelabel
          var file = folders.baseDir + '/' + name + '/' + filelabel;
          fs.writeFile(file, buffer, function (err) {
            if (err) {
              console.error('Failed to save image ' + err);
            } else {
              console.log('Saved image: ' + file);
            }
          });
        });
      }
    });
  } else {
    fs.mkdir(dir, { recursive: true }, (err) => {
      if (err) {
        console.log('Error creating new folder' + err);
      } else {
        toArrayBuffer(blobs, function (ab) {
          var buffer = toBuffer(ab);
          var date = new Date().toUTCString().replace(/[^\d\/]/g, '');
          var filelabel = 'img ' + date + '.png';
          console.log(filelabel);
          var filename = filelabel
          var file = folders.baseDir + '/' + name + '/' + filelabel;
          fs.writeFile(file, buffer, function (err) {
            if (err) {
              console.error('Failed to save image ' + err);
            } else {
              console.log('Saved image: ' + file);
            }
          });
        });
      }
    });
  }
}
function stopMediaTracks(stream) {
  stream.getTracks().forEach(track => {
    track.stop();
  });
}

// Add event listener for modal closing
document.getElementById('exampleModal').addEventListener('hidden.bs.modal', function (e) {
  // Reset DICOM standby panel back to hidden
  const dicomStandby = document.getElementById('dicom-standby');
  const captureBtnWrap = document.getElementById('capture-btn-wrap');
  const cameraViewEl = document.getElementById('camera-view');
  const modalLabel = document.getElementById('exampleModalLabel');
  if (dicomStandby) dicomStandby.style.display = 'none';
  if (captureBtnWrap) captureBtnWrap.style.display = '';
  if (cameraViewEl) cameraViewEl.style.display = 'block';
  if (modalLabel) modalLabel.textContent = 'Camera';

  if (typeof currentStream !== 'undefined') {
    stopMediaTracks(currentStream);
    video.srcObject = null;
    currentStream = undefined;
  }
});

function gotDevices(mediaDevices) {
  select.innerHTML = '';
  select.appendChild(document.createElement('option'));
  let count = 1;
  mediaDevices.forEach(mediaDevice => {
    if (mediaDevice.kind === 'videoinput') {
      const option = document.createElement('option');
      option.value = mediaDevice.deviceId;
      const label = mediaDevice.label || `Camera ${count++}`;
      const textNode = document.createTextNode(label);  
      option.appendChild(textNode);
      select.appendChild(option);
      
    }
  });
  select.remove(0);
  // Append DICOM option if enabled in settings
  try {
    const settings = require('../../lib/settings.js');
    if (settings.get('dicomEnabled')) {
      const dicomOpt = document.createElement('option');
      dicomOpt.value = '__dicom__';
      dicomOpt.textContent = 'DICOM — Pentax EPK-i8020c';
      select.appendChild(dicomOpt);
    }
  } catch (e) { /* settings unavailable */ }
}
button.addEventListener('click', event => {
  // DICOM mode — skip webcam entirely, show standby panel
  if (select.value === '__dicom__') {
    if (typeof currentStream !== 'undefined') {
      stopMediaTracks(currentStream);
      video.srcObject = null;
      currentStream = undefined;
    }
    const cameraViewEl = document.getElementById('camera-view');
    const captureBtnWrap = document.getElementById('capture-btn-wrap');
    const dicomStandby = document.getElementById('dicom-standby');
    const modalLabel = document.getElementById('exampleModalLabel');
    if (cameraViewEl) cameraViewEl.style.display = 'none';
    if (captureBtnWrap) captureBtnWrap.style.display = 'none';
    if (dicomStandby) dicomStandby.style.display = 'block';
    if (modalLabel) modalLabel.textContent = 'DICOM Capture — Pentax EPK-i8020c';
    return;
  }

  if (typeof currentStream !== 'undefined') {
    stopMediaTracks(currentStream);
  }
  const videoConstraints = {};
  if (select.value === '') {
    videoConstraints.facingMode = 'environment';
  } else {
    videoConstraints.deviceId = { exact: select.value };
  }
  const constraints = {
    video: videoConstraints,
    audio: false
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(stream => {
      currentStream = stream;
      video.srcObject = stream;
      return navigator.mediaDevices.enumerateDevices();
    })
    .then(gotDevices)
    .catch(error => {
      console.error(error);
    });
});

navigator.mediaDevices.enumerateDevices().then(gotDevices);

(function () {
  // The width and height of the captured photo. We will set the
  // width to the value defined here, but the height will be
  // calculated based on the aspect ratio of the input stream.

  var width = 320;    // We will scale the photo width to this
  var height = 0;     // This will be computed based on the input stream

  // |streaming| indicates whether or not we're currently streaming
  // video from the camera. Obviously, we start at false.

  var streaming = false;

  // The various HTML elements we need to configure or control. These
  // will be set by the startup() function.

  // var video = null;
  // var canvas = null;
  // var photo = null;
  // var startbutton = null;

  function startup() {
    canvas = document.getElementById('canvas');
    photo = document.getElementById('photo');
    startbutton = document.getElementById('capture');

    //   navigator.mediaDevices.getUserMedia({video: true, audio: false})
    //   .then(function(stream) {
    //     video.srcObject = stream;
    //     video.play();
    //   })
    //   .catch(function(err) {
    //     console.log("An error occurred: " + err);
    //   });

    video.addEventListener('canplay', function (ev) {
      if (!streaming) {
        height = video.videoHeight / (video.videoWidth / width);

        // Firefox currently has a bug where the height can't be read from
        // the video, so we will make assumptions if this happens.

        if (isNaN(height)) {
          height = width / (4 / 3);
        }

        //   video.setAttribute('width', width);
        //   video.setAttribute('height', height);
        canvas.setAttribute('width', width);
        canvas.setAttribute('height', height);
        streaming = true;
      }
    }, false);

    startbutton.addEventListener('click', function (ev) {
      takepicture();
      ev.preventDefault();
    }, false);
    clearphoto();
  }

  // Fill the photo with an indication that none has been
  // captured.

  function clearphoto() {
    var context = canvas.getContext('2d');
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);

    data = canvas.toDataURL('image/png');
    photo.setAttribute('src', data);
    console.log('clearphoto' + data);
  }

  // Capture a photo by fetching the current contents of the video
  // and drawing it into a canvas, then converting that to a PNG
  // format data URL. By drawing it on an offscreen canvas and then
  // drawing that to the screen, we can change its size and/or apply
  // other changes before drawing it.

  function takepicture() {
    var firstname = document.getElementById('firstName').value;
    var lastname= document.getElementById('lastName').value;
    var patientno=document.getElementById('patient_no').value;
    
    // Safety check: Prevent taking photos without patient information
    if (!firstname.trim() || !lastname.trim() || !patientno.trim()) {
      alert('Please enter patient information (First Name, Last Name, and Patient Number) before taking photos.');
      return;
    }
    
    var foldername=firstname+' '+lastname+' '+patientno; 
    var context = canvas.getContext('2d');
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);
      data = canvas.toDataURL('image/png');
      
      // Process the captured image to crop black sections
      processImageDataUrl(data, function(processedDataUrl) {
        photo.setAttribute('src', processedDataUrl);
        // Store the processed image data
        data = processedDataUrl;
        folders.create(foldername, data, 'err');
      });

    } else {
      clearphoto();
    }
  }

  // Set up our event listener to run the startup process
  // once loading is complete.
  window.addEventListener('load', startup, false);
})();
//   function blobToFile(theBlob, fileName){
//     //A Blob() is almost a File() - it's just missing the two properties below which we will add
//     theBlob.lastModifiedDate = new Date();
//     theBlob.name = fileName;
//     return theBlob;
// }
//this to convert base64 string to blob
function b64toBlob(b64Data, contentType, sliceSize) {
  contentType = contentType || '';
  sliceSize = sliceSize || 512;

  var byteCharacters = atob(b64Data);
  var byteArrays = [];

  for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    var slice = byteCharacters.slice(offset, offset + sliceSize);

    var byteNumbers = new Array(slice.length);
    for (var i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }

    var byteArray = new Uint8Array(byteNumbers);

    byteArrays.push(byteArray);
  }

  var blob = new Blob(byteArrays, { type: contentType });
  return blob;
}
document.getElementById('photo').addEventListener('click',function(err){
  const currentPath = settings.get('photoSavePath');
  if(!err && fs.existsSync(currentPath)){
    window.open(currentPath);
  } else {
    alert('Cannot open photos directory. Please check the save location in Preferences.');
  }
});