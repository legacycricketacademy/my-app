// Wait for the DOM to be loaded
document.addEventListener('DOMContentLoaded', function() {
  // Get the registration form if it exists on the page
  const registrationForm = document.getElementById('registration-form');
  
  if (registrationForm) {
    registrationForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form elements
      const errorElement = document.getElementById('error-message');
      errorElement.style.display = 'none';
      
      // Collect form data
      const formData = {
        username: document.getElementById('username').value,
        email: document.getElementById('email').value,
        password: document.getElementById('password').value,
        fullName: document.getElementById('fullName').value,
        role: document.getElementById('role').value,
        phone: document.getElementById('phone').value
      };
      
      // Show loading state
      const responseOutput = document.getElementById('response-output');
      responseOutput.innerText = 'Submitting...';
      
      // Send the registration request
      fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      .then(function(response) {
        return response.json();
      })
      .then(function(result) {
        // Display the full response
        responseOutput.innerText = JSON.stringify(result, null, 2);
        
        // Show error message if registration failed
        if (!result.success) {
          errorElement.innerText = result.message || 'Registration failed';
          errorElement.style.display = 'block';
        }
      })
      .catch(function(error) {
        // Handle any errors
        responseOutput.innerText = 'Error: ' + error.message;
        
        errorElement.innerText = 'An error occurred: ' + error.message;
        errorElement.style.display = 'block';
      });
    });
  }
});