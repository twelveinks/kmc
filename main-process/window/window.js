const {ipcMain,BrowserWindow,screen}=require('electron');
const path= require('path');
ipcMain.on('openMainWindow',(event,arg)=>{
  let userName=arg;
  let iconpath=path.join(__dirname,'../../assets/img/65x65.png');
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  const mainWindow = new BrowserWindow({
    width: width,
    height: height,
    minWidth: 1200,
    minHeight: 700,
    title: 'Scope Report - ' + arg,
    icon: iconpath,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      devTools: true
    }
  });
  ipcMain.on('reload',(event)=>{
    mainWindow.webContents.reload();
  });
  // console.log(path.join(__dirname,'../../icon.ico'));
  // Store username in a more accessible way
  global.currentDoctor = userName;

  ipcMain.on('getUserNames',(event)=>{
    console.log('=== getUserNames IPC received ===');
    console.log('Sending username:', global.currentDoctor);
    event.sender.send('username', global.currentDoctor);
  });

  // Handle report creation navigation
  ipcMain.on('openReportCreation', (event) => {
    mainWindow.loadURL(path.join('file://',__dirname,'../../sections/checksCreate.html'));
  });

  // Handle form opening
  ipcMain.on('openForm', (event, formType) => {
    mainWindow.loadURL(path.join('file://',__dirname,`../../sections/${formType}Form.html`));
  });

  // Handle settings and its sections
  ipcMain.on('openSettings', (event) => {
    mainWindow.loadURL(path.join('file://',__dirname,'../../sections/settings.html'));
  });

  ipcMain.on('openSection', (event, section) => {
    const sectionPages = {
      'users': 'users.html',
      'templates': 'templates.html',
      'preferences': 'preferences.html',
      'backup': 'backup.html'
    };
    if (sectionPages[section]) {
      mainWindow.loadURL(path.join('file://',__dirname,`../../sections/${sectionPages[section]}`));
    }
  });
  //mainWindow.getParentWindow.quit();
  //close the login page behind as u open up the main window
  BrowserWindow.getAllWindows().forEach(win=>{
      if(win.id==1)win.close();
      else
      mainWindow.loadURL(path.join('file://',__dirname,'../../sections/dashboard.html'));
  });
});
