import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type User = { id: string; email?: string; role: "admin"|"coach"|"parent"|"player" };
type Ctx = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthCtx = createContext<Ctx>({
  user: null, loading: true,
  async login(){}, async logout(){}, async refresh(){}
});

const USE_FIREBASE = (import.meta as any).env?.VITE_USE_FIREBASE === "true";

async function whoami(): Promise<User | null> {
  try {
    console.log("🔍 Checking /api/_whoami");
    const r = await fetch("/api/_whoami", { credentials: "include" });
    console.log("🔍 Whoami response status:", r.status);
    if (!r.ok) {
      console.log("🔍 Whoami failed, user not authenticated");
      return null;
    }
    const data = await r.json();
    console.log("🔍 Whoami response:", data);
    return data?.user ?? null;
  } catch (err) {
    console.error("🔍 Whoami error:", err);
    return null;
  }
}

async function serverLogin(email: string, password: string) {
  console.log("🔐 Attempting server login for:", email);
  const r = await fetch("/api/dev/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password })
  });
  console.log("🔐 Login response status:", r.status);
  if (!r.ok) {
    const text = await r.text();
    console.error("🔐 Login failed:", text);
    throw new Error("Login failed: " + text);
  }
  const data = await r.json();
  console.log("🔐 Login success:", data);
}

async function serverLogout() {
  await fetch("/api/logout", { method: "POST", credentials: "include" }).catch(()=>{});
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const u = await whoami();
    setUser(u);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (USE_FIREBASE) {
      // Lazy-load only if you actually enable Firebase
      import("firebase/app").then(async (fb) => {
        const { getApps, initializeApp } = fb as any;
        const apps = getApps?.() ?? [];
        if (!apps.length) {
          const cfg = (import.meta as any).env?.VITE_FIREBASE_CONFIG ? JSON.parse((import.meta as any).env.VITE_FIREBASE_CONFIG) : null;
          if (cfg) initializeApp(cfg);
        }
        const { getAuth, onAuthStateChanged } = await import("firebase/auth");
        const auth = getAuth();
        onAuthStateChanged(auth, async (fbUser) => {
          if (!fbUser) { setUser(null); setLoading(false); return; }
          // Optionally map firebase user → server user via /api/_whoami
          const u = await whoami();
          setUser(u ?? { id: fbUser.uid, email: fbUser.email ?? undefined, role: "parent" });
          setLoading(false);
        });
      }).catch(async () => {
        // If Firebase fails, fall back to server session
        const u = await whoami();
        setUser(u);
        setLoading(false);
      });
    } else {
      // Server-session mode
      refresh();
    }
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    if (USE_FIREBASE) {
      const { getAuth, signInWithEmailAndPassword } = await import("firebase/auth");
      const auth = getAuth();
      await signInWithEmailAndPassword(auth, email, password);
      const u = await whoami();
      setUser(u);
    } else {
      await serverLogin(email, password);
      const u = await whoami();
      setUser(u);
    }
  }, []);

  const logout = useCallback(async () => {
    if (USE_FIREBASE) {
      const { getAuth, signOut } = await import("firebase/auth");
      await signOut(getAuth()).catch(()=>{});
    }
    await serverLogout();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout, refresh }), [user, loading, login, logout, refresh]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(){ return useContext(AuthCtx); }