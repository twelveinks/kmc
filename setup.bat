@echo off
echo Installing dependencies...
echo.

REM Install dependencies
call npm install

REM Verify installation
echo.
echo Verifying installation...
node -e "const os = require('os'); console.log('Platform:', os.platform()); console.log('Architecture:', os.arch());"

echo.
echo Setup complete!
pause
