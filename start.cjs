// Render production start script (ESM wrapper)
// Sets globalThis.ORIGIN and BASE_URL before server starts
(async () => {
  const origin = process.env.ORIGIN || process.env.CORS_ORIGIN || process.env.APP_URL;
  if (origin) globalThis.ORIGIN = origin;
  if (!process.env.BASE_URL && origin) process.env.BASE_URL = origin;
  
  // Import the ES module server
  await import('./dist/index.js');
})().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
