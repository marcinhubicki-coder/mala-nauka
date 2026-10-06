import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateRules,orthographyFamilies,applyRules,wordsForRule} from '../shared/rules-library.mjs';
import {wordsUsingAsset,mergeAssetAssignments} from '../design-system/content-model.mjs';
import {planStudioMerge,resolveStudioMerge,mergeValues} from '../design-system/merge-model.mjs';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8').then(JSON.parse);
const [config,assets,rules]=await Promise.all(['config','assets','rules'].map(name=>read(`design-system/${name}.json`)));
const words=(await Promise.all(Array.from({length:8},(_,i)=>read(`data/words-0${i+1}.json`)))).flat();
test('central rules cover all words; one deliberate edit propagates and preserves individual examples',()=>{
 validateRules(rules);assert.equal(Object.keys(rules.rules).length,49);assert.equal(Object.keys(rules.assignments).length,475);
 assert.deepEqual(applyRules(words,rules),words);
 const draft=structuredClone(rules),id=draft.assignments.góra.primary;
 draft.rules[id].explanation='Wspólna treść testowa.';draft.rules[id].edited=true;
 const changed=applyRules(words,draft),labels=wordsForRule(draft,id);
 assert.ok(labels.length>1);
 for(let i=0;i<words.length;i++){
  assert.deepEqual(changed[i].learning.examples,words[i].learning.examples);
  assert.equal(changed[i].learning.explanation,labels.includes(words[i].word)?'Wspólna treść testowa.':words[i].learning.explanation);
 }
 assert.notEqual(words.find(w=>w.word==='góra').learning.explanation,'Wspólna treść testowa.');
 draft.assignments.góra.additional=[id];assert.throws(()=>validateRules(draft));
});
test('letter analysis can map several families without inserting words or changing the tested answer',()=>{
 const before=JSON.stringify(rules);
 assert.deepEqual(orthographyFamilies('chrzanić'),['rz/ż','ch/h','ć/ci','ń/ni']);
 assert.deepEqual(orthographyFamilies('CHrZaNiĆ'),orthographyFamilies('chrzanić'));
 assert.deepEqual(orthographyFamilies('budzik'),['u/ó','dź/dzi']);
 assert.equal(rules.assignments.chrzanić,undefined);assert.equal(JSON.stringify(rules),before);
});
test('merging illustration assignments redirects every use and old alias without deleting original files',()=>{
 const paths=[...new Set(Object.values(assets.words).map(row=>row.path))].slice(0,3),base=structuredClone(assets);
 base.aliases['assets/scenes/old.copy.png']=paths[1];const labels=paths.slice(0,2).flatMap(path=>wordsUsingAsset(base,path));
 const next=mergeAssetAssignments(base,paths.slice(0,2),paths[0]);
 assert.equal(next.assets.length,base.assets.length);
 for(const word of labels)assert.equal(next.words[word].path,paths[0]);
 assert.equal(next.aliases['assets/scenes/old.copy.png'],paths[0]);assert.equal(next.aliases[paths[1]],paths[0]);
 assert.deepEqual(wordsUsingAsset(next,paths[0]).sort(),[...new Set(labels)].sort());
 assert.throws(()=>mergeAssetAssignments(base,paths.slice(0,2),paths[2]));
 assert.notEqual(base.words[labels.at(-1)].path,next.words[labels.at(-1)].path);
});
test('conflict choices retain unrelated style, image and rule edits from both sides',()=>{
 const base={config,assets,rules},local=structuredClone(base),remote=structuredClone(base);
 local.config.tokens.jelly.height=60;remote.config.tokens.jelly.height=70;remote.config.tokens.card.radius=28;
 const id=rules.assignments.góra.primary;local.rules.rules[id].explanation='Treść lokalna';remote.rules.rules[id].explanation='Treść GitHub';
 local.rules.assignments.góra.additional=[Object.keys(rules.rules).find(key=>key!==id)];
 const word=Object.keys(assets.words)[0];remote.assets.words[word].manual=true;
 const plan=planStudioMerge(base,local,remote);assert.equal(plan.conflicts.length,2);
 assert.throws(()=>resolveStudioMerge(plan));
 const choices=Object.fromEntries(plan.conflicts.map(row=>[row.id,row.kind==='config'?'local':'remote']));
 const merged=resolveStudioMerge(plan,choices);
 assert.equal(merged.config.tokens.jelly.height,60);assert.equal(merged.config.tokens.card.radius,28);
 assert.equal(merged.rules.rules[id].explanation,'Treść GitHub');assert.deepEqual(merged.rules.assignments.góra.additional,local.rules.assignments.góra.additional);
 assert.equal(merged.assets.words[word].manual,true);
});
test('conflict paths handle dotted filenames and protect object removal against concurrent child edits',()=>{
 const base={'assets/a.copy.png':{title:'A',path:'x'}},local=structuredClone(base),remote=structuredClone(base);
 local['assets/a.copy.png'].title='L';remote['assets/a.copy.png'].title='R';
 assert.deepEqual(mergeValues(base,local,remote,'assets').conflicts[0].path,['assets/a.copy.png','title']);
 const removed=mergeValues({a:{b:1}},{a:{b:2}},{});assert.equal(removed.conflicts.length,1);assert.deepEqual(removed.conflicts[0].path,['a']);
 assert.throws(()=>mergeValues({},JSON.parse('{"__proto__":{"x":1}}'),{safe:true}));
});
