const path = require('path');
const glob = require('glob');
const fs = require('fs');
const { app, BrowserWindow, ipcMain, dialog, Menu, screen } = require('electron');
const electronRemote = require('@electron/remote/main');

// Initialize electron remote
electronRemote.initialize();

// Create minimal application menu
const template = [
  {
    label: 'File',
    submenu: [
      {
        label: 'Preferences',
        accelerator: process.platform === 'darwin' ? 'Cmd+,' : 'Ctrl+,',
        click() {
          let prefsWindow = new BrowserWindow({
            width: 800,
            height: 600,
            modal: true,
            parent: BrowserWindow.getFocusedWindow(),
            webPreferences: {
              nodeIntegration: true,
              contextIsolation: false,
              enableRemoteModule: true,
              webSecurity: false,
              sandbox: false // Required for @electron/remote
            }
          });

          // Enable remote module for this window
          electronRemote.enable(prefsWindow.webContents);

          // Set up error handling
          prefsWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            console.error('Failed to load preferences:', errorCode, errorDescription);
          });

          prefsWindow.setMenu(null);
          const prefsPath = path.join(getAppPath(), 'sections/preferences.html');
          prefsWindow.loadURL('file://' + prefsPath);
        }
      },
      { type: 'separator' },
      { role: 'quit' }
    ]
  }
];

// Add empty menu item on macOS to get standard macOS app menu
if (process.platform === 'darwin') {
  template.unshift({
    label: app.getName(),
    submenu: [
      { role: 'about' },
      { type: 'separator' },
      { role: 'hide' },
      { role: 'hideothers' },
      { role: 'unhide' },
      { type: 'separator' },
      { role: 'quit' }
    ]
  });
}

// Set application name
const appName = 'Med Scope Report';
if (process.mas) {
  app.setName(appName);
} else {
  app.setName(appName);
}
app.setAppUserModelId(appName); // For Windows notifications
let mainWindow = null

// Get the correct app root path whether in development or production
function getAppPath() {
  let appPath;
  if (process.type === 'renderer') {
    appPath = require('@electron/remote').app.getAppPath();
  } else {
    // For the main process
    appPath = app.isPackaged ? path.join(process.resourcesPath, 'app.asar') : __dirname;
  }



  return appPath;
}

function initialize() {
  makeSingleInstance()

  loadDemos()

  function createWindow() {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    var iconpath = path.join(getAppPath(), 'assets/img/65x65.png');
    const windowOptions = {
      width: width,
      minWidth: 1100,
      height: height,
      minHeight: 700,
      icon: iconpath,
      title: app.getName(),
      frame: true,
      show: false, // Don't show until ready
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        enableRemoteModule: true,
        webSecurity: false, // Allow loading local resources
        sandbox: false // Required for @electron/remote
      }
    }

    if (process.platform === 'linux') {
      windowOptions.icon = path.join(__dirname, '/assets/app-icon/png/512.png');
    }

    mainWindow = windows.main = new BrowserWindow(windowOptions);
    require('@electron/remote/main').enable(mainWindow.webContents);



    // Add keyboard shortcuts for window management
    const localShortcut = require('electron-localshortcut');

    localShortcut.register(mainWindow, 'F11', () => {
      const isFullScreen = mainWindow.isFullScreen();
      mainWindow.setFullScreen(!isFullScreen);
    });

    localShortcut.register(mainWindow, 'Esc', () => {
      if (mainWindow.isFullScreen()) {
        mainWindow.setFullScreen(false);
      }
    });
    // Load the index page which handles templates
    const indexPath = path.join(getAppPath(), 'index.html');
    console.log('Loading initial page from:', indexPath);

    mainWindow.loadURL(`file://${indexPath}`);

    // Add error handler for page load failures
    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error('Failed to load page:', errorCode, errorDescription);
      console.log('Failed URL:', event.sender.getURL());
    });

    // Show window when ready to prevent white flash
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
    });

    mainWindow.on('closed', () => {
      mainWindow = windows.main = null;
    })
  }

  app.on('ready', () => {
    // Set the application menu for Windows and Linux
    if (process.platform !== 'darwin') {
      const menu = Menu.buildFromTemplate(template);
      Menu.setApplicationMenu(menu);
    }
    createWindow()
  })
  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
  })

  app.on('activate', () => {
    if (mainWindow === null) {
      createWindow()
    }
  })

  // Handle login success and open main window
  // ipcMain.on('openMainWindow', (event, username) => {
  //   console.log('Opening main window for user:', username);
  //   if (mainWindow) {
  //     mainWindow.loadURL(path.join('file://', __dirname, 'sections/dashboard.html'));
  //     mainWindow.webContents.once('did-finish-load', () => {
  //       mainWindow.webContents.send('user-data', username);
  //     });
  //   }
  // });
}

function makeSingleInstance() {
  if (process.mas) return

  app.requestSingleInstanceLock()

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

function loadDemos() {
  const files = glob.sync(path.join(__dirname, 'main-process/**/*.js'))
  files
    .filter(file => !file.includes('menus/application-menu.js')) // Exclude the menu file
    .forEach((file) => { require(file) })
}

// Handle opening sections from settings
ipcMain.on('openSection', (event, section) => {
  const sectionWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false // Allow loading local resources
    }
  });
  require('@electron/remote/main').enable(sectionWindow.webContents);

  sectionWindow.setMenu(null);
  sectionWindow.loadURL('file://' + path.join(getAppPath(), 'sections', `${section}.html`));
});

// Store form data temporarily (global scope)
global.tempFormData = null;

// Handle preview data
ipcMain.on('preview-form', (event, formData) => {
  global.tempFormData = formData;
  console.log('Stored temp form data');
});

// Handle abort preview
ipcMain.on('abort-preview', (event) => {
  if (global.tempFormData) {
    event.reply('restore-form-data', global.tempFormData);
    global.tempFormData = null;
  }
});

// Get user information for any window that needs it
ipcMain.on('getUserNames', (event) => {
  console.log('getUserNames called, currentUser:', global.currentUser);
  if (global.currentUser) {
    if (global.currentUser.firstName && global.currentUser.lastName) {
      const fullName = global.currentUser.firstName + ' ' + global.currentUser.lastName;
      event.reply('username', fullName);
      console.log('Sending username:', fullName);
    } else {
      console.error('Invalid user data structure:', global.currentUser);
      event.reply('username', '');
    }
  } else {
    console.error('No current user found');
    event.reply('username', '');
  }
});// Get doctor's name for report
ipcMain.on('get-doctor-name', (event) => {
  if (global.currentUser) {
    event.reply('doctor-name', global.currentUser.firstName + ' ' + global.currentUser.lastName);
  }
});

// Handle opening report windows
let reportWindows = {};

ipcMain.on('open-report-window', (event, { type, data, htmlFile }) => {
  const reportWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    modal: true,
    show: true,
    parent: mainWindow,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      webSecurity: false // Allow loading local resources
    }
  });
  require('@electron/remote/main').enable(reportWindow.webContents);

  reportWindow.setMenu(null);
  reportWindow.loadURL('file://' + path.join(getAppPath(), 'sections', htmlFile));

  // Store reference
  reportWindows[reportWindow.id] = reportWindow;

  reportWindow.webContents.on('did-finish-load', () => {
    reportWindow.webContents.send('insert-data', data);
  });

  reportWindow.on('closed', () => {
    delete reportWindows[reportWindow.id];
  });
});

// Handle EndoReport event from report window
ipcMain.on('EndoReport', async (event, result) => {
  const webContents = event.sender;
  const reportWindow = BrowserWindow.fromWebContents(webContents);

  if (reportWindow && !reportWindow.isDestroyed()) {
    try {
      const settings = require('./lib/settings.js');
      const fs = require('fs');
      const path = require('path');
      // Use the report save path from settings
      const reportPath = settings.get('reportSavePath');
      const dist = path.join(reportPath, result + '.pdf');

      // Ensure directory exists
      const dir = path.dirname(dist);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Hide confirmation buttons before generating PDF
      await webContents.executeJavaScript(`
        document.getElementById('confirmationButtons').style.display = 'none';
      `);

      // Wait a bit for the DOM to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Generate PDF
      const data = await webContents.printToPDF({
        marginsType: 1,
        printBackground: true,
        printSelectionOnly: false,
        landscape: false,
        // pageSize: 'Letter'
      });

      // Show buttons again
      await webContents.executeJavaScript(`
        document.getElementById('confirmationButtons').style.display = 'block';
      `);

      // Check if file exists
      if (fs.existsSync(dist)) {
        const response = dialog.showMessageBoxSync(reportWindow, {
          type: 'warning',
          buttons: ['Overwrite', 'Cancel'],
          defaultId: 1,
          title: 'File Exists',
          message: 'This file already exists. Do you want to overwrite it?'
        });

        if (response === 1) { // Cancel
          return;
        }
      }

      // Write PDF file and save to reports store
      const { savePDFAndRecord } = require('./lib/report-helpers');
      const saved = await savePDFAndRecord(event, dist, data, { firstName: result }, 'endoscopy', 'Endoscopy Report');

      if (saved && reportWindow && !reportWindow.isDestroyed()) {
        // Delay closing the window slightly to ensure message box is handled
        setTimeout(() => {
          if (reportWindow && !reportWindow.isDestroyed()) {
            reportWindow.close();
          }
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.reload();
          }
        }, 100);
      }

    } catch (error) {
      console.error('PDF generation error:', error);
      dialog.showErrorBox('Error', 'Failed to generate PDF: ' + error.message);
    }
  }
});

// Handle Abort event from report window
ipcMain.on('Abort', (event) => {
  const webContents = event.sender;
  const win = BrowserWindow.fromWebContents(webContents);

  // Find the parent window that contains the form
  const formWindow = BrowserWindow.getAllWindows().find(window => {
    const url = window.webContents.getURL();
    return url.includes('checksCreate.html');
  });

  // Send signal to restore form data if we found the window
  if (formWindow && !formWindow.isDestroyed() && global.tempFormData) {
    // Ensure all form data including images is restored
    const completeFormData = {
      ...global.tempFormData,
      repo_figure1: global.tempFormData.repo_figure1 || '',
      repo_figure2: global.tempFormData.repo_figure2 || '',
      repo_figure3: global.tempFormData.repo_figure3 || '',
      repo_figure4: global.tempFormData.repo_figure4 || '',
      repo_figure5: global.tempFormData.repo_figure5 || '',
      repo_figure6: global.tempFormData.repo_figure6 || ''
    };
    formWindow.webContents.send('restore-form-data', completeFormData);
    global.tempFormData = null;
  }

  if (win && !win.isDestroyed()) {
    win.close();
  }
});

// Handle reload request
ipcMain.on('reload', (event) => {
  if (mainWindow) {
    mainWindow.reload();
  }
});

// Store form data temporarily
let tempFormData = null;

// Handle preview data
ipcMain.on('preview-form', (event, formData) => {
  tempFormData = formData;
});

// Handle abort preview
ipcMain.on('abort-preview', (event) => {
  if (tempFormData) {
    event.reply('restore-form-data', tempFormData);
    tempFormData = null;
  }
});

// Track all application windows
const windows = {
  main: null,
  report: null,
  form: null
};

// Handle report creation request
ipcMain.on('openReportCreation', (event, data) => {
  // Store reference to the form window
  windows.form = BrowserWindow.getAllWindows().find(window => {
    const url = window.webContents.getURL();
    return url.includes('checksCreate.html');
  });

  // Close any existing report windows first
  if (windows.report && !windows.report.isDestroyed()) {
    windows.report.close();
  }

  const reportWindow = windows.report = new BrowserWindow({
    width: 1200,
    height: 700,
    modal: true,
    parent: windows.main,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });
  require('@electron/remote/main').enable(reportWindow.webContents);

  reportWindow.setMenu(null);

  // Load the appropriate report template based on type
  if (data && data.type) {
    const htmlFile = data.type === 'endo' ? 'report2.html' : 'report.html';
    reportWindow.loadURL(path.join('file://', __dirname, 'sections', htmlFile));

    // Send data after window loads
    reportWindow.webContents.once('did-finish-load', () => {
      if (data.data) {
        reportWindow.webContents.send('insert-data', data.data);
      }
    });
  } else {
    // Default to checks create form
    reportWindow.loadURL(path.join('file://', __dirname, 'sections/checksCreate.html'));
  }

  // Clean up references before closing
  reportWindow.on('close', () => {
    if (reportWindow && !reportWindow.isDestroyed()) {
      delete reportWindows[reportWindow.id];
    }
  });
});

// Handle login success and open main window
ipcMain.on('openMainWindow', (event, userData) => {
    if (windows.main) {
        // Set the global current user
        global.currentUser = userData;

        const dashboardPath = path.join(getAppPath(), 'sections/dashboard.html');
        windows.main.loadURL('file://' + dashboardPath);
        
        windows.main.webContents.once('did-finish-load', () => {
            windows.main.webContents.send('user-data', userData);
        });
    }
});

// Handle recent reports request
ipcMain.on('getRecentReports', async (event) => {
  try {
    const reportsStore = require('./lib/reports-store');
    const reports = reportsStore.getRecentReports(5);
    event.reply('recentReportsData', reports);
  } catch (error) {
    console.error('Error fetching recent reports:', error);
    event.reply('recentReportsData', []);
  }
});

// Handle PDF opening
ipcMain.on('openPDF', (event, filePath) => {
  const pdfWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  pdfWindow.setMenu(null);

  // Wait until ready to show
  pdfWindow.once('ready-to-show', () => {
    pdfWindow.show();
    pdfWindow.focus();
  });

  // Load the PDF file
  pdfWindow.loadFile(path.normalize(filePath));

  // Ensure window stays focused
  pdfWindow.on('blur', () => {
    pdfWindow.focus();
  });
});

// Handle getting all reports
ipcMain.on('getAllReports', (event) => {
  try {
    const reportsStore = require('./lib/reports-store');
    const reports = reportsStore.getReports(); // Get all reports
    event.reply('allReportsData', reports);
  } catch (error) {
    console.error('Error fetching all reports:', error);
    event.reply('allReportsData', []);
  }

  
});// Save Referral as PDF
ipcMain.on('saveReferralAsPDF', async (event, patientInfo) => {
  const { dialog } = require('electron');
  const { savePDFAndRecord } = require('./lib/report-helpers');
  const win = BrowserWindow.fromWebContents(event.sender);

  let defaultFileName = 'Referral_Letter';
  if (patientInfo && (patientInfo.id || patientInfo.firstName)) {
    const parts = [];
    if (patientInfo.id) parts.push(patientInfo.id);
    if (patientInfo.firstName) parts.push(patientInfo.firstName);
    if (patientInfo.lastName) parts.push(patientInfo.lastName);
    if (parts.length > 0) {
      defaultFileName = parts.join('_').replace(/[^a-zA-Z0-9_-]/g, '');
    }
  }

  // Get referral save path from settings
  const settings = require('./lib/settings.js');
  const referralPath = settings.get('referralSavePath');

  // Ensure directory exists
  if (!fs.existsSync(referralPath)) {
    fs.mkdirSync(referralPath, { recursive: true });
  }

  const { filePath } = await dialog.showSaveDialog(win, {
    title: 'Save Referral Letter',
    defaultPath: path.join(referralPath, `${defaultFileName}.pdf`),
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });

  if (filePath) {
    await new Promise(resolve => setTimeout(resolve, 300));

    const hasEmptyFields = await event.sender.executeJavaScript(`
      document.querySelectorAll('.empty-field').length
    `);
    console.log('Empty fields found:', hasEmptyFields);

    event.sender.printToPDF({
      printBackground: true,
      marginsType: 1,
      pageSize: 'Letter',
      landscape: false,
      preferCSSPageSize: true,
      scaleFactor: 100
    }).then(async pdfData => {
      await savePDFAndRecord(event, filePath, pdfData, patientInfo, 'referral', 'Referral Letter');
    }).catch(error => {
      console.error('Error generating PDF:', error);
      dialog.showErrorBox('Error', 'Failed to generate PDF: ' + error.message);
    });
  }
});

// Save Operation Report as PDF
ipcMain.on('saveOperationAsPDF', async (event, patientInfo) => {
  const { dialog } = require('electron');
  const { savePDFAndRecord } = require('./lib/report-helpers');
  const win = BrowserWindow.fromWebContents(event.sender);

  console.log('Received patient info:', patientInfo);

  let defaultFileName = 'Operation_Report';
  if (patientInfo && (patientInfo.id || patientInfo.firstName)) {
    const parts = [];
    if (patientInfo.id) parts.push(patientInfo.id);
    if (patientInfo.firstName) parts.push(patientInfo.firstName);
    if (patientInfo.lastName) parts.push(patientInfo.lastName);
    if (parts.length > 0) {
      defaultFileName = parts.join('_').replace(/[^a-zA-Z0-9_-]/g, '');
    }
  }

  console.log('Generated filename:', defaultFileName);

  // Get operation save path from settings
  const settings = require('./lib/settings.js');
  const operationPath = settings.get('operationSavePath');

  // Ensure directory exists
  if (!fs.existsSync(operationPath)) {
    fs.mkdirSync(operationPath, { recursive: true });
  }

  const { filePath } = await dialog.showSaveDialog(win, {
    title: 'Save Operation Report',
    defaultPath: path.join(operationPath, `${defaultFileName}.pdf`),
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });

  if (filePath) {
    await new Promise(resolve => setTimeout(resolve, 300));

    const hasEmptyFields = await event.sender.executeJavaScript(`
      document.querySelectorAll('.empty-field').length
    `);
    console.log('Empty fields found:', hasEmptyFields);

    event.sender.printToPDF({
      printBackground: true,
      marginsType: 1,
      pageSize: 'Letter',
      landscape: false,
      preferCSSPageSize: true,
      scaleFactor: 100
    }).then(async pdfData => {
      await savePDFAndRecord(event, filePath, pdfData, patientInfo, 'operation', 'Operation Report');
    }).catch(error => {
      console.error('Error generating PDF:', error);
      dialog.showErrorBox('Error', 'Failed to generate PDF: ' + error.message);
    });
  }
});

initialize()