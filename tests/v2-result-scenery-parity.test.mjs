import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const body=readFileSync(new URL('../ortografia/result-screen.mjs',import.meta.url),'utf8');
const css=readFileSync(new URL('../shared/round-result.css',import.meta.url),'utf8');
test('results use the production unified background and no duplicate image DOM',()=>{
 const viewport=readFileSync(new URL('../pwa-viewport.css',import.meta.url),'utf8');
 assert.ok(existsSync(new URL('../assets/ortografia/result-background-v6.webp',import.meta.url)));
 assert.ok(viewport.includes('result-background-v6.webp'));
 assert.ok(!body.includes('class="result-scenery"'));
 assert.ok(!css.includes('background:linear-gradient(180deg,#c8baf8'));
});
test('round award remains a live points value inside a pearl bubble',()=>{
 assert.match(body,/class="result-points-bubble"/);
 assert.match(body,/scoreResult\(result\)/);
 assert.match(css,/height:calc\(82 \* var\(--result-u\)\)/);
});

test('one unified results background is precached without duplicate image resources',()=>{
 const bootstrap=readFileSync(new URL('../tools/offline-cache-policy.mjs',import.meta.url),'utf8');
 assert.ok(bootstrap.includes('result-background-v6.webp'));
 assert.ok(!bootstrap.includes('result-hero-retina-v5.webp'));
 assert.ok(!bootstrap.includes('result-meadow-retina-v4.webp'));
});

test('result collection CTA opens the actual word collection and preserves return to result',()=>{
 assert.ok(body.includes('Moja kolekcja</button>'));
 assert.ok(body.includes('data-history-screen="collection"'));
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.ok(app.includes("button.dataset.historyScreen==='collection'"));
 assert.ok(app.includes("root.querySelector('[data-progress=\"collection\"]')?.click()"));
});
