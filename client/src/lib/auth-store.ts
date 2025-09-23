export type Role = "admin" | "parent";
export type AuthUser = { id: string; email: string; role: Role } | null;
type AuthState = { ready: boolean; user: AuthUser; role: Role | null };

const state: AuthState = { ready: false, user: null, role: null };
const listeners = new Set<() => void>();
let boot: Promise<void> | null = null;

export function getAuthSnapshot(): Readonly<AuthState> {
  return { ...state };
}

export function subscribeAuth(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit() { 
  listeners.forEach((fn) => fn()); 
}

export function setUser(user: AuthUser) {
  state.user = user;
  state.role = (user?.role ?? null) as Role | null;
  if (user) {
    localStorage.setItem("auth:user", JSON.stringify(user));
  } else {
    localStorage.removeItem("auth:user");
  }
  emit();
}

export function setReady(v: boolean) {
  state.ready = v;
  emit();
}

/**
 * Initialize once. Restores user from localStorage for mock/dev or
 * defers to provider-specific init (Keycloak/Firebase), but always
 * sets state.ready=true when finished.
 */
export async function initAuthOnce(initProvider?: () => Promise<AuthUser | null>) {
  if (boot) return boot;
  
  boot = (async () => {
    // Try provider first if supplied
    let user: AuthUser | null = null;
    if (initProvider) {
      try { 
        user = await initProvider(); 
      } catch (error) {
        console.warn('[auth-store] Provider init failed:', error);
      }
    }
    
    // Fallback restore for mock/dev
    if (!user) {
      const raw = localStorage.getItem("auth:user");
      if (raw) {
        try { 
          user = JSON.parse(raw); 
        } catch (error) {
          console.warn('[auth-store] Failed to parse stored user:', error);
          localStorage.removeItem("auth:user");
        }
      }
    }
    
    setUser(user);
    setReady(true);
    
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("[auth-store] ready:", getAuthSnapshot());
    }
  })();
  
  return boot;
}

export function signOutStore() {
  setUser(null);
}
