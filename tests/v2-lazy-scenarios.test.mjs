import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('Game entry never eagerly imports Studio fixture or example data',()=>{
 const top=app.slice(0,app.indexOf('const root='));
 for(const name of ['design-system/scenarios.mjs','progress-example.mjs','ortografia/result-example.mjs'])assert.ok(!top.includes(name),'Unexpected eager import '+name);
 assert.match(app,/const \{exampleProgress\}=await import/);
 assert.match(app,/const \{createStudioGame\}=await import/);
 assert.match(app,/const \{exampleResult\}=await import/);
});
