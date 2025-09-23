// API response types for the cricket academy app

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiSuccessResponse<T = any> extends ApiResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse extends ApiResponse {
  success: false;
  error: string;
  message?: string;
}

export function isApiSuccess<T>(response: ApiResponse<T>): response is ApiSuccessResponse<T> {
  return response.success === true;
}

export function isApiError<T>(response: ApiResponse<T>): response is ApiErrorResponse {
  return response.success === false;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
  };
  token?: string;
  message?: string;
}

