//require some dependencies
let { ipcRenderer } = require('electron');
const { BrowserWindow } = require('electron').remote;
const PDFWindow = require('electron-pdf-window');
const path = require('path');
const fs = require('fs');
const homedir= require('os').homedir();
const desktop='/scope report/';


//setting up the report module
var report = {};
report.endo = function (data) {
  const windowID = BrowserWindow.getFocusedWindow().id;
  let reportwin = new BrowserWindow({
    width: 1200,
    height: 700,
    modal: true,
    show: true,
  });
  reportwin.setMenu(null);
  reportwin.loadURL(path.join('file://', __dirname, '../sections/report2.html'));
  console.log(reportwin.id);
  //ipcRenderer.send('insert-data',data);
  reportwin.webContents.on('did-finish-load', () => {
    reportwin.webContents.send('insert-data', data, windowID);
  });
  ipcRenderer.on('EndoReport', (event, result) => {
    
    console.log('new section check ' + reportwin.id);
    // let dist = path.join(__dirname, '../.data/report-template/' + result + '.pdf');
      //  console.log(path.join(homedir,'/Desktop/newfolder/' + result + '.pdf'));
       let dist=path.join(homedir,desktop + result + '.pdf');
    let currentWindow = BrowserWindow.fromId(reportwin.id);
    //console.log('new section '+reportwin.id +currentWindow);
    currentWindow.webContents.printToPDF({}, function (error, data) {
      if (error) throw error;
      fs.open(dist, 'wx', data, function (err, fileDescriptor) {
        if (!err && fileDescriptor) {
          // Write to file and close it
          fs.writeFile(fileDescriptor, data, function (err) {
            if (!err) {
              let report = new BrowserWindow({ width: 1200, height: 700, });
              report.setMenu(null);
              PDFWindow.addSupport(report);
              report.loadURL(dist);
              fs.close(fileDescriptor, function (err) {
                if (!err) {
                  console.log('closed very wello');
                } else {
                  alert('Error closing new file');
                }
              });
              ipcRenderer.send('reload');
              currentWindow.close();
            } else {
              alert('Error writing to new file');
            }
          });
        } else {
          // alert('This file was unable to be created because it could be existing already, please try again');
          alert(err);
          ipcRenderer.send('reload');
        }
      });
    });
  });
  ipcRenderer.on('Abort', (event) => {
    let currentWindow = BrowserWindow.fromId(reportwin.id);
    currentWindow.hide();
    // reportwin.close();
  });
};
report.colo = function (data) {
  const windowID = BrowserWindow.getFocusedWindow().id;
  let reportwin = new BrowserWindow({
    width: 1200,
    height: 700,
    modal: true,
    show: true,
  });
  reportwin.setMenu(null);
  reportwin.loadURL(path.join('file://', __dirname, '../sections/report.html'));
  console.log(reportwin.id);
  //ipcRenderer.send('insert-data',data);
  reportwin.webContents.on('did-finish-load', () => {
    reportwin.webContents.send('insert-data', data, windowID);
  });
  ipcRenderer.on('EndoReport', (event, result) => {
    
    console.log('new section check ' + reportwin.id);
    // let dist = path.join(__dirname, '../.data/report-template/' + result + '.pdf');
      //  console.log(path.join(homedir,'/Desktop/newfolder/' + result + '.pdf'));
       let dist=path.join(homedir,desktop + result + '.pdf');
    let currentWindow = BrowserWindow.fromId(reportwin.id);
    //console.log('new section '+reportwin.id +currentWindow);
    currentWindow.webContents.printToPDF({}, function (error, data) {
      if (error) throw error;
      fs.open(dist, 'wx', data, function (err, fileDescriptor) {
        if (!err && fileDescriptor) {
          // Write to file and close it
          fs.writeFile(fileDescriptor, data, function (err) {
            if (!err) {
              let report = new BrowserWindow({ width: 1200, height: 700, });
              report.setMenu(null);
              PDFWindow.addSupport(report);
              report.loadURL(dist);
              fs.close(fileDescriptor, function (err) {
                if (!err) {
                  console.log('closed very wello');
                } else {
                  alert('Error closing new file');
                }
              });
              ipcRenderer.send('reload');
              currentWindow.close();
            } else {
              alert('Error writing to new file');
            }
          });
        } else {
          // alert('This file was unable to be created because it could be existing already, please try again');
          alert(err);
          ipcRenderer.send('reload');
        }
      });
    });
  });
  ipcRenderer.on('Abort', (event) => {
    let currentWindow = BrowserWindow.fromId(reportwin.id);
    currentWindow.hide();
    // reportwin.close();
  });
};
// report.colo = function (data) {
//   const windowID = BrowserWindow.getFocusedWindow().id;
//   let reportwin = new BrowserWindow({
//     width: 1200,
//     height: 700,
//     modal: true,
//     show: true,
//   });
//   reportwin.setMenu(null);
//   reportwin.loadURL(path.join('file://', __dirname, '../sections/report2.html'));
//   console.log(reportwin.id);
//   //ipcRenderer.send('insert-data',data);
//   reportwin.webContents.on('did-finish-load', () => {
//     reportwin.webContents.send('insert-data', data, windowID);
//   });
//   ipcRenderer.on('coloReport', (event, result) => {
//     ipcRenderer.send('reload');
    
//     console.log('new section check ' + reportwin.id);
//     // let dist = path.join(__dirname, '../.data/report-template/' + result + '.pdf');
//     let dist=path.join(homedir,desktop + result + '.pdf');
//     let currentWindow = BrowserWindow.fromId(reportwin.id);
//     //console.log('new section '+reportwin.id +currentWindow);
//     currentWindow.webContents.printToPDF({}, function (error, data) {
//       // alert("Something went wrong please close application and try again "+error);

//       if (error) throw error;
//       fs.open(dist, 'wx', data, function (err, fileDescriptor) {
//         if (!err && fileDescriptor) {
//           // Write to file and close it
//           fs.writeFile(fileDescriptor, data, function (err) {
//             if (!err) {
//               let report = new BrowserWindow({ width: 1200, height: 700, });
//               PDFWindow.addSupport(report);
//               report.loadURL(dist);
//               fs.close(fileDescriptor, function (err) {
//                 if (!err) {
//                   console.log('closed very wello');
//                 } else {
//                   alert('Error closing new file');
//                 }
//               });
//               currentWindow.close();
//             } else {
//               alert('Error writing to new file');
//             }
//           });
//         } else {
//           alert('This file was unable to be created because it could be existing already, please try again');
//           ipcRenderer.send('reload');
//         }
//       });
//     });
//   });
//   ipcRenderer.on('Abort', (event) => {
//     let currentWindow = BrowserWindow.fromId(reportwin.id);
//     currentWindow.hide();
//     // reportwin.close();
//   });
// };


module.exports = report;