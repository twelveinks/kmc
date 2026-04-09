var data = require('../lib/data');
var helpers = require('../lib/helpers');
var firstNameValue = '';
var lastNameValue = '';
var userNameValue = '';
var passValue = '';
var confirmPassValue = '';
document.querySelector('.createAccount').addEventListener('click', () => {
    var firstName = document.getElementsByName('firstName');
    var lastName = document.getElementsByName('lastName');
    var userName = document.getElementsByName('userName');
    var password = document.getElementsByName('password');
    var confirmPass = document.getElementsByName('confirmPass');

    firstName.forEach(element => {
        firstNameValue = element.value;
    });
    lastName.forEach(element => {
        lastNameValue = element.value;
    });
    userName.forEach(element => {
        userNameValue = element.value;
    });
    password.forEach(element => {
        passValue = element.value;

    });
    confirmPass.forEach(element => {
        confirmPassValue = element.value;
    });
    var hashedPassword = helpers.hash(passValue);
    var confirmedPassword = helpers.hash(confirmPassValue);

    //  document.getElementById('formErro').innerHTML=firstNameValue+''+lastNameValue+''+userNameValue+' '+passValue+' '+confirmPassValue;
    if (firstNameValue && lastNameValue && userNameValue && passValue && confirmPassValue) {
        data.read('users', userNameValue, function (err, userData) {
            if (!err && userData) {
                //compare if passwords are the same
                document.getElementById('formErro').innerHTML = 'User already exists with such a username';
                document.getElementById('formErro').style.display = 'block';
            } else {
                if (hashedPassword === confirmedPassword) {
                    var userObject = {
                        firstName: firstNameValue,
                        lastName: lastNameValue,
                        userName: userNameValue,
                        password: hashedPassword,
                    };
                    //save the new user
                    data.create('users', userNameValue, userObject, function (err) {
                        if (!err) {
                            alert('user has been created successfully!!!');
                        } else {
                            alert('User already exists, Please login or use a different username');
                        }
                    });
                } else {
                    document.getElementById('formErro').innerHTML = "Password Mismatch; Try Again!";
                    document.getElementById('formErro').style.display = 'block';
                }
            }
            //document.getElementById('formErro').innerHTML=userData.hashedPassword;

        });
    } else {
        document.getElementById('formErro').innerHTML = "missing fields";
        document.getElementById('formErro').style.display = 'block';
    }

});

