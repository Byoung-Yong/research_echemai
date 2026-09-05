import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootArg = process.argv[2] || '.';
const root = path.resolve(process.cwd(), rootArg);
const port = Number(process.env.PORT || 5173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp'
};

function safePath(urlPath) {
  let decoded = decodeURIComponent(urlPath.split('?')[0]);
  if (decoded.includes('\0')) return null;
  decoded = decoded.replace(/^\/+/, '');
  let candidate = path.resolve(root, decoded || '.');
  if (!candidate.startsWith(root)) return null;
  return candidate;
}

const server = http.createServer(async (req, res) => {
  try {
    let target = safePath(req.url || '/');
    if (!target) throw new Error('Bad path');

    if (existsSync(target)) {
      const s = await stat(target);
      if (s.isDirectory()) target = path.join(target, 'index.html');
    } else if (!path.extname(target) && existsSync(`${target}.html`)) {
      target = `${target}.html`;
    }

    if (!existsSync(target)) {
      const fallback = path.join(root, '404.html');
      res.statusCode = 404;
      if (existsSync(fallback)) target = fallback;
      else {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('404 Not Found');
        return;
      }
    }

    const body = await readFile(target);
    res.setHeader('Content-Type', types[path.extname(target).toLowerCase()] || 'application/octet-stream');
    res.end(body);
  } catch {
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

server.listen(port, '0.0.0.0', () => {
  console.log(`EchemAI Research Notes running at http://localhost:${port}/`);
  console.log(`Serving: ${root}`);
});
