import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async ({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [
      react(),
      runtimeErrorOverlay(),
      ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer(),
            ),
          ]
        : []),
    ],
    resolve: {
      alias: {
        "@db": path.resolve(__dirname, "db"),
        "@": path.resolve(__dirname, "client", "src"),
        "@shared": path.resolve(__dirname, "shared"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
    },
    root: path.resolve(__dirname, "client"),
    build: {
      outDir: path.resolve(__dirname, "dist/public"),
      emptyOutDir: true,
    },
            define: {
              // Inject environment variables into the client build
              'import.meta.env.VITE_APP_ENV': JSON.stringify(env.VITE_APP_ENV || env.APP_ENV || 'development'),
              'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || '/api'),
              'import.meta.env.VITE_APP_ORIGIN': JSON.stringify(env.VITE_APP_ORIGIN || 'http://localhost:3000'),
              'import.meta.env.VITE_AUTH_PROVIDER': JSON.stringify(env.VITE_AUTH_PROVIDER || env.AUTH_PROVIDER || 'mock'),
              'import.meta.env.VITE_EMAIL_BANNER': JSON.stringify(env.VITE_EMAIL_BANNER || env.EMAIL_BANNER || 'off'),
              'import.meta.env.VITE_KEYCLOAK_URL': JSON.stringify(env.VITE_KEYCLOAK_URL || ''),
              'import.meta.env.VITE_KEYCLOAK_REALM': JSON.stringify(env.VITE_KEYCLOAK_REALM || ''),
              'import.meta.env.VITE_KEYCLOAK_CLIENT_ID': JSON.stringify(env.VITE_KEYCLOAK_CLIENT_ID || ''),
              'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY || ''),
              'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(env.VITE_FIREBASE_PROJECT_ID || ''),
              'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(env.VITE_FIREBASE_APP_ID || ''),
              'import.meta.env.CLIENT_URL': JSON.stringify(env.CLIENT_URL || 'http://localhost:3000'),
            },
  };
});
