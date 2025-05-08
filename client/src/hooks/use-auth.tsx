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
      const res = await apiRequest("POST", "/api/login", credentials);
      if (!res.ok) {
        // Handle specific status codes with user-friendly messages
        if (res.status === 401) {
          throw new Error("The username or password you entered is incorrect. Please try again.");
        } else if (res.status === 403) {
          throw new Error("Your account has been locked or deactivated. Please contact support.");
        } else if (res.status === 429) {
          throw new Error("Too many login attempts. Please try again later.");
        } else {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Unable to log in at this time. Please try again later.");
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
        const res = await apiRequest("POST", "/api/register", validatedData);
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          
          if (res.status === 400) {
            if (errorData.message?.includes("Username already exists")) {
              throw new Error("This username is already taken. Please choose a different username.");
            } else if (errorData.message?.includes("Email already exists")) {
              throw new Error("An account with this email already exists. Please use a different email or try logging in.");
            } else {
              throw new Error(errorData.message || "Please check your information and try again.");
            }
          } else if (res.status === 429) {
            throw new Error("Too many registration attempts. Please try again later.");
          } else {
            throw new Error("We couldn't complete your registration at this time. Please try again later.");
          }
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
      await apiRequest("POST", "/api/logout");
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
