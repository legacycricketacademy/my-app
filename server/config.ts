/**
 * Server-side configuration module
 * Centralizes all environment variables and configuration
 */

import dotenv from 'dotenv';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : 
                process.env.NODE_ENV === 'production' ? '.env.production' : 
                '.env.development';

dotenv.config({ path: envFile });

export interface ServerConfig {
  appEnv: 'development' | 'staging' | 'production';
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  authProvider: 'mock' | 'keycloak' | 'firebase';
  databaseUrl: string;
  corsAllowedOrigins: string[];
  keycloak?: {
    url: string;
    realm: string;
    clientId: string;
    issuer: string;
    audience: string;
  };
  sendgrid?: {
    apiKey: string;
    fromEmail: string;
    replyToEmail: string;
  };
  clientUrl: string;
}

function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value || defaultValue || '';
}

function getEnvVarOptional(name: string, defaultValue?: string): string | undefined {
  const value = process.env[name];
  return value || defaultValue;
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

function parseCorsOrigins(origins?: string): string[] {
  if (!origins) return ['http://localhost:3000', 'http://localhost:3001'];
  return origins.split(',').map(origin => origin.trim());
}

export const config: ServerConfig = {
  appEnv: validateAppEnv(getEnvVar('APP_ENV', 'development')),
  nodeEnv: (process.env.NODE_ENV as 'development' | 'test' | 'production') || 'development',
  port: parseInt(getEnvVar('PORT', '3000'), 10),
  authProvider: validateAuthProvider(getEnvVar('AUTH_PROVIDER', 'mock')),
  databaseUrl: getEnvVar('DATABASE_URL'),
  corsAllowedOrigins: parseCorsOrigins(getEnvVarOptional('CORS_ALLOWED_ORIGINS')),
  clientUrl: getEnvVar('CLIENT_URL', 'http://localhost:3000'),
  
  // Keycloak configuration (only if auth provider is keycloak)
  ...(getEnvVar('AUTH_PROVIDER', 'mock') === 'keycloak' && {
    keycloak: {
      url: getEnvVar('VITE_KEYCLOAK_URL'),
      realm: getEnvVar('VITE_KEYCLOAK_REALM'),
      clientId: getEnvVar('VITE_KEYCLOAK_CLIENT_ID'),
      issuer: `${getEnvVar('VITE_KEYCLOAK_URL')}/realms/${getEnvVar('VITE_KEYCLOAK_REALM')}`,
      audience: getEnvVar('VITE_KEYCLOAK_CLIENT_ID'),
    }
  }),
  
  // SendGrid configuration (optional)
  ...(getEnvVarOptional('SENDGRID_API_KEY') && {
    sendgrid: {
      apiKey: getEnvVar('SENDGRID_API_KEY'),
      fromEmail: getEnvVar('EMAIL_FROM', 'noreply@legacycricketacademy.com'),
      replyToEmail: getEnvVar('EMAIL_REPLY_TO', 'support@legacycricketacademy.com'),
    }
  }),
};

// Validation and warnings
if (config.appEnv === 'production' && config.authProvider === 'mock') {
  console.warn('⚠️  WARNING: Using mock authentication in production environment');
  throw new Error('Mock authentication is not allowed in production');
}

if (config.appEnv !== 'development' && config.clientUrl.includes('localhost')) {
  console.warn('⚠️  WARNING: Using localhost client URL in non-development environment');
}

if (config.authProvider === 'keycloak' && !config.keycloak) {
  throw new Error('Keycloak configuration is required when AUTH_PROVIDER=keycloak');
}

// Export individual config values for convenience
export const {
  appEnv,
  nodeEnv,
  port,
  authProvider,
  databaseUrl,
  corsAllowedOrigins,
  keycloak,
  sendgrid,
  clientUrl,
} = config;

// Helper functions
export function isDevelopment(): boolean {
  return appEnv === 'development';
}

export function isProduction(): boolean {
  return appEnv === 'production';
}

export function isStaging(): boolean {
  return appEnv === 'staging';
}

export function isTest(): boolean {
  return nodeEnv === 'test';
}

export function getCorsOptions() {
  return {
    origin: corsAllowedOrigins,
    credentials: true,
    optionsSuccessStatus: 200,
  };
}

// Log configuration on startup
console.log('Server Configuration:', {
  appEnv,
  nodeEnv,
  port,
  authProvider,
  hasKeycloak: !!keycloak,
  hasSendgrid: !!sendgrid,
  corsOrigins: corsAllowedOrigins,
});
