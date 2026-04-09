#!/bin/bash

echo "Installing dependencies..."
echo ""

# Install dependencies
npm install

# Verify installation
echo ""
echo "Verifying installation..."
node -e "
const os = require('os');
console.log('Platform:', os.platform());
console.log('Architecture:', os.arch());
"

echo ""
echo "Setup complete!"
