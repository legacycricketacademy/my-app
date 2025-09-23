import { createServer as createViteDevServer } from 'vite';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setupVite() {
  const vite = await createViteDevServer({
    server: { middlewareMode: true },
    root: path.resolve(__dirname, '../client'),
    build: {
      outDir: path.resolve(__dirname, '../dist/public'),
    },
  });

  return vite;
}

export function serveStatic() {
  // Static file serving for production
  return (req: any, res: any, next: any) => {
    next();
  };
}

export function log(message: string) {
  console.log(message);
}
