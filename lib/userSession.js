const { ipcRenderer } = require('electron');

// Format date as "Tuesday 15th October 2025"
function getFormattedDate() {
    const date = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const dayName = days[date.getDay()];
    const day = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    // Add ordinal suffix
    let suffix = 'th';
    if (day % 10 === 1 && day !== 11) suffix = 'st';
    else if (day % 10 === 2 && day !== 12) suffix = 'nd';
    else if (day % 10 === 3 && day !== 13) suffix = 'rd';

    return `${dayName} ${day}${suffix} ${monthName} ${year}`;
}

// Cache for current user data
let cachedUserData = null;

// Get current user's name
function getCurrentUser(callback) {
    // If we have cached data, use it
    if (cachedUserData) {
        callback(`Dr. ${cachedUserData.firstName} ${cachedUserData.lastName}`);
        return;
    }

    // Otherwise request it
    ipcRenderer.send('getUserNames');
    ipcRenderer.once('username', (event, userData) => {
        if (userData) {
            cachedUserData = userData;
            callback(`Dr. ${userData.firstName} ${userData.lastName}`);
        }
    });
}

module.exports = {
    getFormattedDate,
    getCurrentUser
};