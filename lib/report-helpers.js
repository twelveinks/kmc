const { BrowserWindow, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

// Helper function to save report to store
function saveToReportStore(filePath, patientInfo, reportType, findings) {
    const reportsStore = require('./reports-store');
    // Get the full doctor name
    let doctorName = 'Doctor';
    if (global.currentUser) {
        const firstName = global.currentUser.firstName || '';
        const lastName = global.currentUser.lastName || '';
        if (firstName || lastName) {
            doctorName = `Dr. ${firstName} ${lastName}`.trim();
        }
    }
    console.log('Current user:', global.currentUser);
    console.log('Doctor name being saved:', doctorName);

    const reportInfo = {
        filePath: path.normalize(filePath),
        patientName: `${patientInfo.firstName || ''} ${patientInfo.lastName || ''}`.trim() || 'Unknown Patient',
        doctorName: doctorName,
        type: reportType,
        findings: findings
    };
    reportsStore.addReport(reportInfo);
}

// Helper function to create PDF viewer window
function createPDFWindow(filePath) {
    try {
        const pdfWindow = new BrowserWindow({
            width: 1200,
            height: 800,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true
            },
            show: false
        });
        
        pdfWindow.setMenu(null);
        pdfWindow.loadFile(path.normalize(filePath));
        
        // Handle window ready event
        pdfWindow.once('ready-to-show', () => {
            if (!pdfWindow.isDestroyed()) {
                pdfWindow.show();
                pdfWindow.focus();
            }
        });
        
        // Handle window errors
        pdfWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
            console.error('Failed to load PDF:', errorDescription);
        });
        
        return pdfWindow;
    } catch (error) {
        console.error('Error creating PDF window:', error);
        return null;
    }
}

// Helper function to save PDF and record it
async function savePDFAndRecord(event, filePath, pdfData, patientInfo, reportType, findings) {
    try {
        // Write the PDF file
        await fs.promises.writeFile(filePath, pdfData);
        console.log('PDF file written to:', filePath);
        
        // Clear any empty field markers if the window still exists
        const window = BrowserWindow.fromWebContents(event.sender);
        if (window && !window.isDestroyed()) {
            await event.sender.executeJavaScript(`
                document.querySelectorAll('.empty-field').forEach(el => el.classList.remove('empty-field'));
            `);
        }
        
        // Save to reports store
        saveToReportStore(filePath, patientInfo, reportType, findings);
        console.log('Report saved to store');
        
        // Show success message first
        if (window && !window.isDestroyed()) {
            await dialog.showMessageBox(window, {
                type: 'info',
                title: 'Success',
                message: 'Report saved successfully!',
                buttons: ['OK']
            });
        }

        // Create the PDF viewer window last, after showing the message
        try {
            createPDFWindow(filePath);
            console.log('PDF viewer opened');
        } catch (pdfError) {
            console.error('Error opening PDF viewer:', pdfError);
            // Don't throw the error - the file is already saved
        }
        
        return true;
    } catch (error) {
        console.error('Error saving report:', error);
        dialog.showErrorBox('Error', 'Failed to save report: ' + error.message);
        return false;
    }
}

module.exports = {
    savePDFAndRecord,
    createPDFWindow,
    saveToReportStore
};