import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
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
  server: {
    host: true,
    port: process.env.PORT || 3001,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'cricket-academy-3.lindy.site',
      '3000-i6emb1822akllwmlbgna0-6532622b.e2b.app',
      /\.lindy\.site$/,
      /\.e2b\.app$/
    ],
    proxy: {
      '/api': { target: 'http://localhost:3002', changeOrigin: true }
    }
  },
  preview: {
    port: 4173,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'cricket-academy-3.lindy.site',
      '3000-i6emb1822akllwmlbgna0-6532622b.e2b.app',
      /\.lindy\.site$/,
      /\.e2b\.app$/
    ]
  },
  resolve: {
    alias: {
      "@db": path.resolve(import.meta.dirname, "db"),
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
})
