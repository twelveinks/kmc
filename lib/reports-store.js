const fs = require('fs');
const path = require('path');

class ReportsStore {
    constructor() {
        const isAsar = __dirname.includes('app.asar');
        
        // Use the same path logic as data.js
        if (isAsar) {
            // In production, store data one level up from resources
            this.dataPath = path.normalize(path.join(process.resourcesPath, '..', '.data'));
        } else {
            // In development, use the regular .data folder
            this.dataPath = path.normalize(path.join(__dirname, '..', '.data'));
        }
        
        this.reportsPath = path.normalize(path.join(this.dataPath, 'reports.json'));
        this.maxReports = 20; // Maximum number of reports to keep
        
        // Ensure .data directory exists with proper permissions
        try {
            if (!fs.existsSync(this.dataPath)) {
                fs.mkdirSync(this.dataPath, { 
                    recursive: true, 
                    mode: 0o766 // User: rwx, Group: rw, Others: rw
                });
            }
            // Ensure we have write permissions on existing directory
            fs.accessSync(this.dataPath, fs.constants.W_OK);
        } catch (error) {
            console.error('Error setting up data directory:', error);
            // Try to fix permissions if directory exists but we don't have write access
            try {
                fs.chmodSync(this.dataPath, 0o766);
            } catch (chmodError) {
                console.error('Failed to set directory permissions:', chmodError);
            }
        }
        
        console.log('Data directory path:', this.dataPath);
        console.log('Reports store path:', this.reportsPath);
        
        this.initializeStore();
    }

    initializeStore() {
        try {
            // Create reports.json if it doesn't exist
            if (!fs.existsSync(this.reportsPath)) {
                fs.writeFileSync(this.reportsPath, JSON.stringify([]), {
                    mode: 0o666 // User: rw, Group: rw, Others: rw
                });
                console.log('Created reports.json file:', this.reportsPath);
            }
            
            // Ensure we have write permissions on the file
            try {
                fs.accessSync(this.reportsPath, fs.constants.W_OK);
            } catch (accessError) {
                fs.chmodSync(this.reportsPath, 0o666);
            }
            
            // Verify we can read/write to the file
            const testRead = fs.readFileSync(this.reportsPath, 'utf8');
            JSON.parse(testRead); // Validate JSON structure
            console.log('Reports store initialized successfully');
        } catch (error) {
            console.error('Error initializing reports store:', error);
            // Try to recover by recreating the file
            try {
                fs.writeFileSync(this.reportsPath, JSON.stringify([]), {
                    mode: 0o666
                });
                console.log('Recovered by recreating reports.json');
            } catch (recoverError) {
                console.error('Failed to recover reports store:', recoverError);
            }
        }
    }

    getReports() {
        try {
            const data = fs.readFileSync(this.reportsPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error reading reports:', error);
            return [];
        }
    }

    addReport(report) {
        try {
            let reports = this.getReports();
            
            // Add new report at the beginning
            const normalizedReport = {
                ...report,
                filePath: path.normalize(report.filePath).replace(/\\/g, '/'), // Normalize and convert to forward slashes
                id: Date.now(),
                date: new Date().toISOString()
            };

            // Add the normalized report
            reports.unshift(normalizedReport);

            // Keep only the most recent reports
            if (reports.length > this.maxReports) {
                reports = reports.slice(0, this.maxReports);
            }

            // Convert all stored paths to use forward slashes
            reports = reports.map(r => ({
                ...r,
                filePath: r.filePath ? path.normalize(r.filePath).replace(/\\/g, '/') : r.filePath
            }));

            // Save back to file
            fs.writeFileSync(this.reportsPath, JSON.stringify(reports, null, 2));
            console.log('Successfully saved report to store:', this.reportsPath);
            return true;
        } catch (error) {
            console.error('Error adding report:', error);
            return false;
        }
    }

    getRecentReports(limit = 5) {
        const reports = this.getReports();
        return reports.slice(0, limit);
    }

    getReportById(id) {
        const reports = this.getReports();
        return reports.find(report => report.id === id);
    }
}

module.exports = new ReportsStore();