function pages(){
  // Ensure the login template is initially hidden
  const loginTemplate = document.getElementById('login-template');
  if (loginTemplate) {
    loginTemplate.style.display = "none";
  }

  // Add click handler to the login button
  const loginButton = document.getElementById('button-login');
  if (loginButton) {
    loginButton.addEventListener('click', function() {
      console.log('Login button clicked, showing login form');
      document.getElementById('index-page').style.display = "none";
      document.getElementById('login-template').style.display = "block";
    });
  } else {
    console.error('Login button not found');
  }
}

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', pages);
} else {
  pages();
}
