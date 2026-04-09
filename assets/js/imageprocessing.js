/**
 * Image Processing Functions
 * Includes black section cropping for scope machine images
 */
/**
 * Crops black sections from scope machine images
 * @param {HTMLImageElement} image - The image element to process
 * @param {number} blackThreshold - Threshold for what's considered "black" (0-255)
 * @returns {string} - Data URL of the cropped image
 */
function cropBlackSections(image, blackThreshold = 30) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set canvas size to image size
    canvas.width = image.naturalWidth || image.width;
    canvas.height = image.naturalHeight || image.height;
    
    // Draw image to canvas
    ctx.drawImage(image, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let minX = canvas.width;
    let maxX = -1;
    
    // Find non-black boundaries (only for left and right)
    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;
            const r = data[index];
            const g = data[index + 1];
            const b = data[index + 2];
            
            // Check if pixel is not black (above threshold)
            if (r > blackThreshold || g > blackThreshold || b > blackThreshold) {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
            }
        }
    }
    
    // If no non-black pixels found, return original
    if (maxX === -1) {
        return canvas.toDataURL('image/png');
    }
    
    // Add additional left crop of 82px
    const additionalLeftCrop = 82;
    minX = Math.min(minX + additionalLeftCrop, canvas.width - 1);
    
    // Leave a small margin of black pixels visible on left and right sides
    const marginSize = 1;
    
    // Adjust boundaries to leave black margin visible (only horizontal)
    minX = Math.max(0, minX - marginSize);
    maxX = Math.min(canvas.width - 1, maxX + marginSize);
    
    // Crop top and bottom by a small percentage
    const verticalCropPercentage = 0.10; // 5% crop from top and bottom
    const verticalCropAmount = Math.floor(canvas.height * verticalCropPercentage);
    
    const minY = verticalCropAmount;
    const maxY = canvas.height - 1 - verticalCropAmount;
    
    console.log('Crop boundaries - minX:', minX, 'maxX:', maxX, 'minY:', minY, 'maxY:', maxY);
    console.log('Vertical crop amount:', verticalCropAmount, 'pixels from top and bottom');
    
    // Ensure we still have a valid crop area after adjustment
    if (minX >= maxX) {
        minX = Math.max(0, maxX - 50); // Fallback to at least 50px width
    }
    
    // Calculate crop dimensions
    const cropWidth = maxX - minX + 1;
    const cropHeight = maxY - minY + 1;
    
    console.log('Cropped size:', cropWidth, 'x', cropHeight);
    console.log('Original height:', canvas.height, 'New height:', cropHeight, 'Removed:', canvas.height - cropHeight);
    
    // Create new canvas for cropped image
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');
    
    croppedCanvas.width = cropWidth;
    croppedCanvas.height = cropHeight;
    
    // Draw cropped section
    croppedCtx.drawImage(
        canvas, 
        minX, minY, cropWidth, cropHeight,  // Source rectangle
        0, 0, cropWidth, cropHeight         // Destination rectangle
    );
    
    return croppedCanvas.toDataURL('image/png');
}

/**
 * Processes an image file and applies black section cropping
 * @param {File} file - The image file to process
 * @param {Function} callback - Callback function with processed image data URL
 */
function processImageFile(file, callback) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        
        img.onload = function() {
            const processedDataUrl = cropBlackSections(img);
            callback(processedDataUrl);
        };
        
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

/**
 * Processes an image from a data URL
 * @param {string} dataUrl - The image data URL to process
 * @param {Function} callback - Callback function with processed image data URL
 */
function processImageDataUrl(dataUrl, callback) {
    const img = new Image();
    
    img.onload = function() {
        const processedDataUrl = cropBlackSections(img);
        callback(processedDataUrl);
    };
    
    img.src = dataUrl;
}

/**
 * Auto-process images when they're loaded into containers
 * @param {HTMLImageElement} imgElement - The image element that was just loaded
 */
function autoProcessScopeImage(imgElement) {
    // Only process if the image source looks like it might be from a scope
    // (you can adjust this logic based on your specific needs)
    if (imgElement.src && !imgElement.src.includes('noimage.jpg')) {
        processImageDataUrl(imgElement.src, function(processedDataUrl) {
            imgElement.src = processedDataUrl;
        });
    }
}