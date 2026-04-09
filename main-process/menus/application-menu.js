const {BrowserWindow, Menu, app, dialog} = require('electron')
const path = require('path');
const electronRemote = require('@electron/remote/main');

// Get the app root path
function getAppPath() {
  return app.isPackaged 
    ? path.dirname(app.getAppPath())
    : path.join(__dirname, '../..');
}

function createApplicationMenu() {
  const template = [];

  // File menu
  const fileMenu = {
    label: '&File',
    submenu: [
      {
        label: 'Preferences',
        accelerator: process.platform === 'darwin' ? 'Cmd+,' : 'Ctrl+,',
        click () {
          let prefsWindow = new BrowserWindow({
            modal: true,
            width: 800,
            height: 800,
            title: 'Preferences',
            parent: BrowserWindow.getFocusedWindow(),
            webPreferences: {
              nodeIntegration: true,
              contextIsolation: false,
              enableRemoteModule: true
            }
          });
          electronRemote.enable(prefsWindow.webContents);
          prefsWindow.setMenu(null);
          const prefsPath = path.join(getAppPath(), 'sections', 'preferences.html');
          prefsWindow.loadURL('file://' + prefsPath);
        }
      },
      { type: 'separator' },
      {
        label: 'Exit',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Alt+F4',
        click: () => app.quit()
      }
    ]
  };

  template.push(fileMenu);

  // On macOS, add empty menu to get standard macOS app menu
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

  return template;
}

app.on('ready', () => {
  const template = createApplicationMenu();
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
});

