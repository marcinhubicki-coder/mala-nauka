import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const markup=readFileSync(new URL('../ortografia/result-screen.mjs',import.meta.url),'utf8');
const css=readFileSync(new URL('../shared/round-result.css',import.meta.url),'utf8');
test('spelling results slider must not inherit the general purpose .primary background',()=>{
 assert.match(markup,/spelling\?'result-again result-continue-rail':'primary result-again result-continue-rail'/);
 assert.match(css,/\.result-again\{border:1px solid #fff7fc;background:radial-gradient/);
});
