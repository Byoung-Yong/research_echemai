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
const titleRe = /<title>([\s\S]*?)<\/title>/i;
const jsonLdRe = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

function tagAttr(text, tagName, attrName, attrValue, wantedAttr) {
  const tagRe = new RegExp(`<${tagName}\\b[^>]*>`, 'gi');
  for (const match of text.matchAll(tagRe)) {
    const tag = match[0];
    const attrRe = new RegExp(`${attrName}=["']([^"']+)["']`, 'i');
    const a = attrRe.exec(tag)?.[1];
    if (a !== attrValue) continue;
    const wantedRe = new RegExp(`${wantedAttr}=["']([^"']+)["']`, 'i');
    return wantedRe.exec(tag)?.[1] ?? null;
  }
  return null;
}

const titles = new Set();
for (const file of htmlFiles) {
  const text = await readFile(file, 'utf8');
  if (/\bWeek\s+\d+/i.test(text)) failures.push(`${file}: contains Week numbering`);

  const title = titleRe.exec(text)?.[1]?.replace(/&amp;/g, '&').trim();
  if (!title) failures.push(`${file}: missing title`);
  else if (titles.has(title)) failures.push(`${file}: duplicate title ${title}`);
  else titles.add(title);

  const description = tagAttr(text, 'meta', 'name', 'description', 'content');
  if (!description) failures.push(`${file}: missing meta description`);
  const canonical = tagAttr(text, 'link', 'rel', 'canonical', 'href');
  if (!canonical?.startsWith('https://research.echemai.com/')) failures.push(`${file}: missing/invalid canonical`);
  const robots = tagAttr(text, 'meta', 'name', 'robots', 'content') ?? '';
  if (!robots.includes('index') || !robots.includes('follow')) failures.push(`${file}: missing index/follow robots meta`);
  const favicon = tagAttr(text, 'link', 'rel', 'icon', 'href');
  if (favicon !== 'https://echemai.com/images/favicon.ico') failures.push(`${file}: missing EchemAI favicon reference`);

  const jsonBlocks = [...text.matchAll(jsonLdRe)].map(m => m[1].trim());
  if (!jsonBlocks.length) failures.push(`${file}: missing JSON-LD`);
  for (const block of jsonBlocks) {
    try { JSON.parse(block.replace(/&amp;/g, '&')); }
    catch (err) { failures.push(`${file}: invalid JSON-LD (${err.message})`); }
  }

  let m;
  localRefRe.lastIndex = 0;
  while ((m = localRefRe.exec(text))) {
    const ref = m[1];
    if (/^(?:https?:|mailto:|tel:|#|data:|javascript:)/i.test(ref)) continue;
    const clean = ref.split('#')[0].split('?')[0];
    if (!clean) continue;
    const abs = path.resolve(path.dirname(file), clean);
    let ok = existsSync(abs);
    if (ok) {
      try { if ((await stat(abs)).isDirectory()) ok = existsSync(path.join(abs, 'index.html')); } catch { ok = false; }
    }
    if (!ok) failures.push(`${file}: broken local reference ${ref}`);
  }
}

const index = await readFile(path.join(root, 'index.html'), 'utf8');
const nums = [...index.matchAll(/class=["']note-number["'][^>]*>\s*(\d+)\s*</g)].map(x => Number(x[1]));
const expected = Array.from({length: 24}, (_,i) => 24-i);
if (JSON.stringify(nums) !== JSON.stringify(expected)) {
  failures.push(`index numbering/order is ${JSON.stringify(nums)}, expected ${JSON.stringify(expected)}`);
}
if (!index.includes('CollectionPage') || !index.includes('ItemList') || !index.includes('WebSite')) {
  failures.push('index structured data missing CollectionPage/ItemList/WebSite');
}

const articleDirs = (await readdir(articleRoot)).filter(n => /^\d{3}-/.test(n));
if (articleDirs.length !== 24) failures.push(`expected 24 article directories, found ${articleDirs.length}`);

for (const dir of articleDirs) {
  const n = Number(dir.slice(0,3));
  const text = await readFile(path.join(articleRoot, dir, 'index.html'), 'utf8');
  if (!text.includes(`Research Note ${n}`)) failures.push(`${dir}: Research Note number mismatch`);
  if (!text.includes('"@type": "BlogPosting"')) failures.push(`${dir}: missing BlogPosting structured data`);
  if (!text.includes('"@type": "BreadcrumbList"')) failures.push(`${dir}: missing BreadcrumbList structured data`);
  const expectedPub = n >= 19 ? '2026-10-01' : '2026-09-05';
  if (!text.includes(`\"datePublished\": \"${expectedPub}\"`)) failures.push(`${dir}: Research Note publication date mismatch`);
  const relatedCount = (text.match(/class=["']related-number["']/g) || []).length;
  if (relatedCount !== 3) failures.push(`${dir}: expected 3 related notes, found ${relatedCount}`);
}

const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const lastmods = [...sitemap.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)].map(m => m[1]);
if (locs.length !== 25) failures.push(`sitemap expected 25 URLs, found ${locs.length}`);
if (lastmods[0] !== '2026-10-01') failures.push('homepage sitemap lastmod must be 2026-10-01');
if (lastmods.slice(1,7).some(x => x !== '2026-10-01')) failures.push('new-note sitemap lastmod must be 2026-10-01');
if (lastmods.slice(7).some(x => x !== '2026-09-05')) failures.push('legacy-note sitemap lastmod must remain 2026-09-05');

const robotsTxt = await readFile(path.join(root, 'robots.txt'), 'utf8');
if (!robotsTxt.includes('Sitemap: https://research.echemai.com/sitemap.xml')) failures.push('robots.txt sitemap URL mismatch');

const notFound = await readFile(path.join(root, '404.html'), 'utf8');
const notFoundRobots = tagAttr(notFound, 'meta', 'name', 'robots', 'content') ?? '';
if (notFoundRobots !== 'noindex,follow') failures.push('404.html must be noindex,follow');

if (failures.length) {
  console.error('QA failed:');
  for (const f of failures) console.error(`- ${f}`);
  process.exit(1);
}
console.log(`QA passed: ${htmlFiles.length} indexable HTML pages, 24 articles, unique titles, Article/Breadcrumb JSON-LD, related-note links, sitemap dates, and local links valid.`);
