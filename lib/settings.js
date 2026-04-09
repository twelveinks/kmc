const path = require('path');
const fs = require('fs');
const os = require('os');

class Settings {
    constructor() {
        // Store settings in app data directory for better persistence
        const appDataPath = process.env.APPDATA || (
            process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Application Support') : path.join(os.homedir(), '.config')
        );
        
        this.settingsPath = path.join(appDataPath, 'kmc-settings', 'settings.json');
        this.defaults = {
            photoSavePath: path.join(os.homedir(), 'ENDO'),
            reportSavePath: path.join(os.homedir(), 'scope report'),
            operationSavePath: path.join(os.homedir(), 'operation reports'),
            referralSavePath: path.join(os.homedir(), 'referral reports')
        };
        
        // Ensure settings directory exists
        const settingsDir = path.dirname(this.settingsPath);
        if (!fs.existsSync(settingsDir)) {
            fs.mkdirSync(settingsDir, { recursive: true });
        }
        
        this.settings = this.loadSettings();
    }

    loadSettings() {
        try {
            if (fs.existsSync(this.settingsPath)) {
                const data = fs.readFileSync(this.settingsPath, 'utf8');
                const loadedSettings = JSON.parse(data);
                console.log('Loaded settings:', loadedSettings);
                return { ...this.defaults, ...loadedSettings };
            }
        } catch (err) {
            console.error('Error loading settings:', err);
        }
        
        // If no settings exist, save defaults
        const defaultSettings = { ...this.defaults };
        try {
            fs.writeFileSync(this.settingsPath, JSON.stringify(defaultSettings, null, 2));
            console.log('Created default settings');
        } catch (err) {
            console.error('Error creating default settings:', err);
        }
        
        return defaultSettings;
    }

    saveSettings() {
        try {
            // Ensure the settings directory exists
            const settingsDir = path.dirname(this.settingsPath);
            if (!fs.existsSync(settingsDir)) {
                fs.mkdirSync(settingsDir, { recursive: true });
            }
            
            // Save settings
            fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 2));
            console.log('Settings saved successfully:', this.settings);
            
            // Ensure save directories exist
            Object.values(this.settings).forEach(dirPath => {
                if (!fs.existsSync(dirPath)) {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
            });
        } catch (err) {
            console.error('Error saving settings:', err);
            throw err; // Rethrow to handle in the UI
        }
    }

    get(key) {
        return this.settings[key];
    }

    set(key, value) {
        this.settings[key] = value;
        this.saveSettings();
    }

    getAll() {
        return { ...this.settings };
    }

    resetToDefaults() {
        this.settings = { ...this.defaults };
        this.saveSettings();
    }
}

module.exports = new Settings();