import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Clone the response before consuming it to avoid "body stream already read" errors
    const clonedRes = res.clone();
    
    // Try to parse as JSON first
    const contentType = clonedRes.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      try {
        const errorData = await clonedRes.json();
        if (errorData.message) {
          throw new Error(errorData.message);
        }
      } catch (jsonError) {
        // If JSON parsing fails, fall back to text
        try {
          const text = await clonedRes.text() || clonedRes.statusText;
          throw new Error(`${clonedRes.status}: ${text}`);
        } catch (textError) {
          // If both JSON and text parsing fail, return a generic error
          throw new Error(`Request failed with status ${clonedRes.status}`);
        }
      }
    } else {
      // If not JSON, treat as text
      try {
        const text = await clonedRes.text() || clonedRes.statusText;
        throw new Error(`${clonedRes.status}: ${text}`);
      } catch (textError) {
        // If text parsing fails, return a generic error
        throw new Error(`Request failed with status ${clonedRes.status}`);
      }
    }
  }
}

export async function apiRequest<T = any>(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res.json();
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`Fetching ${queryKey[0]}`);
    try {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });

      console.log(`Fetch response status: ${res.status} for ${queryKey[0]}`);

      // Special handling for authentication endpoints
      if (queryKey[0] === "/api/user") {
        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          console.log(`Authentication check: User not authenticated (401) for ${queryKey[0]}`);
          
          // For user info endpoint, return standardized "not authenticated" response
          // This approach ensures that auth checks don't cause errors when not logged in
          return {
            success: false,
            message: "Not authenticated",
            status: 401,
            data: null 
          };
        }
        
        // Log auth check results
        console.log(`Authentication check: Received status ${res.status} for ${queryKey[0]}`);
        
        // Even if the response isn't 401, make sure we clone it before consuming
        const responseForValidation = res.clone();
        
        // Try to parse the response first to check format
        try {
          const data = await responseForValidation.json();
          console.log(`Authentication check: Response data format:`, data);
          
          // Check if response is missing success property but has expected user data
          if (data && data.id && data.role && data.success === undefined) {
            // If this is a legacy format (direct user object without API wrapper),
            // wrap it in our standard API response format
            console.log(`Authentication check: Converting legacy response to standard format`);
            return {
              success: true,
              message: "User data retrieved successfully",
              status: 200,
              data: { user: data }
            };
          }
          // Otherwise return the original response which will be parsed again later
        } catch (e) {
          console.error(`Authentication check: Error parsing response:`, e);
        }
      } else if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log(`Returning null for 401 response to ${queryKey[0]}`);
        return null;
      }

      // Clone the response before validating to ensure we can still read the body later
      // This prevents "body stream already read" errors
      const resForValidation = res.clone();
      await throwIfResNotOk(resForValidation);
      
      try {
        return await res.json();
      } catch (jsonError) {
        console.error('Error parsing JSON:', jsonError);
        throw new Error(`Error parsing response: ${jsonError.message}`);
      }
    } catch (error) {
      console.error(`Error fetching ${queryKey[0]}:`, error);
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
