import { readFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const articleRoot = path.join(root, 'article');
const htmlFiles = [path.join(root, 'index.html')];

for (const name of (await readdir(articleRoot)).sort()) {
  const p = path.join(articleRoot, name, 'index.html');
  if (existsSync(p)) htmlFiles.push(p);
}

const failures = [];
const localRefRe = /(?:href|src)=["']([^"']+)["']/g;

for (const file of htmlFiles) {
  const text = await readFile(file, 'utf8');
  if (/\bWeek\s+\d+/i.test(text)) failures.push(`${file}: contains Week numbering`);
  let m;
  while ((m = localRefRe.exec(text))) {
    const ref = m[1];
    if (/^(?:https?:|mailto:|tel:|#|data:|javascript:)/i.test(ref)) continue;
    const abs = path.resolve(path.dirname(file), ref.split('#')[0].split('?')[0]);
    let ok = existsSync(abs);
    if (ok) {
      try { if ((await stat(abs)).isDirectory()) ok = existsSync(path.join(abs, 'index.html')); } catch { ok = false; }
    }
    if (!ok) failures.push(`${file}: broken local reference ${ref}`);
  }
}

const index = await readFile(path.join(root, 'index.html'), 'utf8');
const nums = [...index.matchAll(/class=["']note-number["'][^>]*>\s*(\d+)\s*</g)].map(x => Number(x[1]));
const expected = Array.from({length: 18}, (_,i) => 18-i);
if (JSON.stringify(nums) !== JSON.stringify(expected)) {
  failures.push(`index numbering/order is ${JSON.stringify(nums)}, expected ${JSON.stringify(expected)}`);
}

const articleDirs = (await readdir(articleRoot)).filter(n => /^\d{3}-/.test(n));
if (articleDirs.length !== 18) failures.push(`expected 18 article directories, found ${articleDirs.length}`);

for (const dir of articleDirs) {
  const n = Number(dir.slice(0,3));
  const text = await readFile(path.join(articleRoot, dir, 'index.html'), 'utf8');
  if (!text.includes(`Research Note ${n}`)) failures.push(`${dir}: Research Note number mismatch`);
}

if (failures.length) {
  console.error('QA failed:');
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}
console.log(`QA passed: ${htmlFiles.length} HTML pages, 18 articles, latest-first archive, local links valid.`);
