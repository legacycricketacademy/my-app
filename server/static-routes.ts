import express, { Router } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// In ES modules, __dirname is not available, so we need to create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function setupStaticRoutes(app: express.Express): void {
  // In development, skip static file serving - let Vite handle everything
  // Only set up static routes for production builds
  if (process.env.NODE_ENV === 'production') {
    // Serve static files from dist/public directory
    const publicDir = path.resolve(__dirname, "..", "dist", "public");
    app.use(express.static(publicDir));
    
    // Catch-all route to handle client-side routes (SPA routing)
    // This must be after API routes to avoid interfering with them
    app.get("*", (_, res) => res.sendFile(path.join(publicDir, "index.html")));
  }
}