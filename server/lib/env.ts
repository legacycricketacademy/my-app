export const nodeEnv = (process.env.NODE_ENV || 'development').toLowerCase();
// Only consider prod if explicitly on Render or APP_ENV is set to production
// This prevents local testing from being treated as prod
export const isProd =
  process.env.RENDER === 'true' ||
  process.env.APP_ENV === 'production' ||
  (nodeEnv === 'production' && process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost'));

export const COOKIE_SECRET =
  process.env.SESSION_SECRET || process.env.COOKIE_SECRET || 'dev-cookie-secret-change-me';

export const SESSION_NAME = process.env.SESSION_NAME || 'connect.sid';

export const BASE_URL =
  process.env.BASE_URL || 'http://localhost:3000';

// Log environment on import
console.log('🔧 Environment:', {
  nodeEnv,
  isProd,
  hasSessionSecret: !!process.env.SESSION_SECRET,
  baseUrl: BASE_URL
});

