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
    // Serve static files from dist/public directory with aggressive caching
    const publicDir = path.resolve(__dirname, "..", "dist", "public");
    app.use(express.static(publicDir, {
      immutable: true,
      maxAge: "365d",
      etag: true
    }));
    
    // Catch-all route to handle client-side routes (SPA routing)
    // This must be after API routes to avoid interfering with them
    // HTML files should NOT be cached (no-store)
    app.get("*", (req, res) => {
      // Only serve index.html for non-API routes and non-file requests
      if (!req.path.startsWith('/api') && !req.path.includes('.')) {
        res.set('Cache-Control', 'no-store');
        res.sendFile(path.join(publicDir, "index.html"));
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    });
  }
}