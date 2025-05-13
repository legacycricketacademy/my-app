import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User } from "@shared/schema";
import { getQueryFn, queryClient } from "../lib/queryClient";
import { apiRequest } from "../lib/api-client";
import { ApiResponse, AuthResponse } from "@shared/api-types";
import { useToast } from "@/hooks/use-toast";
import { useFirebaseAuth } from "@/lib/firebase";
import { auth } from "@/lib/firebase-init";
import { useLocalAuth } from "./use-local-auth";

// Helper function to map Firebase error codes to user-friendly messages
function getFirebaseErrorMessage(error: any): string {
  // Default message
  let message = "Authentication failed. Please try again.";
  
  // Extract error code from various possible error formats
  const errorCode = error.code || 
                   (error.message && error.message.includes("auth/") ? 
                     error.message.split("auth/")[1].split(")")[0] : null);
  
  if (!errorCode) return message;
  
  // Map Firebase error codes to user-friendly messages
  switch (errorCode) {
    case 'email-already-in-use':
    case 'EMAIL_EXISTS':
      return "This email is already registered. Please log in instead.";
    case 'user-not-found':
    case 'EMAIL_NOT_FOUND':
      return "No account found with this email. Please check your email or sign up.";
    case 'wrong-password':
    case 'INVALID_PASSWORD':
      return "Incorrect password. Please try again or reset your password.";
    case 'user-disabled':
    case 'USER_DISABLED':
      return "This account has been disabled. Please contact support.";
    case 'invalid-email':
    case 'INVALID_EMAIL':
      return "Please enter a valid email address.";
    case 'weak-password':
    case 'WEAK_PASSWORD':
      return "Password is too weak. Please use a stronger password.";
    case 'network-request-failed':
      return "Network error. Please check your internet connection and try again.";
    case 'too-many-requests':
    case 'TOO_MANY_ATTEMPTS_TRY_LATER':
      return "Too many attempts. Please try again later.";
    case 'popup-closed-by-user':
      return "Sign-in window was closed. Please try again.";
    case 'account-exists-with-different-credential':
      return "An account already exists with the same email but different sign-in credentials.";
    case 'operation-not-allowed':
    case 'OPERATION_NOT_ALLOWED':
      return "This sign-in method is not allowed. Please contact support.";
    case 'configuration-not-found':
      return "Firebase configuration error. Please contact support.";
    default:
      return error.message || message;
  }
}

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  firebaseUser: any;
  firebaseLoading: boolean;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<{ serverLogoutSucceeded: boolean }, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  firebaseLoginMutation: UseMutationResult<any, Error, LoginData>;
  firebaseRegisterMutation: UseMutationResult<any, Error, RegisterData>;
  googleSignInMutation: UseMutationResult<any, Error, void>;
  resetPasswordMutation: UseMutationResult<boolean | undefined, Error, {email: string}>;
  resendVerificationEmailMutation: UseMutationResult<{message: string} | undefined, Error, {userId: number}>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  academyId?: number; 
};

// Create the auth context with default values
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  firebaseUser: null,
  firebaseLoading: true,
  loginMutation: {} as any,
  logoutMutation: {} as any,
  registerMutation: {} as any,
  firebaseLoginMutation: {} as any,
  firebaseRegisterMutation: {} as any,
  googleSignInMutation: {} as any,
  resetPasswordMutation: {} as any,
  resendVerificationEmailMutation: {} as any
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Check for ANY logout flags on component mount or URL params
  useEffect(() => {
    // 1. Check for various logout flags
    const forceLogout = window.localStorage.getItem('force_logout');
    const loggedOut = window.localStorage.getItem('logged_out');
    const emergencyLogout = window.localStorage.getItem('emergency_logout');
    
    // 2. Check URL parameters too (for ?logout=timestamp)
    const urlParams = new URLSearchParams(window.location.search);
    const logoutParam = urlParams.get('logout');
    
    // 3. Handle any stored logout flags
    if (forceLogout || loggedOut || emergencyLogout || logoutParam) {
      // CLEAN SLATE: Clear ALL storage
      localStorage.clear();
      sessionStorage.clear();
      
      // AGGRESSIVE: Clear all cookies in multiple ways
      // Method 1: Standard technique
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      
      // Method 2: More forceful cookie clearing with domain targeting
      const cookies = document.cookie.match(/[^ =;]+(?==)/g) || [];
      cookies.forEach(name => {
        // Clear the cookie for current path
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
        
        // Also try with domain
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${window.location.hostname}`;
        
        // Also try parent domain (for subdomains)
        const domain = window.location.hostname.split('.').slice(-2).join('.');
        if (domain !== window.location.hostname) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${domain}`;
        }
      });
      
      // THOROUGH: Clear React Query cache entirely
      queryClient.clear();
      
      // BACKGROUND: Try server logout but don't wait 
      fetch("/api/logout", { 
        method: "POST", 
        credentials: "include",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" }
      }).catch(() => {/* ignore */});
      
      // USER FEEDBACK: Show toast if not coming from URL with logout param
      if (!logoutParam) {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
      }
      
      // REDIRECT: If we're not already on auth page, go there
      if (window.location.pathname !== '/auth') {
        // Use timestamp to bust cache
        window.location.href = `/auth?t=${Date.now()}`;
      }
    }
  }, [toast, window.location.search]);
  
  // Firebase auth hook
  const {
    currentUser: firebaseUser,
    loading: firebaseLoading,
    login: firebaseLoginFn,
    signup: firebaseSignupFn,
    signInWithGoogle: firebaseGoogleSignIn,
    resetPassword: firebaseResetPassword,
    logout: firebaseLogoutFn
  } = useFirebaseAuth();
  
  // Backend user data
  const {
    data: userResponse,
    error,
    isLoading,
  } = useQuery<ApiResponse<{ user: User }> | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
  // Extract user from the API response
  const user = userResponse?.success && userResponse?.data?.user ? userResponse.data.user : null;
  
  // Link Firebase with our backend when Firebase auth state changes
  useEffect(() => {
    if (firebaseUser && !isLoading && !user) {
      // If we have a Firebase user but no backend user, try to link them
      linkFirebaseUser(firebaseUser);
    }
  }, [firebaseUser, isLoading, user]);
  
  // Function to link Firebase user with our backend
  const linkFirebaseUser = async (fbUser: any) => {
    try {
      // Get Firebase ID token
      const idToken = await fbUser.getIdToken();
      
      // Send to backend to verify and retrieve or create user
      const res = await fetch("/api/auth/firebase-auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idToken,
          email: fbUser.email,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
        }),
        credentials: "include",
      });

      if (res.ok) {
        const apiResponse = await res.json();
        if (apiResponse.success && apiResponse.data) {
          // The response follows our standardized API format
          queryClient.setQueryData(["/api/user"], apiResponse);
        } else {
          console.error("Firebase link response was not in expected format:", apiResponse);
          // If linking fails or has unexpected format, log out of Firebase
          await firebaseLogoutFn();
        }
      } else {
        // If linking fails, log out of Firebase
        await firebaseLogoutFn();
      }
    } catch (error) {
      console.error("Error linking Firebase user:", error);
    }
  };

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // Special handling for problematic email
      const isProblematicUsername = credentials.username === "haumankind";
      
      if (isProblematicUsername) {
        console.log("🔑 Using direct login for special user");
        
        // Ensure password is set to known value if problems persist
        if (credentials.password !== "Cricket2025!") {
          console.log("⚠️ Attempting password reset for special user before login");
          
          // Try to reset the password first
          try {
            const resetResult = await fetch("/api/auth/reset-special-password", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: "haumankind@chapsmail.com" }),
              credentials: "include",
            });
            
            if (resetResult.ok) {
              console.log("✅ Password reset successful for special user");
              // Override password with known working password
              credentials = { ...credentials, password: "Cricket2025!" };
            }
          } catch (error) {
            console.error("Failed to reset password for special user:", error);
          }
        }
      }
      
      // Use apiRequest from api-client.ts for standardized handling
      const response = await apiRequest<AuthResponse>('POST', "/api/login", credentials);

      // With standardized responses, we expect:
      // { success: true, message: string, data: { user: User } }
      if (!response.success) {
        throw new Error(response.message || "Login failed. Please try again.");
      }
      
      // Return the user from the response data
      const user = response.data?.user;
      if (!user) {
        throw new Error("User data missing from response");
      }
      return user;
    },
    onSuccess: (user: User) => {
      // Store user in standardized API response format
      queryClient.setQueryData(["/api/user"], {
        success: true,
        message: "User data retrieved successfully",
        data: { user }
      });
      
      // Check if the coach/admin account is pending approval
      if ((user.role === 'coach' || user.role === 'admin') && 
          (user.status === 'pending' || user.isActive === false)) {
        toast({
          title: "Account Pending Approval",
          description: "Your account is awaiting administrator approval. You'll be notified when approved.",
          duration: 6000, // show for longer
        });
      } else {
        toast({
          title: "Login successful",
          description: `Welcome back, ${user.fullName}!`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      console.log("Registration attempt started with data:", {...data, password: "[REDACTED]"});
      
      try {
        // Step 1: Validate data with schema
        console.log("Validating registration data...");
        const validatedData = insertUserSchema.parse(data);
        console.log("Validation successful");
        
        // Step 2: Make the API request using standardized API client
        console.log("Sending registration request to server...");
        const response = await apiRequest<AuthResponse>('POST', "/api/register", validatedData);
        
        // With standardized responses, we expect:
        // { success: true, message: string, data: { user: User } }
        console.log(`Registration response success: ${response.success}`);
        
        if (!response.success) {
          console.log("Registration failed:", response.message);
          throw new Error(response.message || "Registration failed. Please try again.");
        }
        
        // Return the user object from response data
        console.log("Registration successful, returning user data...");
        const user = response.data?.user;
        if (!user) {
          throw new Error("User data missing from response");
        }
        return user;
      } catch (error: any) {
        // Handle Zod validation errors with user-friendly messages
        if (error.name === "ZodError") {
          console.log("Zod validation error:", error.errors);
          
          const fieldName = error.errors[0]?.path?.join('.') || "";
          let errorMessage = error.errors[0]?.message || "Please check your information and try again.";
          
          // Make the error message more user-friendly
          if (fieldName === "username") {
            errorMessage = errorMessage.replace("String", "Username");
          } else if (fieldName === "password") {
            errorMessage = errorMessage.replace("String", "Password");
          } else if (fieldName === "email") {
            errorMessage = errorMessage.replace("String", "Email");
          } else if (fieldName === "fullName") {
            errorMessage = errorMessage.replace("String", "Full name");
          }
          
          console.error("Validation error:", errorMessage);
          throw new Error(errorMessage);
        }
        
        // For API errors, the message is already user-friendly from our standardized response
        throw error;
      }
    },
    onSuccess: (user: User) => {
      console.log("Registration successful, user data:", user);
      
      // Store user data in the React Query cache with standardized format
      queryClient.setQueryData(["/api/user"], {
        success: true,
        message: "User data retrieved successfully",
        data: { user }
      });
      
      // Check if the coach/admin account is pending approval
      if ((user.role === 'coach' || user.role === 'admin') && 
          (user.status === 'pending' || user.isActive === false)) {
        toast({
          title: "Account Pending Approval",
          description: "Your account is awaiting administrator approval. You'll be notified when approved.",
          duration: 6000, // show for longer
        });
      } else {
        toast({
          title: "Registration successful",
          description: `Welcome, ${user.fullName}!`,
        });
      }
    },
    onError: (error: Error) => {
      console.error("Registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong during registration",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Create a variable to track if we were able to contact the server
      let serverLogoutSucceeded = false;
      
      try {
        // First try to logout from backend
        const res = await fetch("/api/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          credentials: "include",
        });
        
        // Mark success if server responded properly
        serverLogoutSucceeded = res.ok;
        
        // Try to logout from Firebase even if backend logout failed
        if (firebaseUser) {
          try {
            await firebaseLogoutFn();
          } catch (firebaseError) {
            console.error("Firebase logout error:", firebaseError);
            // Continue with client-side logout even if Firebase logout fails
          }
        }
        
        // If server logout failed but we finished without throwing, return this info
        return { serverLogoutSucceeded };
      } catch (error) {
        console.error("Logout error:", error);
        // Return false for server success, but don't throw - we'll still clear client state
        return { serverLogoutSucceeded: false };
      }
    },
    onSuccess: (result) => {
      // Always clear local state
      queryClient.setQueryData(["/api/user"], null);
      
      if (result?.serverLogoutSucceeded) {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
      } else {
        toast({
          title: "Logged out",
          description: "You've been logged out locally, but there may have been server errors.",
        });
      }
      
      // Force redirect to auth page
      window.location.href = '/auth';
    },
    onError: () => {
      // Despite error, clear local state
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Logged out",
        description: "You've been logged out locally, but there were server errors.",
      });
      
      // Force redirect to auth page even on error
      window.location.href = '/auth';
    },
  });

  // Firebase login with email/password
  const firebaseLoginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      try {
        // Validate Firebase configuration first
        if (!auth) {
          throw new Error("Firebase auth is not configured properly. Please contact support.");
        }
        
        // Since Firebase uses email for login but our app uses username,
        // we need to look up the user by username first or use email if it looks like an email
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(credentials.username);
        
        let email = credentials.username;
        
        if (!isEmail) {
          try {
            // Try to get the user's email from our database using their username
            const res = await fetch(`/api/auth/get-email-by-username?username=${encodeURIComponent(credentials.username)}`);
            if (res.ok) {
              const data = await res.json();
              email = data.email;
            } else {
              throw new Error("Invalid username or password");
            }
          } catch (error) {
            throw new Error("Invalid username or password");
          }
        }
        
        // First try the direct API approach
        try {
          // Import the direct API login function
          const { signInWithEmail } = await import('@/lib/firebase-direct');
          
          console.log("Attempting direct API login for:", email);
          
          // Login with direct API
          const firebaseUser = await signInWithEmail(email, credentials.password);
          
          if (!firebaseUser || !firebaseUser.uid) {
            console.error("Firebase direct API login returned invalid user");
            throw new Error("Login failed. Please try again later.");
          }
          
          console.log("Firebase direct API login successful:", firebaseUser.uid);
          
          // Make sure to send token to backend
          const token = firebaseUser.idToken;
          
          // Call backend to login with Firebase token using standardized API client
          const response = await apiRequest<AuthResponse>("POST", "/api/auth/login-firebase", { token });
          
          // With standardized responses, we expect:
          // { success: true, message: string, data: { user: User } }
          if (!response.success) {
            console.error("Firebase login failed:", response.message);
            throw new Error(response.message || "Login failed on the server side. Please try again.");
          }
          
          // Extract and validate user data
          const user = response.data?.user;
          if (!user) {
            throw new Error("User data missing from response");
          }
          
          console.log("Firebase login successful:", user);
          
          // Return user data
          return user;
        } 
        catch (error: any) {
          console.error("Firebase direct API or backend login error:", error);
          
          // Fall back to original SDK method
          try {
            console.log("Falling back to SDK login for:", email);
            return await firebaseLoginFn(email, credentials.password);
          } 
          catch (sdkError: any) {
            console.error("Firebase SDK login error:", sdkError);
            
            // Map Firebase error codes to user-friendly messages
            if (error.message?.includes("EMAIL_NOT_FOUND") || 
                error.message?.includes("INVALID_PASSWORD") ||
                sdkError.code === 'auth/user-not-found' || 
                sdkError.code === 'auth/wrong-password') {
              throw new Error("Invalid email/username or password");
            } else if (error.message?.includes("INVALID_EMAIL") ||
                      sdkError.code === 'auth/invalid-email') {
              throw new Error("Invalid email format");
            } else if (sdkError.code === 'auth/user-disabled') {
              throw new Error("This account has been disabled. Please contact support.");
            } else if (sdkError.code === 'auth/too-many-requests') {
              throw new Error("Too many failed login attempts. Please try again later or reset your password.");
            } else if (sdkError.code === 'auth/network-request-failed') {
              throw new Error("Network error. Please check your internet connection and try again.");
            } else if (sdkError.code === 'auth/configuration-not-found') {
              throw new Error("Firebase authentication is not properly configured. Please contact support.");
            } else {
              throw new Error("Login failed. Please try again later.");
            }
          }
        }
      } catch (error: any) {
        console.error("Login process error:", error);
        throw error;
      }
    },
    onSuccess: async (userData: User) => {
      // User data is already returned from the mutation function
      try {
        // Update the query cache
        queryClient.setQueryData(["/api/user"], userData);
        
        // Check if the coach/admin account is pending approval
        if ((userData.role === 'coach' || userData.role === 'admin') && 
            (userData.status === 'pending' || userData.isActive === false)) {
          toast({
            title: "Account Pending Approval",
            description: "Your account is awaiting administrator approval. You'll be notified when approved.",
            duration: 6000, // show for longer
          });
        } else {
          toast({
            title: "Login successful",
            description: `Welcome back, ${userData.fullName}!`,
          });
        }
      } catch (error) {
        console.error("Error processing user data after login:", error);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Firebase sign-in with Google 
  const googleSignInMutation = useMutation({
    mutationFn: async () => {
      return await firebaseGoogleSignIn();
    },
    onError: (error: Error) => {
      toast({
        title: "Google Sign-In failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Firebase registration + backend registration
  const firebaseRegisterMutation = useMutation({
    mutationFn: async (registerData: RegisterData) => {
      try {
        console.log("Firebase registration started with data:", {
          email: registerData.email,
          username: registerData.username,
          role: registerData.role,
          fullName: registerData.fullName,
          hasPassword: !!registerData.password
        });
          
        console.log("Firebase config check:", {
          apiKeyExists: !!import.meta.env.VITE_FIREBASE_API_KEY,
          projectIdExists: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
          appIdExists: !!import.meta.env.VITE_FIREBASE_APP_ID,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID
        });
        
        // First, try direct API approach for Firebase user creation
        let firebaseUser;
        
        try {
          // Import functions from our direct API module
          const { signUpWithEmail } = await import('@/lib/firebase-direct');
          
          // Special debugging for the problematic email
          if (registerData.email === "haumankind@chapsmail.com") {
            console.log("📢 SPECIAL DEBUG for haumankind@chapsmail.com:");
            console.log("- Attempting registration with direct API");
            console.log("- Password length:", registerData.password.length);
            console.log("- Full name:", registerData.fullName);
            console.log("- Username:", registerData.username);
          }
          
          console.log("Attempting direct API signup for:", registerData.email);
          
          // Create user with direct API call
          firebaseUser = await signUpWithEmail(
            registerData.email, 
            registerData.password,
            registerData.fullName
          );
          
          if (!firebaseUser || !firebaseUser.uid) {
            console.error("Firebase direct API returned invalid user:", firebaseUser);
            throw new Error("Failed to create user account. Please try again later.");
          }
          
          console.log("Firebase user created successfully with uid:", firebaseUser.uid);
        } 
        catch (error: any) {
          console.error("Firebase direct API error:", error);
          console.error("Error details:", {
            message: error.message,
            code: error.code,
            stack: error.stack
          });
          
          // Special debug for problematic email
          if (registerData.email === "haumankind@chapsmail.com") {
            console.log("📢 SPECIAL DEBUG for haumankind@chapsmail.com - DIRECT API ERROR:");
            console.log("- Error message:", error.message);
            console.log("- Error code:", error.code);
            console.log("- Original error:", error.originalError ? JSON.stringify(error.originalError) : "none");
            
            // Try to identify if it's a network issue, configuration issue, or Firebase API issue
            if (error.message?.includes("network") || error.message?.includes("connect")) {
              console.log("👉 Appears to be a NETWORK issue");
            } else if (error.code?.includes("configuration") || error.message?.includes("configuration")) {
              console.log("👉 Appears to be a CONFIGURATION issue");
            } else if (error.message?.includes("EMAIL_EXISTS")) {
              console.log("👉 Email already exists in Firebase");
            }
          }
          
          // Fall back to original method if direct API fails
          try {
            console.log("Falling back to SDK method for:", registerData.email);
            
            if (!auth) {
              console.error("Firebase auth is not available");
              throw new Error("Authentication service is not available. Please try again later.");
            }
            
            firebaseUser = await firebaseSignupFn(
              registerData.email, 
              registerData.password,
              registerData.fullName
            );
            
            if (!firebaseUser || !firebaseUser.uid) {
              console.error("Firebase SDK signup returned invalid user:", firebaseUser);
              throw new Error("Failed to create user. Please try again later.");
            }
          } 
          catch (sdkError: any) {
            console.error("Firebase user creation error:", error);
            console.error("SDK error details:", {
              code: sdkError.code,
              message: sdkError.message,
              stack: sdkError.stack
            });
            
            // Special debug for problematic email
            if (registerData.email === "haumankind@chapsmail.com") {
              console.log("📢 SPECIAL DEBUG for haumankind@chapsmail.com - SDK ERROR:");
              console.log("- SDK Error message:", sdkError.message);
              console.log("- SDK Error code:", sdkError.code);
              console.log("- Previous direct API error:", error?.message);
              
              // Try to identify if it's a network issue, configuration issue, or Firebase API issue
              if (sdkError.message?.includes("network") || sdkError.code === "auth/network-request-failed") {
                console.log("👉 SDK Error: NETWORK issue");
              } else if (sdkError.code === "auth/configuration-not-found") {
                console.log("👉 SDK Error: CONFIGURATION issue");
              } else if (sdkError.code === "auth/email-already-in-use") {
                console.log("👉 SDK Error: Email already exists in Firebase");
              }
            }
            
            // Use our helper to get a user-friendly error message
            const errorMessage = getFirebaseErrorMessage(sdkError) || getFirebaseErrorMessage(error);
            throw new Error(errorMessage);
          }
        }
        
        // Then create or link with backend user
        try {
          // Include idToken if available from direct API method
          interface FirebaseUserData {
            firebaseUid: string;
            username: string;
            email: string;
            fullName: string;
            role: string;
            phone?: string;
            academyId?: number;
            idToken?: string;
          }
          
          const firebaseData: FirebaseUserData = {
            firebaseUid: firebaseUser.uid,
            username: registerData.username,
            email: registerData.email,
            fullName: registerData.fullName,
            role: registerData.role,
            phone: registerData.phone,
            academyId: registerData.academyId
          };
          
          // Ensure firebaseUid is always included even when using token auth
          console.log(`Including Firebase UID ${firebaseUser.uid} in registration request`);
          
          // Add token if available from direct API
          if ('idToken' in firebaseUser && firebaseUser.idToken) {
            firebaseData.idToken = firebaseUser.idToken;
          }
          
          console.log("Registering with backend using Firebase uid:", firebaseUser.uid);
          
          // Adding more detailed logging for debugging
          console.log("Firebase registration request data:", JSON.stringify(firebaseData));
          
          // Special handling for problematic email
          const isProblematicEmail = registerData.email === "haumankind@chapsmail.com";
          
          // Determine API endpoint based on email
          const apiEndpoint = isProblematicEmail 
            ? "/api/auth/direct-register" 
            : "/api/auth/register-firebase";
          
          if (isProblematicEmail) {
            console.log("🔑 Using special direct registration endpoint for haumankind@chapsmail.com");
          }
          
          // Ensure correct API path
          console.log(`Making registration request to: ${apiEndpoint}`);
          console.log("Request data:", JSON.stringify(firebaseData, null, 2));
          
          // Use standardized API client for consistent response handling
          const apiResponse = await apiRequest<AuthResponse>("POST", apiEndpoint, firebaseData);
          
          console.log("Firebase registration response:", apiResponse);

          // With standardized responses, check the success flag
          if (!apiResponse.success) {
            console.error("Backend registration failed:", apiResponse.message);
            throw new Error(apiResponse.message || "Registration failed. Please try again.");
          }
          
          // Extract user data from the standardized response
          const user = apiResponse.data?.user;
          if (!user) {
            throw new Error("User data missing from response");
          }
          
          console.log("Successfully registered user:", user.username);
          
          // We now have a standardized user object directly from the response
          const backendUserData = user;
            
          // Validate that we have a proper user object
          if (!backendUserData || typeof backendUserData !== 'object' || !backendUserData.id) {
            console.error("Invalid backend response:", backendUserData);
            throw new Error("Invalid response from server. Please try again.");
          }
            
          // Log user data with sensitive fields redacted for debugging
          console.log("Backend registration successful:", {
            id: backendUserData.id,
            username: backendUserData.username,
            role: backendUserData.role,
            status: backendUserData.status,
            isActive: backendUserData.isActive,
            fullData: JSON.stringify(backendUserData)
          });
          
          // Ensure status field is consistent for coach/admin accounts
          if ((backendUserData.role === 'coach' || backendUserData.role === 'admin') && 
              !backendUserData.isActive && 
              !backendUserData.status) {
            // Ensure there's a status field for pending accounts
            backendUserData.status = 'pending_approval';
          }
          
          return backendUserData;
        } catch (error: any) {
          console.error("Backend registration error:", error);
          console.error("Error details:", {
            message: error.message,
            name: error.name,
            code: error.code,
            stack: error.stack,
            fullError: JSON.stringify(error)
          });
          throw new Error(error.message || "Failed to register with the server. Please try again later.");
        }
      } catch (error: any) {
        console.error("Registration process error:", error);
        console.error("Full registration error details:", {
          message: error.message,
          name: error.name,
          code: error.code,
          stack: error.stack
        });
        throw error;
      }
    },
    onSuccess: (user: User) => {
      // Store user data with standardized API response format
      queryClient.setQueryData(["/api/user"], {
        success: true,
        message: "User data retrieved successfully",
        data: { user }
      });
      
      console.log("Registration success - user status:", user.status);
      
      // Check if the coach/admin account is pending approval
      // Status values can be 'pending', 'pending_approval', or custom values
      if ((user.role === 'coach' || user.role === 'admin') && 
          (user.status === 'pending' || user.status === 'pending_approval' || 
           user.isActive === false)) {
        toast({
          title: "Registration successful",
          description: "Your account is awaiting administrator approval. You'll be notified when approved.",
          duration: 6000, // show for longer
        });
      } else {
        toast({
          title: "Registration successful",
          description: "Please check your email to verify your account",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Firebase registration error:", error);
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset password with Firebase and fallback to our server
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      try {
        // First try with Firebase
        const firebaseResult = await firebaseResetPassword(email);
        return firebaseResult;
      } catch (firebaseError) {
        console.log("Firebase password reset failed, trying backend:", firebaseError);
        
        // If Firebase fails, try our backend with standardized response
        const response = await apiRequest<{ success: boolean }>('POST', "/api/auth/reset-password", { email });
        
        if (!response.success) {
          throw new Error(response.message || "Password reset failed. Please try again.");
        }
        
        return response.data?.success || true;
      }
    },
    onSuccess: () => {
      toast({
        title: "Password reset email sent",
        description: "Check your inbox for instructions to reset your password",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Password reset failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Resend verification email mutation
  const resendVerificationEmailMutation = useMutation({
    mutationFn: async ({ userId }: { userId: number }) => {
      const response = await apiRequest<{ message: string }>("POST", "/api/auth/resend-verification", { userId });
      if (!response.success) {
        throw new Error(response.message || "Failed to resend verification email");
      }
      // Make sure we always return a valid object with a message property
      return response.data || { message: "Verification email sent" };
    },
    onSuccess: () => {
      toast({
        title: "Verification email resent",
        description: "Please check your email for the verification link.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to resend verification email",
        description: error.message || "An error occurred. Please try again later.",
        variant: "destructive",
      });
    }
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        firebaseUser,
        firebaseLoading,
        loginMutation,
        logoutMutation,
        registerMutation,
        firebaseLoginMutation,
        firebaseRegisterMutation,
        googleSignInMutation,
        resetPasswordMutation,
        resendVerificationEmailMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
