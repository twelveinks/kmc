var data = require('../lib/data');
var helpers = require('../lib/helpers');
const { ipcRenderer } = require('electron');

function initializeLogin() {
    console.log('Initializing login form handlers');
    
    // Handle initial login button click
    const initialLoginBtn = document.getElementById('button-login');
    if (initialLoginBtn) {
        initialLoginBtn.addEventListener('click', function() {
            console.log('Initial login button clicked');
            document.getElementById('index-page').style.display = 'none';
            document.getElementById('login-template').style.display = 'block';
        });
    }

    // Handle the actual login form submission
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', function() {
            console.log('Login button clicked');
            const username = document.querySelector('input[name="username"]').value;
            const password = document.querySelector('input[name="password"]').value;
            
            console.log('Attempting login with username:', username);
            console.log('Password length:', password ? password.length : 0);
            const hashedPassword = helpers.hash(password);
            console.log('Hashed password:', hashedPassword);

            data.read('users', username, function(err, userData) {
                if (!err && userData) {
                    console.log('User data found:', userData);
                    console.log('Comparing:', {
                        'Input username': username,
                        'Stored username': userData.userName,
                        'Input password hash': hashedPassword,
                        'Stored password hash': userData.password
                    });
                    
                    //compare if passwords are the same
                    if (userData.userName === username && userData.password === hashedPassword) {
                        console.log('Login successful!');
                        document.getElementById('formError').innerHTML = 'you have successfully logged in';
                        // Send the full user data to main process
                        ipcRenderer.send('openMainWindow', userData);
                    } else {
                        console.log('Password mismatch');
                        document.getElementById('formError').innerHTML = "Incorrect Credentials";
                        document.getElementById('formError').style.display = "block";
                        setTimeout(toast, 3000);
                    }
                } else {
                    console.log('User not found:', err);
                    document.getElementById('formError').innerHTML = "Please Check your credentials and Try again";
                    document.getElementById('formError').style.display = "block";
                    setTimeout(toast, 3000);
                }
            });
        });
    } else {
        console.error('Login button not found');
    }
}

function toast() {
    document.getElementById('formError').style.display = "none";
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLogin);
} else {
    initializeLogin();
}