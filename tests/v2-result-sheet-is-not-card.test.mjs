import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('Full-screen spelling results must not inherit setup-card padding',()=>{
 const css=readFileSync(new URL('../shared/components.css',import.meta.url),'utf8');
 const selector=css.match(/#app\[data-ds\] :is\(([^)]+)\)\{border-radius:calc\(var\(--ds-card-radius\)/);
 assert.ok(selector);
 assert.equal(selector[1].includes('.result-sheet'),false);
 const result=readFileSync(new URL('../shared/round-result.css',import.meta.url),'utf8');
 assert.match(result,/\.result-sheet\{[^}]*padding:0 calc\(16 \* var\(--result-u\)\) calc\(14 \* var\(--result-u\)\)/);
 const registry=JSON.parse(readFileSync(new URL('../design-system/registry.json',import.meta.url),'utf8'));
 assert.equal(registry.components.find(x=>x.id==='card').selector.includes('.result-sheet'),false);
});
