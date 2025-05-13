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

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
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
          return {
            success: false,
            message: "Not authenticated",
            status: 401
          };
        }
        
        console.log(`Authentication check: Received status ${res.status} for ${queryKey[0]}`);
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
