// shared/api-types.ts
//
// Standardized API response and request types for consistent client-server communication
// This file defines the contract between frontend and backend
// 
// Usage:
// - Backend: Import and use these types when constructing API responses
// - Frontend: Import and use these types when making API requests and handling responses

import { User } from './schema';

// Generic API response wrapper for all endpoints
export interface ApiResponse<T = any> {
  success: boolean;        // Whether the request was successful
  message: string;         // Human-readable message (success or error)
  data?: T;                // Optional response data
  code?: string;           // Optional error/success code for programmatic handling
  status?: number;         // HTTP status code
  timestamp?: string;      // Response timestamp
}

// Authentication-specific response types
export interface AuthResponse {
  user: User;                      // User data
  emailSent?: boolean;             // Whether a verification email was sent
  verificationLink?: string;       // Optional verification link for testing
  emailStatus?: 'sent' | 'failed' | 'pending'; // Status of verification email
  isVerified?: boolean;            // Whether the user's email is verified
  tokenExpires?: number;           // Optional token expiration time
}

// Login Request
export interface LoginRequest {
  username: string;
  password: string;
}

// Registration Request
export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  academyId?: number;
}

// Firebase-specific Auth Types
export interface FirebaseRegisterRequest {
  firebaseUid: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  phone?: string;
  academyId?: number;
  idToken?: string;
}

// Password Reset Request
export interface PasswordResetRequest {
  email: string;
}

// Password Reset Confirmation
export interface PasswordResetConfirmRequest {
  token: string;
  password: string;
}

// Email Verification Request
export interface EmailVerificationRequest {
  token: string;
}

// Coach Approval Request
export interface CoachApprovalRequest {
  userId: number;
  approve: boolean;
  reason?: string;
}

// Academy-specific API types
export interface AcademyResponse {
  id: number;
  name: string;
  slug: string;
  locations: string[];
  createdAt: string;
}

export interface CreateAcademyRequest {
  name: string;
  slug: string;
  locations?: string[];
}

// Response for multi-tenant operations
export interface MultiTenantResponse<T = any> extends ApiResponse<T> {
  academyId?: number;
  academySlug?: string;
}