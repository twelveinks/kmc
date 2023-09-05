const {ipcMain,dialog}=require('electron');

ipcMain.on('open-information-dialog',(event)=>{
  const options ={
    type:'info',
    title:'confirmation',
    message:"Are you sure you want to save this report?",
    buttons:['Yes','No'],
    alwaysOnTop: true,
  };
  dialog.showMessageBox(options,(index)=>{
    event.sender.send('information-dialog-selection',index);
   });
  });
