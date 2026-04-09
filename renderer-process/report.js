//require some dependencies
let { ipcRenderer } = require('electron');
const path = require('path');
const fs = require('fs');
const homedir= require('os').homedir();
const desktop='/scope report/';

// Store form data for restoration
let storedFormData = null;

//setting up the report module
var report = {};
report.endo = function (data) {
  // Store form data before sending
  storedFormData = data;
  
  // Get doctor's name from main process
  ipcRenderer.send('get-doctor-name');
  
  // Wait for doctor's name response
  ipcRenderer.once('doctor-name', (event, doctorName) => {
    data.doctorName = doctorName;
    // Send data to main process to open report window
    ipcRenderer.send('openReportCreation', { type: 'endo', data: data });
  });
};

report.colo = function (data) {
  // Store form data before sending
  storedFormData = data;
  
  // Get doctor's name from main process
  ipcRenderer.send('get-doctor-name');
  
  // Wait for doctor's name response
  ipcRenderer.once('doctor-name', (event, doctorName) => {
    data.doctorName = doctorName;
    // Send data to main process to open report window
    ipcRenderer.send('openReportCreation', { type: 'colo', data: data });
  });
};

// Listen for PDF generation events from the report window
ipcRenderer.on('EndoReport', (event, result) => {
  let dist = path.join(homedir, desktop + result + '.pdf');
  ipcRenderer.send('generate-pdf', { filePath: dist, reportId: result });
});

ipcRenderer.on('Abort', (event) => {
  console.log('Report generation aborted, restoring form data');
  if (storedFormData) {
    // Get all form fields
    Object.keys(storedFormData).forEach(key => {
      // Remove 'repo_' prefix from the key
      const fieldId = key.replace('repo_', '');
      const element = document.getElementById(fieldId);
      if (element) {
        element.value = storedFormData[key];
      }
    });
  }
});

module.exports = report;