import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
const base = path.resolve('dist');
const types = { '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon','.glb':'model/gltf-binary','.xml':'application/xml','.txt':'text/plain' };
http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = path.resolve(base, '.' + pathname);
    if (file !== base && !file.startsWith(base + path.sep)) { res.writeHead(403).end(); return; }
    try { if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html'); await stat(file); }
    catch {
      if (pathname.startsWith('/admin/')) file = path.join(base,'admin.html');
      else if (pathname.startsWith('/blog/')) file = path.join(base,'blog.html');
      else if (!path.extname(pathname)) file = path.join(base, pathname + '.html');
    }
    const data = await readFile(file);
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control':'no-store' }); res.end(data);
  } catch { res.writeHead(404, { 'Content-Type':'text/plain' }).end('Page not found'); }
}).listen(8000, '127.0.0.1', () => console.log('Local: http://127.0.0.1:8000'));
