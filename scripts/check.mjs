import { readdir, readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
for (const folder of ['src','scripts','tests']) {
  for (const file of await readdir(folder)) {
    if (!/\.(m?js)$/.test(file)) continue;
    const result = spawnSync(process.execPath,['--check',`${folder}/${file}`],{encoding:'utf8'});
    if (result.status !== 0) throw new Error(result.stderr);
  }
}
for (const file of ['index.html','booking.html','careers.html','blog.html','admin.html']) {
  const html = await readFile(file,'utf8');
  if (!html.includes('MEMORYCRAFTED SINCE 2018')) throw new Error(`${file} is missing the brand tagline.`);
  for (const label of ['Home','About','Services','Gallery','Packages','Blog','Career','Contact','Book Now']) if (!html.includes(`>${label}</a>`)) throw new Error(`${file} is missing ${label} navigation.`);
}
console.log('JavaScript syntax and shared navigation checks passed.');
