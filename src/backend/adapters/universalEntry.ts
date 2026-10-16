/**
 * @file universalEntry.ts
 * @description Single Universal Backend Entrypoint for DEPM.
 * Runs identically on Cloudflare Workers, Vercel Serverless, and Local Node.js (< 200 lines).
 */

import { fetchHandler, Env } from './httpsAdapter';
import { adaptNodeRequest } from './nodeBridge';

// Polyglot Universal Handler (Node / Vercel)
const universalHandler = async function (req: any, res?: any, env?: any): Promise<any> {
  if (req && res && typeof res.writeHead === 'function') {
    return adaptNodeRequest(req, res, (webReq) => fetchHandler(webReq, (process.env as unknown as Env) || {}));
  }
  return fetchHandler(req, env || res);
};

// Standalone Node.js server launcher (for `node api/index.js` / Docker)
if (
  typeof process !== 'undefined' &&
  process.argv &&
  (process.argv[1]?.endsWith('index.js') || process.argv[1]?.endsWith('server.js'))
) {
  (async () => {
    try {
      const http = await import('node:http');
      const fs = await import('node:fs');
      const path = await import('node:path');

      const port = Number(process.env.PORT) || 3000;
      const distPath = path.resolve(process.cwd(), 'dist');

      const server = http.createServer(async (req, res) => {
        const url = req.url || '/';
        if (url.startsWith('/api/') || url === '/api' || url.startsWith('/health')) {
          return adaptNodeRequest(req, res, (webReq) => fetchHandler(webReq, (process.env as unknown as Env) || {}));
        }

        const filePath = path.join(distPath, url.split('?')[0]);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes: Record<string, string> = {
            '.html': 'text/html', '.js': 'application/javascript',
            '.css': 'text/css', '.json': 'application/json',
            '.png': 'image/png', '.svg': 'image/svg+xml',
          };
          res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
          return fs.createReadStream(filePath).pipe(res);
        }

        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          return fs.createReadStream(indexPath).pipe(res);
        }

        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      });

      server.listen(port, () => {
        console.log(`[DEPM Universal Server] Listening on http://localhost:${port}`);
      });
    } catch (e: any) {
      // In non-node environments, ignore
    }
  })();
}

// Cloudflare Workers ExportedHandler — MUST be `export default { fetch }` object shape.
// Exporting a function (even with .fetch property) is not recognized by the CF runtime.
export default {
  async fetch(request: Request, env: Env = {}, ctx?: any): Promise<Response> {
    return fetchHandler(request, env);
  },
};

export { fetchHandler, adaptNodeRequest, universalHandler };
