import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
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
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

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
      // Direct fetch instead of apiRequest to avoid any body reading issues
      const res = await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      
      if (!res.ok) {
        throw new Error("Logout failed. Please try again.");
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

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
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
