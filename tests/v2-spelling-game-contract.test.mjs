import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {viewContract,validateViewContract,staticViewInventory,compileViewMarkup,viewAttrs} from '../shared/view-contracts.mjs';
import {PART_BY_ID} from '../shared/structure-model.mjs';
const modes=['spelling-initial','spelling-correct','spelling-wrong','spelling-hint','spelling-pause'];
test('All five gameplay states reuse 17 semantic pieces and two independent buttons',()=>{
 const base=viewContract(modes[0]);
 assert.equal(base.length,17);
 for(const mode of modes){
  assert.equal(validateViewContract(mode),true);
  assert.deepEqual(viewContract(mode).map(item=>item.id),base.map(item=>item.id));
  assert.ok(viewContract(mode).every(item=>PART_BY_ID[item.recipe]),mode);
  assert.equal(staticViewInventory(mode).length,18);
 }
 assert.equal(base.filter(item=>item.action==='answer').length,2);
 assert.equal(base.filter(item=>item.action==='pause').length,1);
 assert.equal(base.filter(item=>item.action==='spelling-hint').length,1);
 assert.equal(base.filter(item=>item.level==='group').length,8);
});
test('Compiled Orthography gameplay correctly keeps both answer actions and its slider independent',()=>{
 const blocks=viewContract('spelling-initial');
 const html=blocks.map(row=>'<div '+viewAttrs('spelling-initial',row.id)+(row.action?' data-action="'+row.action+'"':'')+'></div>').join('');
 assert.equal((compileViewMarkup('spelling-initial',html).match(/data-ds-contract="v2"/g)||[]).length,17);
 assert.throws(()=>compileViewMarkup('spelling-initial',html.replace('data-ds-key="spelling-game-answer-1"','data-ds-key="wrong"')),/undeclared/);
 assert.throws(()=>compileViewMarkup('spelling-initial',html.replace('data-action="spelling-hint"','data-action="not-hint"')),/Action mismatch/);
});
test('Game renderer mounts one compiled scene instead of repeatedly classifying word and answer nodes',()=>{
 const s=readFileSync(new URL('../spelling/art.mjs',import.meta.url),'utf8');
 assert.match(s,/app\.innerHTML = compileViewMarkup\('spelling-initial'/);
 for(const id of ['spelling-game-exit','spelling-game-pause','spelling-game-word','spelling-game-answers','spelling-game-answer-0','spelling-game-answer-1','spelling-game-next','spelling-game-feedback'])assert.ok(s.includes("viewAttrs('spelling-initial','"+id+"')"),id);
 assert.match(s,/if \(session !== game \|\| !nodes\?\.word\.isConnected\) mount\(game\)/);
});
