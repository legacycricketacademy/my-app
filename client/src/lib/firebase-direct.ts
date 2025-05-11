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
      throw new Error(errorData.error?.message || 'Signup failed');
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
      throw new Error(errorData.error?.message || 'Login failed');
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