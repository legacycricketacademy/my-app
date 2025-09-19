// Redirect to the proper compiled server entry point
// This file exists to handle cases where Render tries to run 'node server.js'
// instead of the configured 'npm start' command

console.log('Redirecting to compiled server...');
import('./dist/server/index.js').catch(err => {
  console.error('Failed to load compiled server:', err);
  console.log('Make sure the build process completed successfully');
  process.exit(1);
});
