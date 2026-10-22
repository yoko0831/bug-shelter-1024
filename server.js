/**
 * 云端发布用的静态服务器：先由 npm start 执行 vite build 产出 dist/，
 * 再由本服务把 dist/ 挂在 $PORT 上对外提供（SPA 回退到 index.html）。
 */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('dist', import.meta.url));
const port = Number(process.env.PORT) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

const server = createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (urlPath === '/') urlPath = '/index.html';
    const filePath = normalize(join(root, urlPath));
    if (!filePath.startsWith(root)) {
      res.writeHead(403, { 'Content-Type': MIME['.txt'] });
      res.end('Forbidden');
      return;
    }
    try {
      const data = await readFile(filePath);
      const type = MIME[extname(filePath).toLowerCase()] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
      res.end(data);
    } catch {
      // 未命中静态文件时回退 index.html（应用使用 hash 路由，兜底即可）
      const fallback = await readFile(join(root, 'index.html'));
      res.writeHead(200, { 'Content-Type': MIME['.html'], 'Cache-Control': 'no-cache' });
      res.end(fallback);
    }
  } catch {
    res.writeHead(500, { 'Content-Type': MIME['.txt'] });
    res.end('Internal Server Error');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`bug-shelter static server listening on 0.0.0.0:${port}`);
});
