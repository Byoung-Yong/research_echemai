import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const entries = ['index.html', '404.html', 'robots.txt', 'sitemap.xml', 'assets', 'article'];

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const entry of entries) {
  const src = path.join(root, entry);
  if (!existsSync(src)) continue;
  const dest = path.join(dist, entry);
  await cp(src, dest, { recursive: true });
}

await writeFile(path.join(dist, '.nojekyll'), '', 'utf8');
console.log('Built deployable static site in dist/');
