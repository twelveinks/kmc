//Bulk Import of Images
const fileInput = document.getElementById('inputGroupFile01');

//************* start on the file upload *****////
let fileList = [];
let collector = [];
let thumbnails = document.getElementsByClassName('img-container');

// ── DICOM Integration ────────────────────────────────────────────────────────
// Listen for images pushed from the Pentax EPK-i8020c via the PACS receiver.
// Each received image is loaded into the next empty thumbnail slot automatically.
(function setupDicomListener() {
    const { ipcRenderer } = require('electron');
    const fs = require('fs');

    ipcRenderer.on('dicom:image-received', (event, data) => {
        try {
            const nodePath = require('path');

            // Read the saved JPEG and convert to data URL
            const buffer  = fs.readFileSync(data.filePath);
            const dataUrl = 'data:image/jpeg;base64,' + buffer.toString('base64');

            // ── Save a copy to the patient-named folder ──────────────────────
            try {
                const settingsLib   = require('../lib/settings.js');
                const photoSavePath = settingsLib.get('photoSavePath');
                if (photoSavePath) {
                    const fn = document.getElementById('firstName');
                    const ln = document.getElementById('lastName');
                    const patientName = ((fn ? fn.value : '') + ' ' + (ln ? ln.value : '')).trim() || 'DICOM-Patient';
                    const patientDir  = nodePath.join(photoSavePath, patientName);
                    fs.mkdirSync(patientDir, { recursive: true });
                    const destFile = nodePath.join(patientDir, nodePath.basename(data.filePath));
                    if (!fs.existsSync(destFile)) fs.copyFileSync(data.filePath, destFile);
                }
            } catch (e) { console.warn('[DICOM] Could not copy to patient folder:', e.message); }

            // ── Auto-fill patient fields if still empty ──────────────────────
            const firstNameEl = document.getElementById('firstName');
            const lastNameEl  = document.getElementById('lastName');
            const patientNoEl = document.getElementById('patient_no');
            if (data.patientName && firstNameEl && !firstNameEl.value) {
                const parts = data.patientName.split('^'); // DICOM: LAST^FIRST
                if (lastNameEl)  lastNameEl.value  = parts[0] || '';
                if (firstNameEl) firstNameEl.value = parts[1] || '';
            }
            if (data.patientId && patientNoEl && !patientNoEl.value) {
                patientNoEl.value = data.patientId;
            }

            // ── Update status dot ────────────────────────────────────────────
            const dot        = document.getElementById('dicom-dot');
            const statusText = document.getElementById('dicom-status-text');
            const lastRecvEl = document.getElementById('dicom-last-received');
            if (dot)        dot.style.background = '#28a745';
            if (statusText) statusText.textContent = 'Image received!';
            if (lastRecvEl) lastRecvEl.textContent = 'Last: ' + new Date().toLocaleTimeString();
            setTimeout(() => {
                if (dot)        dot.style.background = '#aaa';
                if (statusText) statusText.textContent = 'Waiting for scope images…';
            }, 3000);

            // ── Gallery mode (modal is open in DICOM mode) ───────────────────
            // Add image to the gallery grid; doctor picks which ones to include on close.
            const dicomStandby = document.getElementById('dicom-standby');
            if (dicomStandby && dicomStandby.style.display !== 'none') {
                const grid     = document.getElementById('dicom-gallery-grid');
                const emptyMsg = document.getElementById('dicom-gallery-empty');
                if (emptyMsg) emptyMsg.remove();

                const item = document.createElement('div');
                item.className = 'dicom-gallery-item';
                item.dataset.src = dataUrl;
                item.style.cssText = 'display:flex;flex-direction:column;align-items:center;';
                const imgEl = document.createElement('img');
                imgEl.src = dataUrl;
                imgEl.style.cssText = 'width:100%;height:80px;object-fit:cover;border-radius:4px;border:2px solid #dee2e6;cursor:pointer;';
                imgEl.addEventListener('click', function () {
                    this.style.borderColor = this.style.borderColor === 'rgb(255, 153, 51)' ? '#dee2e6' : '#FF9933';
                });
                const label = document.createElement('label');
                label.style.cssText = 'font-size:0.72em;margin-top:3px;display:flex;align-items:center;gap:4px;cursor:pointer;';
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.className = 'dicom-include-cb';
                cb.checked = true;
                label.appendChild(cb);
                label.appendChild(document.createTextNode(' Include'));
                item.appendChild(imgEl);
                item.appendChild(label);
                if (grid) grid.appendChild(item);
                return; // Don't auto-fill slots yet — doctor picks on close
            }

            // ── Background mode (modal closed) → auto-fill thumbnail slots ───
            let slot = -1;
            for (let i = 0; i < thumbnails.length; i++) {
                const src = thumbnails[i].firstElementChild.src;
                if (!src || src.includes('noimage.jpg') || src === '') {
                    slot = i;
                    break;
                }
            }
            if (slot === -1) slot = thumbnails.length - 1;
            thumbnails[slot].firstElementChild.src = dataUrl;
            collector[slot] = dataUrl;

        } catch (err) {
            console.error('[DICOM] Error loading received image:', err.message);
        }
    });

    ipcRenderer.on('dicom:procedure-completed', (event, data) => {
        if (data.status === 'COMPLETED') {
            const proceed = window.confirm(
                'The scope procedure has been marked complete on the processor.\n\nReview and save the report now?'
            );
            if (proceed) {
                const submitBtn = document.getElementById('proceed');
                if (submitBtn) submitBtn.click();
            }
        }
    });
}());
// ────────────────────────────────────────────────────────────────────────────
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