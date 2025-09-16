import Keycloak from 'keycloak-js';

let keycloak: Keycloak | null = null;

export const initKeycloak = async (): Promise<Keycloak> => {
  if (keycloak) return keycloak;

  keycloak = new Keycloak({
    url: import.meta.env.VITE_KEYCLOAK_URL || "http://localhost:8081",
    realm: import.meta.env.VITE_KEYCLOAK_REALM || "cricket-academy",
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "my-app",
  });

  try {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      pkceMethod: 'S256',
    });

    if (authenticated) {
      console.log('User authenticated');
    }
  } catch (error) {
    console.error('Keycloak init failed:', error);
  }

  return keycloak;
};

export const getKeycloak = (): Keycloak | null => keycloak;

export const getAccessToken = (): string | undefined => {
  return keycloak?.token;
};

export const login = () => {
  keycloak?.login({
    redirectUri: (import.meta.env.VITE_APP_URL || window.location.origin) + (import.meta.env.VITE_REDIRECT_PATH || '/auth/callback'),
  });
};

export const logout = () => {
  keycloak?.logout({
    redirectUri: (import.meta.env.VITE_APP_URL || window.location.origin) + '/auth',
  });
};

export const isAuthenticated = (): boolean => {
  return keycloak?.authenticated || false;
};

export const getUserRoles = (): string[] => {
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || "my-app";
  const resourceAccess = keycloak?.tokenParsed?.resource_access;
  const realmAccess = keycloak?.tokenParsed?.realm_access;
  
  return [
    ...(resourceAccess?.[clientId]?.roles || []),
    ...(realmAccess?.roles || [])
  ];
};
