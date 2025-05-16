import { ApiResponse, ApiSuccessResponse, ApiErrorResponse, isApiSuccess, isApiError } from '@shared/api-types';
import { useToast } from '@/hooks/use-toast';

/**
 * Handler for API responses with toast notifications
 * @param response The API response from the server
 * @param options Optional configuration
 * @returns The data from the response if successful, undefined otherwise
 */
export function handleApiResponse<T = any>(
  response: ApiResponse<T>,
  options: {
    showSuccessToast?: boolean;
    showErrorToast?: boolean;
    successTitle?: string;
    errorTitle?: string;
  } = {}
): T | undefined {
  const { toast } = useToast();
  const {
    showSuccessToast = true,
    showErrorToast = true,
    successTitle = 'Success',
    errorTitle = 'Error'
  } = options;

  if (isApiSuccess(response)) {
    if (showSuccessToast) {
      toast({
        title: successTitle,
        description: response.message,
        variant: 'default'
      });
    }
    return response.data;
  }

  if (isApiError(response) && showErrorToast) {
    toast({
      title: errorTitle,
      description: response.message,
      variant: 'destructive'
    });
  }

  return undefined;
}

/**
 * Extract the error fields from a validation error response
 * @param response API error response
 * @returns Array of field names with errors, or empty array if not a validation error
 */
export function getValidationErrorFields(response: ApiResponse): string[] {
  if (isApiError(response) && response.error === 'InvalidInputFormat' && response.fields) {
    return response.fields;
  }
  return [];
}

/**
 * Check if an API error is a specific type
 * @param response API response to check
 * @param errorType Error type to check for
 * @returns True if the response is an error of the specified type
 */
export function isErrorType(response: ApiResponse, errorType: string): boolean {
  return isApiError(response) && response.error === errorType;
}

/**
 * Handle a fetch response and convert to ApiResponse
 * @param response Fetch Response object
 * @returns Promise resolving to ApiResponse
 */
export async function handleFetchResponse<T = any>(response: Response): Promise<ApiResponse<T>> {
  try {
    const data = await response.json();
    
    // Handle both new standardized format and legacy format
    if (data.hasOwnProperty('success')) {
      return data as ApiResponse<T>;
    }
    
    // Legacy format - convert to new format
    if (response.ok) {
      return {
        success: true,
        message: 'Operation successful',
        data: data
      };
    } else {
      return {
        success: false,
        message: data.message || 'An error occurred',
        error: data.error || 'UnknownError'
      };
    }
  } catch (err) {
    // Non-JSON response or network error
    return {
      success: false,
      message: 'Failed to process server response',
      error: 'InvalidResponse'
    };
  }
}