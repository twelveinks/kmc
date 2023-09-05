const {ipcMain,BrowserWindow}=require('electron');
const path= require('path');
ipcMain.on('openMainWindow',(event,arg)=>{
  let userName=arg;
  let iconpath=path.join(__dirname,'../../assets/img/65x65.png');
  const mainWindow=new BrowserWindow({
    width:1200,
    height:800,
    minWidth:1200,
    minHeight:800,
    title:'Scope Report - '+arg,
    icon:iconpath,
    webPreferences: {
      devTools: false // Enable the debug console
    }
  });
  ipcMain.on('reload',(event)=>{
    mainWindow.webContents.reload();
  });
  // console.log(path.join(__dirname,'../../icon.ico'));
  ipcMain.on('getUserNames',(event)=>{
    event.sender.send('username',userName);
  });
  //mainWindow.getParentWindow.quit();
  //close the login page behind as u open up the main window
  BrowserWindow.getAllWindows().forEach(win=>{
      if(win.id==1)win.close();
      else
      mainWindow.loadURL(path.join('file://',__dirname,'../../sections/checksCreate.html'));
  });
});
