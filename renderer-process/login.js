var data = require('../lib/data');
var helpers = require('../lib/helpers');
const { ipcRenderer } = require('electron');

var textValue = '';
var passValue = '';
//const path = require('path');
document.getElementById('login-btn').addEventListener('click', () => {
    var text = document.getElementsByName('username');
    var pass = document.getElementsByName('password');
    pass.forEach(element => {
        passValue = element.value;
    });
    text.forEach(element => {
        textValue = element.value;
    });
    var hashedPassword = helpers.hash(passValue);

    data.read('users', textValue, function (err, userData) {
        if (!err && userData) {
            //compare if passwords are the same
            if (userData.userName === textValue && userData.password === hashedPassword) {
                document.getElementById('formError').innerHTML = 'you have successfully logged in';
                let username = userData.lastName + ' ' + userData.firstName;
                ipcRenderer.send('openMainWindow', username);
            } else {
                document.getElementById('formError').innerHTML = "Incorrect Credentials";
                document.getElementById('formError').style.display = "block";
                setTimeout(toast, 3000);
            }
            //document.getElementById('formError').innerHTML=userData.hashedPassword;
        } else {
            document.getElementById('formError').innerHTML = "Please Check your credentials and Try again";
            document.getElementById('formError').style.display = "block";
            setTimeout(toast, 3000);
            //window.clearInterval(2000);
        }
    });
})

function toast() {
    document.getElementById('formError').style.display = "none";
}