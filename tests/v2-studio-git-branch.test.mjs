import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertStudioBranch} from '../design-system/git-client.mjs';
const config=JSON.parse(readFileSync(new URL('../design-system/config.json',import.meta.url),'utf8'));
test('V2 Studio config declares the same write branch as the V2 preview',()=>{
 assert.equal(config.branch,'refactor/v2-parity-first');
 assert.equal(assertStudioBranch(config.branch,'refactor/v2-parity-first'),true);
});
test('Studio refuses writing configuration from the wrong source branch',()=>{
 assert.throws(()=>assertStudioBranch('design/system-v1','refactor/v2-parity-first'),/Zapis wstrzymany/);
 assert.throws(()=>assertStudioBranch('refactor/v2-parity-first','design/system-v1'),/Zapis wstrzymany/);
 assert.equal(assertStudioBranch('design/system-v1','design/system-v1'),true);
});
