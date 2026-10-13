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
