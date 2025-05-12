/**
 * This file contains direct Firebase Auth REST API calls 
 * to bypass the JavaScript SDK issues
 */

// Firebase Web API Key
const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY;

// Base URL for Firebase Auth API
const BASE_URL = 'https://identitytoolkit.googleapis.com/v1/accounts';

/**
 * Sign up with email/password using Firebase REST API
 */
export async function signUpWithEmail(email: string, password: string, displayName: string) {
  try {
    console.log("Attempting direct REST API signup for:", email);
    
    // First create the account
    const response = await fetch(`${BASE_URL}:signUp?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Firebase REST signup error:", errorData);
      
      // Map Firebase error codes to more user-friendly messages
      const errorCode = errorData.error?.message;
      let errorMessage = 'Signup failed';
      
      // Better error mapping
      switch (errorCode) {
        case 'EMAIL_EXISTS':
          errorMessage = "This email is already registered. Please log in or use a different email address.";
          break;
        case 'INVALID_EMAIL':
          errorMessage = "Please enter a valid email address.";
          break;
        case 'WEAK_PASSWORD':
          errorMessage = "The password is too weak. Please use a stronger password with at least 6 characters.";
          break;
        case 'OPERATION_NOT_ALLOWED':
          errorMessage = "Email/password accounts are not enabled. Please contact support.";
          break;
        case 'TOO_MANY_ATTEMPTS_TRY_LATER':
          errorMessage = "We have blocked all requests from this device due to unusual activity. Try again later.";
          break;
        default:
          errorMessage = errorData.error?.message || 'Signup failed';
      }
      
      // Create an error with the right message and add the code for debugging
      const error = new Error(errorMessage);
      (error as any).code = errorCode;
      (error as any).originalError = errorData.error;
      
      throw error;
    }

    const data = await response.json();
    console.log("Firebase REST signup success:", { 
      uid: data.localId, 
      email: data.email 
    });

    // Then update the user profile to add display name
    if (displayName) {
      await updateProfile(data.idToken, displayName);
    }

    // Return user data
    return {
      uid: data.localId,
      email: data.email,
      emailVerified: false,
      displayName: displayName || null,
      idToken: data.idToken,
      refreshToken: data.refreshToken
    };
  } catch (error) {
    console.error("Direct Firebase signup error:", error);
    throw error;
  }
}

/**
 * Sign in with email/password using Firebase REST API
 */
export async function signInWithEmail(email: string, password: string) {
  try {
    console.log("Attempting direct REST API login for:", email);
    
    const response = await fetch(`${BASE_URL}:signInWithPassword?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Firebase REST login error:", errorData);
      
      // Map Firebase error codes to more user-friendly messages
      const errorCode = errorData.error?.message;
      let errorMessage = 'Login failed';
      
      // Better error mapping for login errors
      switch (errorCode) {
        case 'EMAIL_NOT_FOUND':
          errorMessage = "No account found with this email address. Please check your email or sign up.";
          break;
        case 'INVALID_PASSWORD':
          errorMessage = "Incorrect password. Please try again or reset your password.";
          break;
        case 'USER_DISABLED':
          errorMessage = "This account has been disabled. Please contact support.";
          break;
        case 'INVALID_EMAIL':
          errorMessage = "Please enter a valid email address.";
          break;
        case 'TOO_MANY_ATTEMPTS_TRY_LATER':
          errorMessage = "Too many unsuccessful login attempts. Please try again later or reset your password.";
          break;
        default:
          errorMessage = errorData.error?.message || 'Login failed';
      }
      
      // Create an error with the right message and add the code for debugging
      const error = new Error(errorMessage);
      (error as any).code = errorCode;
      (error as any).originalError = errorData.error;
      
      throw error;
    }

    const data = await response.json();
    console.log("Firebase REST login success:", { 
      uid: data.localId,
      email: data.email 
    });

    // Get user profile data
    const userInfo = await getUserInfo(data.idToken);

    // Return user data
    return {
      uid: data.localId,
      email: data.email,
      emailVerified: userInfo.emailVerified || false,
      displayName: userInfo.displayName || null,
      idToken: data.idToken,
      refreshToken: data.refreshToken
    };
  } catch (error) {
    console.error("Direct Firebase login error:", error);
    throw error;
  }
}

/**
 * Update profile using Firebase REST API
 */
async function updateProfile(idToken: string, displayName: string) {
  try {
    const response = await fetch(`${BASE_URL}:update?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idToken,
        displayName,
        returnSecureToken: true
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Firebase REST profile update error:", errorData);
      throw new Error(errorData.error?.message || 'Profile update failed');
    }

    return await response.json();
  } catch (error) {
    console.error("Direct Firebase profile update error:", error);
    throw error;
  }
}

/**
 * Get user info using Firebase REST API
 */
async function getUserInfo(idToken: string) {
  try {
    const response = await fetch(`${BASE_URL}:lookup?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ idToken })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Firebase REST user lookup error:", errorData);
      throw new Error(errorData.error?.message || 'User lookup failed');
    }

    const data = await response.json();
    return data.users[0];
  } catch (error) {
    console.error("Direct Firebase user lookup error:", error);
    throw error;
  }
}

/**
 * Check if an email is already registered with Firebase
 * This can be used to provide early feedback to users before they submit the form
 */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    // We use the password reset endpoint with a non-existent email to check if it exists
    // If the email exists, Firebase will return a success response
    // If the email does not exist, Firebase will return a "EMAIL_NOT_FOUND" error
    const response = await fetch(`${BASE_URL}:sendOobCode?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email
      })
    });

    const data = await response.json();
    
    // If we get a success response, the email exists
    if (response.ok) {
      return true;
    }
    
    // If we get a EMAIL_NOT_FOUND error, the email does not exist
    if (data.error?.message === 'EMAIL_NOT_FOUND') {
      return false;
    }
    
    // For other errors, we assume the email might exist
    console.warn("Could not definitively check if email exists:", data.error);
    return false;
  } catch (error) {
    console.error("Error checking if email exists:", error);
    return false;
  }
}

/**
 * Send password reset email using Firebase REST API
 */
export async function sendPasswordReset(email: string) {
  try {
    const response = await fetch(`${BASE_URL}:sendOobCode?key=${FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requestType: 'PASSWORD_RESET',
        email
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Firebase REST password reset error:", errorData);
      throw new Error(errorData.error?.message || 'Password reset failed');
    }

    return true;
  } catch (error) {
    console.error("Direct Firebase password reset error:", error);
    throw error;
  }
}