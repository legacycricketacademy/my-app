// client/src/lib/api-config.ts
// Single source of truth for API configuration

// Get API base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 
                     process.env.VITE_API_URL || 
                     process.env.REACT_APP_API_URL ||
                     'https://cricket-academy.lindy.site:3002';

// Compile-time guard to catch wrong ports
if (API_BASE_URL?.includes(':24678')) {
  throw new Error('Misconfigured API base URL: port 24678 is not allowed');
}

if (!API_BASE_URL) {
  throw new Error('API_BASE_URL missing - check environment variables');
}

console.log('API Configuration:', { API_BASE_URL });

export { API_BASE_URL };
