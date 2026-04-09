const sharp = require('sharp');
const path = require('path');

const inputPath = path.join(__dirname, 'assets', 'img', 'appicon.png');
const outputPath = path.join(__dirname, 'assets', 'img', 'appicon-256.png');

sharp(inputPath)
  .resize(256, 256)
  .toFile(outputPath)
  .then(() => console.log('Icon resized successfully'))
  .catch(err => console.error('Error resizing icon:', err));