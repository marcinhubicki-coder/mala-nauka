#!/usr/bin/env node
/**
 * Build fixed cloth surfaces using the existing browser renderer (no second
 * approximation of the lighting, mesh or Nepal alpha).
 *
 * Run: npm install --no-save playwright
 *      node tools/build-flag-cloth-assets.mjs [--all]
 *
 * Chrome must be installed; CI uses the GitHub runner's Chrome.
 */
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { FLAGS } from '../data/flags.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'assets/flags/cloth-prebaked');
const PILOT = ['pl', 'gb', 'ch', 'np', 'jp', 'cf'];
const all = process.argv.includes('--all');
const ids = all ? FLAGS.map(flag => flag.id).sort() : PILOT;
const available = new Set(FLAGS.map(flag => flag.id));
const MAX_BYTES = 150 * 1024;
const MIME = { '.mjs': 'text/javascript', '.js': 'text/javascript', '.html': 'text/html', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.json': 'application/json', '.css': 'text/css' };

for (const id of ids) {
  if (!available.has(id)) throw new Error('Unknown country: ' + id);
}

const server = createServer(async (req, res) => {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;
  if (pathname === '/__flag_builder__') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>');
    return;
  }
  let decoded;
  try { decoded = decodeURIComponent(pathname); }
  catch { res.writeHead(400).end(); return; }
  const file = resolve(ROOT, '.' + decoded);
  if (!file.startsWith(ROOT + sep)) { res.writeHead(403).end(); return; }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});

await mkdir(OUT, { recursive: true });
server.listen(0, '127.0.0.1');
await once(server, 'listening');
const url = 'http://127.0.0.1:' + server.address().port + '/__flag_builder__';
let browser;
const manifest = { version: 1, renderer: 'flagi/flag-cloth.mjs', quality: 'webp/max-150KiB', flags: {} };
try {
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-dev-shm-usage'] });
  } catch {
    browser = await chromium.launch({ headless: true, args: ['--disable-dev-shm-usage'] });
  }
  const page = await browser.newPage({ viewport: { width: 800, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(url);
  for (const id of ids) {
    const result = await page.evaluate(async ({ id, maxBytes }) => {
      const { renderFlagCloth } = await import('/flagi/flag-cloth.mjs?v=8');
      const ratio = id === 'ch' || id === 'va' ? 1 : 4 / 3;
      // Current iPhone 13 Pro cloth is about 447x384 physical pixels.
      // Use a higher resolution: 600px wide, with exactly the same CSS ratio.
      const cssWidth = 200;
      const cssHeight = Math.round(cssWidth * 1.15 / ratio);
      document.body.replaceChildren();
      const wrapper = document.createElement('div');
      wrapper.className = 'flag-cloth';
      const canvas = document.createElement('canvas');
      canvas.className = 'flag-cloth-canvas';
      canvas.style.cssText = 'display:block;width:' + cssWidth + 'px;height:' + cssHeight + 'px';
      canvas.dataset.clothSource = new URL('/assets/flags/svg/' + id + '.svg', location.href).href;
      wrapper.append(canvas);
      document.body.append(wrapper);
      await renderFlagCloth(canvas);
      if (canvas.dataset.clothReady !== 'true' || canvas.width === 0) {
        throw new Error('Canvas failed for ' + id + ': ' + canvas.dataset.clothReady);
      }
      let quality = .94;
      let data = '';
      let bytes = Infinity;
      do {
        data = canvas.toDataURL('image/webp', quality);
        if (!data.startsWith('data:image/webp;base64,')) throw new Error('Browser lacks WebP support');
        bytes = Math.ceil((data.length - 'data:image/webp;base64,'.length) * 3 / 4);
        quality -= .04;
      } while (bytes > maxBytes && quality >= .69);
      if (bytes > maxBytes) throw new Error('Asset exceeds limit for ' + id + ': ' + bytes);
      return { data, width: canvas.width, height: canvas.height, quality: Number((quality + .04).toFixed(2)), buildMs: Number(canvas.dataset.clothBuildMs) };
    }, { id, maxBytes: MAX_BYTES });
    const binary = Buffer.from(result.data.split(',')[1], 'base64');
    const filename = id + '.webp';
    await writeFile(join(OUT, filename), binary);
    manifest.flags[id] = { file: filename, bytes: binary.length, width: result.width, height: result.height, quality: result.quality };
    console.log(id + ': ' + result.width + 'x' + result.height + ', ' + binary.length + ' B, source render ' + result.buildMs + ' ms');
  }
  await writeFile(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log('Generated ' + ids.length + ' prebaked flags in ' + relative(ROOT, OUT));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}