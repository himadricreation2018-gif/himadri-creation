import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
export async function staticImages(root = 'assets') {
  const images = [];
  async function walk(folder) {
    let entries;
    try { entries = await readdir(path.join(root, folder), { withFileTypes: true }); }
    catch (error) { if (error.code === 'ENOENT') return; throw error; }
    for (const entry of entries) {
      const relative = path.posix.join(folder, entry.name);
      if (entry.isDirectory()) await walk(relative);
      else if (entry.isFile() && /\.(jpe?g|png|webp|avif)$/i.test(entry.name)) {
        const info = await stat(path.join(root, relative));
        images.push({
          src: '/assets/' + relative.split('/').map(encodeURIComponent).join('/'),
          label: `${folder.replace(/^gallery\//, '')} / ${entry.name}`,
          bytes: info.size
        });
      }
    }
  }
  await walk('blog'); await walk('gallery');
  return images.sort((a,b) => a.label.localeCompare(b.label, 'en', { numeric: true }));
}
