/**
 * @file server.ts
 * @description Universal Dev & Production Server using native Node HTTP.
 * Zero Express dependency — delegates all API routes to httpsAdapter via nodeBridge.
 * Conforms to Skipo Governance (< 200 lines). Law L8 / Law L23 compliant.
 */

import 'dotenv/config';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { fetchHandler, Env } from './src/backend/adapters/httpsAdapter';
import { adaptNodeRequest } from './src/backend/adapters/nodeBridge';

const PORT = parseInt(process.env.PORT || '3000', 10);

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  let vite: any = null;

  if (!isProd) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
  }

  const server = http.createServer(async (req, res) => {
    const url = req.url || '/';

    // API routes → universal fetchHandler via adaptNodeRequest
    if (url.startsWith('/api/') || url === '/api' || url.startsWith('/health')) {
      return adaptNodeRequest(req, res, (request: Request) =>
        fetchHandler(request, process.env as unknown as Env)
      );
    }

    // Vite dev middleware for HMR and SSR transform
    if (!isProd && vite) {
      vite.middlewares(req, res, async () => {
        try {
          const indexPath = path.resolve(process.cwd(), 'index.html');
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(template);
        } catch (e: any) {
          vite.ssrFixStacktrace(e as Error);
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end(e.stack || e.message);
        }
      });
      return;
    }

    // Production: static asset serving from dist/
    const distPath = path.join(process.cwd(), 'dist');
    const filePath = path.join(distPath, url.split('?')[0]);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mime: Record<string, string> = {
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.html': 'text/html',
        '.json': 'application/json',
        '.png': 'image/png',
        '.svg': 'image/svg+xml',
        '.wasm': 'application/wasm',
      };
      res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
      return;
    }

    // SPA fallback to dist/index.html
    const indexFile = path.join(distPath, 'index.html');
    if (fs.existsSync(indexFile)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(indexFile, 'utf-8'));
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[MyApp] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[MyApp] Failed to start server:', err);
  process.exit(1);
});
