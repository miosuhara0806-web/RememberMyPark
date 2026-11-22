import http from 'node:http';
import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.webmanifest': 'application/manifest+json', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.md': 'text/plain; charset=utf-8' };

function serveVideo(request, response, target, size) {
  const headers = { 'Content-Type': 'video/mp4', 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-store' };
  let start = 0;
  let end = size - 1;
  const range = request.headers.range;
  if (range) {
    const [, first, last] = /^bytes=(\d*)-(\d*)$/.exec(range) || [];
    if (first) {
      start = Number(first);
      if (last) end = Math.min(Number(last), end);
    } else if (last) {
      start = Math.max(0, size - Number(last));
    }
    if ((!first && !last) || start > end) {
      response.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` }).end();
      return;
    }
    headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
  }
  headers['Content-Length'] = end - start + 1;
  response.writeHead(range ? 206 : 200, headers);
  if (request.method === 'HEAD' || size === 0) {
    response.end();
    return;
  }
  const stream = createReadStream(target, { start, end });
  stream.on('error', () => response.destroy());
  response.on('close', () => stream.destroy());
  stream.pipe(response);
}

const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const target = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    const relative = path.relative(root, target);
    if (relative.startsWith('..') || path.isAbsolute(relative) || relative.split(path.sep).some(part => part.startsWith('.'))) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const file = await stat(target);
    if (!file.isFile()) throw new Error('Not a file');
    const extension = path.extname(target);
    if (extension === '.mp4') {
      serveVideo(request, response, target, file.size);
      return;
    }
    response.writeHead(200, { 'Content-Type': types[extension] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(await readFile(target));
  } catch {
    response.writeHead(404).end('Not found');
  }
});
server.listen(port, '127.0.0.1', () => console.log(`Remember My Park: http://127.0.0.1:${port}`));
