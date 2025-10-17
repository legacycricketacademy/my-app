/**
 * Debug utility module for auth/session diagnostics
 * Provides opt-in debugging capabilities controlled by environment variables
 */

export const isDebugAuth = process.env.DEBUG_AUTH === 'true';
export const isDebugHeaders = process.env.DEBUG_HEADERS === 'true';

/**
 * Safe logging function that only logs when DEBUG_AUTH is enabled
 * @param args - Arguments to log
 */
export function safeLog(...args: any[]): void {
  if (isDebugAuth) {
    console.log('[DEBUG_AUTH]', ...args);
  }
}

/**
 * Safe header logging function that only logs when DEBUG_HEADERS is enabled
 * @param args - Arguments to log
 */
export function safeLogHeaders(...args: any[]): void {
  if (isDebugHeaders) {
    console.log('[DEBUG_HEADERS]', ...args);
  }
}
