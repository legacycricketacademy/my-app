/**
 * Client-side configuration module
 * Centralizes all environment variables and configuration
 */

export interface ClientConfig {
  appEnv: 'development' | 'staging' | 'production';
  apiBaseUrl: string;
  appOrigin: string;
  authProvider: 'mock' | 'keycloak' | 'firebase';
  emailBanner: 'on' | 'off';
  keycloak?: {
    url: string;
    realm: string;
    clientId: string;
  };
  firebase?: {
    apiKey: string;
    projectId: string;
    appId: string;
  };
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = import.meta.env[name];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value || defaultValue || '';
}

function validateAppEnv(env: string): 'development' | 'staging' | 'production' {
  if (env === 'development' || env === 'staging' || env === 'production') {
    return env;
  }
  throw new Error(`Invalid APP_ENV: ${env}. Must be development, staging, or production`);
}

function validateAuthProvider(provider: string): 'mock' | 'keycloak' | 'firebase' {
  if (provider === 'mock' || provider === 'keycloak' || provider === 'firebase') {
    return provider;
  }
  throw new Error(`Invalid AUTH_PROVIDER: ${provider}. Must be mock, keycloak, or firebase`);
}

export const config: ClientConfig = {
  appEnv: validateAppEnv(getEnvVar('VITE_APP_ENV', 'development')),
  apiBaseUrl: getEnvVar('VITE_API_BASE_URL', '/api'),
  appOrigin: getEnvVar('VITE_APP_ORIGIN', 'http://localhost:3000'),
  authProvider: validateAuthProvider(getEnvVar('VITE_AUTH_PROVIDER', 'mock')),
  emailBanner: (getEnvVar('VITE_EMAIL_BANNER', 'off') as 'on' | 'off') || 'off',
  
  // Keycloak configuration (only if auth provider is keycloak)
  ...(getEnvVar('VITE_AUTH_PROVIDER', 'mock') === 'keycloak' && {
    keycloak: {
      url: getEnvVar('VITE_KEYCLOAK_URL'),
      realm: getEnvVar('VITE_KEYCLOAK_REALM'),
      clientId: getEnvVar('VITE_KEYCLOAK_CLIENT_ID'),
    }
  }),
  
  // Firebase configuration (only if auth provider is firebase)
  ...(getEnvVar('VITE_AUTH_PROVIDER', 'mock') === 'firebase' && {
    firebase: {
      apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
      projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
      appId: getEnvVar('VITE_FIREBASE_APP_ID'),
    }
  }),
};

// Validation warnings
if (config.appEnv === 'production' && config.authProvider === 'mock') {
  console.warn('⚠️  WARNING: Using mock authentication in production environment');
}

if (config.appEnv !== 'development' && config.appOrigin.includes('localhost')) {
  console.warn('⚠️  WARNING: Using localhost origin in non-development environment');
}

// Export individual config values for convenience
export const {
  appEnv,
  apiBaseUrl,
  appOrigin,
  authProvider,
  keycloak,
  firebase,
} = config;

// Helper functions
export function getApiUrl(endpoint: string): string {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${apiBaseUrl}${normalizedEndpoint}`;
}

export function getFullUrl(path: string): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${appOrigin}${normalizedPath}`;
}

export function isDevelopment(): boolean {
  return appEnv === 'development';
}

export function isProduction(): boolean {
  return appEnv === 'production';
}

export function isStaging(): boolean {
  return appEnv === 'staging';
}
