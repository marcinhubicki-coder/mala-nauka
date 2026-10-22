import test from 'node:test';import assert from 'node:assert/strict';
import {campaignMathQuestion} from '../matematyka/campaign.mjs';
import {defaultAdventure,campaignPool,advanceCampaign} from '../shared/adventure-model.mjs';
import {cleanJourney} from '../shared/progression.mjs';
import {assertScenicArchive} from '../tools/scenic-archive-policy.mjs';
import {readFile} from 'node:fs/promises';
test('all campaign math steps use curriculum ranges, six answers and a supported visual board',()=>{
 const config=defaultAdventure();for(const step of config.steps.filter(s=>s.mode==='math'))for(let i=0;i<100;i++){
  const q=campaignMathQuestion(step);assert.equal(q.mode,step.category);assert.equal(q.answers.length,6);assert.equal(new Set(q.answers).size,6);assert(q.answers.includes(q.correct));assert(campaignPool(step,[]).some(u=>u.key===q.learningKey),step.id+'/'+q.learningKey);
  if(['add','subtract'].includes(q.mode)){assert(q.a>=0&&q.b>=0);assert((q.mode==='add'?q.a+q.b:q.a)<=step.maxValue);assert(q.correct>=0);}
  else{assert(q.rows>=1&&q.rows<=10);assert(q.columns>=1&&q.columns<=10);assert.equal(q.rows*q.columns,q.mode==='divide'?q.a:q.correct);}
 }
});
test('a count-based math step needs the full round and cannot reward a partial exit',()=>{
 const config=defaultAdventure(),step=config.steps.find(s=>s.mode==='math'&&s.limitMode==='count'),p={journey:cleanJourney(null),learning:{items:{}}};p.journey.adventure.campaign.completed=config.steps.slice(0,config.steps.indexOf(step)).map(s=>s.id);
 const r={id:'partial',mode:'math',campaignStepId:step.id,correct:1,wrong:0,attempts:[{correct:true,learningKey:campaignPool(step,[])[0].key}]};assert(!advanceCampaign(p,r,[],config).complete);
 assert(!advanceCampaign(p,{...r,id:'early',correct:step.taskCount,early:true},[],config).complete);
 assert(advanceCampaign(p,{...r,id:'full',correct:step.taskCount},[],config).complete);
});
test('hosted builds reject missing scene materials, geometry, and high-detail atlas tiles',async()=>{
 const required=JSON.parse(await readFile(new URL('../design-system/scenic-assets.json',import.meta.url)));
 assertScenicArchive(required,required);
 for(const path of ['assets/flags/adventure/scenic-scene-v29.webp','assets/maps/atlas-world-v39.data',required.files.find(f=>f.path.includes('atlas-world-v39/4/')).path])assert.throws(()=>assertScenicArchive(required,{files:required.files.filter(f=>f.path!==path)}),/Flagi/);
});
