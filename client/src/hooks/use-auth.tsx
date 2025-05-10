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
  email: string;
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

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
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
      toast({
        title: "Login successful",
        description: `Welcome back, ${user.fullName}!`,
      });
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
      toast({
        title: "Registration successful",
        description: `Welcome, ${user.fullName}!`,
      });
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
      try {
        // First logout from backend
        const res = await fetch("/api/logout", {
          method: "POST",
          credentials: "include",
        });
        
        if (!res.ok) {
          throw new Error("Logout failed. Please try again.");
        }
        
        // Then logout from Firebase
        if (firebaseUser) {
          await firebaseLogoutFn();
        }
      } catch (error) {
        console.error("Logout error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Firebase login with email/password
  const firebaseLoginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      return await firebaseLoginFn(credentials.email, credentials.password);
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
    mutationFn: async (userData: RegisterData) => {
      // First, create Firebase user
      const firebaseUser = await firebaseSignupFn(
        userData.email, 
        userData.password,
        userData.fullName
      );
      
      // Then create or link with backend user
      const res = await fetch("/api/auth/register-firebase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firebaseUid: firebaseUser.uid,
          username: userData.username,
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role,
          phone: userData.phone,
          academyId: userData.academyId
        }),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Backend registration failed");
      }

      return await res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Registration successful",
        description: "Please check your email to verify your account",
      });
    },
    onError: (error: Error) => {
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
