// Render production start script
// Sets globalThis.ORIGIN and BASE_URL before server starts
globalThis.ORIGIN = process.env.ORIGIN || process.env.CORS_ORIGIN || process.env.APP_URL;

if (!process.env.BASE_URL) {
  process.env.BASE_URL = globalThis.ORIGIN;
}

// Import the ES module server
import('./dist/index.js').catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
