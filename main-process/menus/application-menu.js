const {BrowserWindow, Menu, app} = require('electron')
const path = require('path');
let template = [{
  label: 'Settings',
  submenu: [{
    label: 'NewUser',
    click (){
      let child=new BrowserWindow({modal:true,width:600,height:600});
      child.loadURL(path.join('file://', __dirname, '../../sections/accountCreate.html'));
    }
  },
  // {
  //   label: 'Developer Tools',
  //   click: () => {
  //     BrowserWindow.getFocusedWindow().webContents.openDevTools();
  //   }
  // }
]
}];

app.on('ready', () => {
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu);
});

