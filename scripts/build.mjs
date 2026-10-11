import { build } from 'esbuild';
import { cp, mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { readFirebaseConfig, missingFirebaseFields } from './firebase-config.mjs';
import { staticImages } from './static-images.mjs';
if (existsSync('.env')) process.loadEnvFile('.env');
const config = readFirebaseConfig();
const missing = missingFirebaseFields(config);
if (config.projectId === 'himadri-creation' && process.env.FIREBASE_STORAGE_ENABLED === 'true') throw new Error('himadri-creation is configured for Spark. Storage uploads must remain disabled.');
if (missing.length) console.log(`Firebase setup incomplete: missing ${missing.join(', ')}. No connection is claimed.`);
const gallery = spawnSync(process.execPath, ['scripts/generate-gallery.js'], { stdio: 'inherit' });
if (gallery.status !== 0) throw new Error('Gallery generation failed.');
await rm('dist', { recursive: true, force: true });
await mkdir('dist/src', { recursive: true });
for (const path of ['assets','src','index.html','booking.html','careers.html','blog.html','admin.html','gallery-data.json','robots.txt','sitemap.xml']) await cp(path, `dist/${path}`, { recursive: true });
await build({ entryPoints: ['src/blog-app.js','src/admin-app.js'], bundle: true, format: 'esm', minify: true, outdir: 'dist/src', define: { __FIREBASE_CONFIG__: JSON.stringify(config), __STORAGE_ENABLED__: String(process.env.FIREBASE_STORAGE_ENABLED === 'true') }, sourcemap: false });
// Bundle source modules are never directly served with unresolved placeholders.
for (const file of ['firebase.js','blog-store.js','blog-images.js','blog-view.js','blog-core.js','new-menu.js','image-library.js']) await rm(`dist/src/${file}`, { force: true });
await cp('_redirects', 'dist/_redirects');
const images = await staticImages();
await writeFile('dist/blog-images.json', JSON.stringify(images, null, 2) + '\n');
console.log(`Static image picker: ${images.length} existing website images available.`);
if (process.env.PRERENDER_BLOG === 'true') {
  if (!config.projectId || !config.apiKey) throw new Error('Prerendering requires Firebase project ID and API key.');
  const { prerender } = await import('./prerender.mjs');
  await prerender(config);
} else {
  console.log('Article prerendering is disabled. Set PRERENDER_BLOG=true after Firebase setup for crawlable article content/social previews.');
}
console.log('Production build ready in dist/');
