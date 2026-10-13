import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const body=readFileSync(new URL('../ortografia/result-screen.mjs',import.meta.url),'utf8');
const css=readFileSync(new URL('../shared/round-result.css',import.meta.url),'utf8');
test('result scenery actually mounts the approved bunny and meadow art',()=>{
 for(const name of ['result-hero-retina-v5.webp','result-meadow-retina-v4.webp']){
  assert.ok(body.includes(name));
  assert.ok(existsSync(new URL('../assets/ortografia/'+name,import.meta.url)));
 }
 assert.match(body,/class="result-scenery"/);
 assert.match(css,/\.result-scenery\s*\{/);
});
test('round award remains a live points value inside a pearl bubble',()=>{
 assert.match(body,/class="result-points-bubble"/);
 assert.match(body,/scoreResult\(result\)/);
 assert.match(css,/height:calc\(82 \* var\(--result-u\)\)/);
});

test('bunny is scoped to spelling and stays in the offline bootstrap',()=>{
 assert.match(body,/spelling \? '<div class="result-scenery"/);
 const bootstrap=readFileSync(new URL('../tools/offline-cache-policy.mjs',import.meta.url),'utf8');
 for(const name of ['result-hero-retina-v5.webp','result-meadow-retina-v4.webp'])assert.ok(bootstrap.includes(name));
});

test('result collection CTA opens the actual word collection and preserves return to result',()=>{
 assert.ok(body.includes('Moja kolekcja</button>'));
 assert.ok(body.includes('data-history-screen="collection"'));
 const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
 assert.ok(app.includes("button.dataset.historyScreen==='collection'"));
 assert.ok(app.includes("root.querySelector('[data-progress=\"collection\"]')?.click()"));
});
