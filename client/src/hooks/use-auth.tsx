import { createContext, ReactNode, useContext, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useFirebaseAuth } from "@/lib/firebase";
import { auth } from "@/lib/firebase-init";
import { useLocalAuth } from "./use-local-auth";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  firebaseUser: any;
  firebaseLoading: boolean;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
  firebaseLoginMutation: UseMutationResult<any, Error, LoginData>;
  firebaseRegisterMutation: UseMutationResult<any, Error, RegisterData>;
  googleSignInMutation: UseMutationResult<any, Error, void>;
  resetPasswordMutation: UseMutationResult<boolean, Error, {email: string}>;
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
  resetPasswordMutation: {} as any
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  // Check for force logout flag
  useEffect(() => {
    const forceLogout = window.localStorage.getItem('force_logout');
    if (forceLogout === 'true') {
      // Clear the flag
      window.localStorage.removeItem('force_logout');
      // Clear user data
      queryClient.setQueryData(["/api/user"], null);
      // Show toast
      toast({
        title: "Logged out",
        description: "You have been logged out due to a session error.",
      });
    }
  }, [toast]);
  
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
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });
  
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
        const userData = await res.json();
        queryClient.setQueryData(["/api/user"], userData);
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
      // Direct fetch instead of apiRequest to avoid double body reading
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      });
      
      // Handle specific status codes with user-friendly messages
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("The username or password you entered is incorrect. Please try again.");
        } else if (res.status === 403) {
          throw new Error("Your account has been locked or deactivated. Please contact support.");
        } else if (res.status === 429) {
          throw new Error("Too many login attempts. Please try again later.");
        } else {
          throw new Error("Unable to log in at this time. Please try again later.");
        }
      }
      
      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      
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
      try {
        const validatedData = insertUserSchema.parse(data);
        
        // Direct fetch instead of apiRequest to avoid double body reading
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validatedData),
          credentials: "include",
        });
        
        if (!res.ok) {
          // Clone the response before reading
          const clonedRes = res.clone();
          let errorMessage = "Please check your information and try again.";
          
          try {
            const errorData = await clonedRes.json();
            
            if (res.status === 400) {
              if (errorData.message?.includes("Username already exists")) {
                errorMessage = "This username is already taken. Please choose a different username.";
              } else if (errorData.message?.includes("Email already exists")) {
                errorMessage = "An account with this email already exists. Please use a different email or try logging in.";
              } else if (errorData.message) {
                errorMessage = errorData.message;
              }
            } else if (res.status === 429) {
              errorMessage = "Too many registration attempts. Please try again later.";
            } else {
              errorMessage = "We couldn't complete your registration at this time. Please try again later.";
            }
          } catch (e) {
            // If JSON parsing fails, use generic error message
            if (res.status === 400) {
              errorMessage = "Please check your information and try again.";
            } else if (res.status === 429) {
              errorMessage = "Too many registration attempts. Please try again later.";
            } else {
              errorMessage = "We couldn't complete your registration at this time. Please try again later.";
            }
          }
          
          throw new Error(errorMessage);
        }
        
        return await res.json();
      } catch (error: any) {
        // Handle Zod validation errors with user-friendly messages
        if (error.name === "ZodError") {
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
          
          throw new Error(errorMessage);
        }
        throw error;
      }
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      
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
      toast({
        title: "Registration failed",
        description: error.message,
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
          
          // Call backend to login with Firebase token
          const res = await fetch("/api/auth/login-firebase", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
            credentials: "include",
          });
          
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            console.error("Backend login failed:", errorData);
            throw new Error(errorData.message || "Login failed on the server side. Please try again.");
          }
          
          const userData = await res.json();
          console.log("Backend login successful:", userData);
          
          // Return user data instead of Firebase credentials
          return userData;
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
              message: sdkError.message
            });
            
            // Map Firebase error codes to user-friendly messages
            if (error.message?.includes("EMAIL_EXISTS") || sdkError.code === 'auth/email-already-in-use') {
              throw new Error("This email is already registered. Please use a different email or try logging in.");
            } else if (error.message?.includes("INVALID_EMAIL") || sdkError.code === 'auth/invalid-email') {
              throw new Error("Please enter a valid email address.");
            } else if (error.message?.includes("WEAK_PASSWORD") || sdkError.code === 'auth/weak-password') {
              throw new Error("Password is too weak. Please use a stronger password.");
            } else if (sdkError.code === 'auth/network-request-failed') {
              throw new Error("Network error. Please check your internet connection and try again.");
            } else if (sdkError.code === 'auth/configuration-not-found') {
              throw new Error("Firebase authentication is not properly configured. Please contact support.");
            } else {
              throw new Error("Account creation failed. Please try again later.");
            }
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
          
          // Add token if available from direct API
          if ('idToken' in firebaseUser && firebaseUser.idToken) {
            firebaseData.idToken = firebaseUser.idToken;
          }
          
          console.log("Registering with backend using Firebase uid:", firebaseUser.uid);
          
          const response = await fetch("/api/auth/register-firebase", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(firebaseData),
            credentials: "include",
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Backend registration failed:", errorData);
            throw new Error(errorData.message || "Registration failed on the server side. Please try again.");
          }

          const backendUserData = await response.json();
          console.log("Backend registration successful:", backendUserData);
          return backendUserData;
        } catch (error: any) {
          console.error("Backend registration error:", error);
          throw new Error(error.message || "Failed to register with the server. Please try again later.");
        }
      } catch (error: any) {
        console.error("Registration process error:", error);
        throw error;
      }
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      
      // Check if the coach/admin account is pending approval
      if ((user.role === 'coach' || user.role === 'admin') && 
          (user.status === 'pending' || user.isActive === false)) {
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

  // Reset password with Firebase
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      return await firebaseResetPassword(email);
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
