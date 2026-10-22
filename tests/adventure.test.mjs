import test from 'node:test';import assert from 'node:assert/strict';
import {defaultAdventure,validateAdventure,campaignSummary,campaignPool,advanceCampaign,claimReward,rewardState,cleanAdventure,modeMetrics,trackAdventure,cupState} from '../shared/adventure-model.mjs';
import {cleanJourney,answerReward,upgradePower,POWERS,powerUpgradeRecipe,sparkBalance} from '../shared/progression.mjs';
const words=Array.from({length:60},(_,i)=>({word:'słowo'+i,category:'u/ó',difficulty:1}));
const profile=()=>({journey:cleanJourney(null),learning:{items:{}}});
test('campaign partitions actual material without gaps and requires the previous step',()=>{const c=validateAdventure(defaultAdventure()),s=campaignSummary(profile(),words,c);assert.equal(s.total,105);for(const mode of ['spelling','english','flags','math','reading'])assert.equal(s.coverage[mode],modeMetrics(profile(),mode,words).total);assert.equal(s.minimumRounds,105);const p=profile(),step=c.steps[1];assert.equal(advanceCampaign(p,{id:'invalid',mode:step.mode,campaignStepId:step.id},words,c).changed,false);});
test('campaign stores incomplete coverage, unlocks once and rejects reward replay',()=>{const c=defaultAdventure(),step=c.steps[0],pool=campaignPool(step,words),p=profile(),attempts=pool.map(w=>({word:w.key,correct:true})),r={id:'round-1',mode:step.mode,campaignStepId:step.id,correct:pool.length,wrong:0,attempts};assert(advanceCampaign(p,r,words,c).complete);assert.equal(advanceCampaign(p,r,words,c).changed,false);assert.deepEqual(p.journey.adventure.campaign.completed,[step.id]);});
test('claim criteria are checked at save time and expected level makes a reveal idempotent',()=>{const c=defaultAdventure(),r=c.recipes[0],p=profile();assert.throws(()=>claimReward(p,r.id,{expectedLevel:0},words,c));for(const w of words.slice(0,5))p.journey.cards[w.word]={correct:1,firstSeenAt:'2026-01-01'};assert(rewardState(r,p,words).ready);const next=claimReward(p,r.id,{expectedLevel:0},words,c);assert.equal(next.journey.adventure.claims[r.id].level,1);assert.throws(()=>claimReward(next,r.id,{expectedLevel:0},words,c));assert(!p.journey.adventure.claims[r.id]);});
test('multi-mode mastery requires independent days and domain receipts cannot duplicate units',()=>{let j=cleanJourney(null);for(const [i,date]of ['2026-01-01','2026-01-02','2026-01-09','2026-01-09','2026-01-09'].entries())j=answerReward(j,{countryId:'pl',correct:true,at:date},{mode:'flags',id:'r:'+String(i+1)}).journey;assert.equal(modeMetrics({journey:j},'flags').mastered,1);const duplicate=answerReward(j,{countryId:'pl',correct:true},{mode:'flags',id:'r:5'});assert.equal(duplicate.journey.adventure.units.flags.pl.correct,5);assert(cupState({journey:j},'flags').ready);});
test('power upgrades cap at three, spend exact costs and keep fractional wallet precision',()=>{let j=cleanJourney(null);j.sparks=5000e6+123;for(const m of Object.keys(j.totals))j.totals[m]=1000;const p=POWERS[0];for(let level=0;level<3;level++)j=upgradePower(j,p.id,level);assert.equal(j.powerLevels[p.id],3);assert.equal(j.sparks%1e6,123);assert.throws(()=>upgradePower(j,p.id,3));assert.equal(POWERS.length,8);});

test('a recipe can combine discovered category words with another mode without leaking other cards',()=>{const p=profile(),c=defaultAdventure(),r=c.recipes[0];r.stages[0]=[{metric:'discovered',target:2,category:'u/ó'},{metric:'correct',target:3,mode:'flags'}];p.journey.cards={...Object.fromEntries(words.slice(0,2).map(w=>[w.word,{correct:2,firstSeenAt:'2026-01-01'}])),other:{correct:50,firstSeenAt:'2026-01-01'}};assert.equal(rewardState(r,p,words).ready,false);for(let i=0;i<3;i++)p.journey.adventure=trackAdventure(p.journey.adventure,'flags',{countryId:'pl',correct:true,at:'2026-01-01'});assert.equal(rewardState(r,p,words).ready,true);assert.equal(rewardState(r,p,words).criteria[0].current,2);});

test('every campaign cohort launches a nonempty source covering all assigned material',async()=>{
 const {readFile}=await import('node:fs/promises'),{campaignRoundSource}=await import('../shared/campaign-round.mjs'),{cleanConfig}=await import('../modes.mjs'),{configureAssets}=await import('../shared/asset-loader.mjs');
 const actual=(await Promise.all(Array.from({length:8},(_,i)=>readFile(new URL('../data/words-0'+(i+1)+'.json',import.meta.url),'utf8').then(JSON.parse)))).flat();configureAssets(JSON.parse(await readFile(new URL('../design-system/assets.json',import.meta.url),'utf8')),'http://localhost/');
 for(const step of defaultAdventure().steps){const config={...cleanConfig(step.mode,step),maxValue:step.maxValue},source=campaignRoundSource(step,config,actual,cleanJourney(null),()=>.3),pool=campaignPool(step,actual);
  if(Array.isArray(source)){assert(source.length>0,step.id);assert.deepEqual(new Set(source.map(q=>q.learningKey||q.word||q.full||q.text)),new Set(pool.map(r=>r.key)),step.id);}
  else {const session={question:0,recentAnswers:[]},seen=new Set();for(let i=0;i<Math.max(1,pool.length*2);i++){const q=source(session);assert(q.options.includes(q.answer),step.id);seen.add(q.countryId||q.learningKey);session.question++;}if(step.mode==='flags')for(const row of pool)assert(seen.has(row.key),step.id+'/'+row.key);}
 }
});

test('bounded reward requirements remain achievable for each mode',()=>{const c=defaultAdventure();for(const r of c.recipes)for(const stage of r.stages)for(const criterion of stage)if(['discovered','mastered','gold'].includes(criterion.metric))assert(criterion.target<=modeMetrics(profile(),r.mode,words).total,r.id+'/'+criterion.metric);});


test('knowledge cup keeps the chosen ornament order and converges to all nine elements',async()=>{
 const {knowledgeMarkup}=await import('../shared/adventure-ui.mjs');let p=profile();
 for(const word of words)p.learning.items[word.word]={word:word.word,masteryEarned:true};
 p=claimReward(p,'knowledge-spelling',{expectedLevel:0},words);
 const order=[8,3,6,1,7,2,5,0,4];
 for(const [i,choice]of order.entries()){
  p=claimReward(p,'knowledge-spelling',{expectedLevel:i+1,choice},words);
  assert.deepEqual(p.journey.adventure.claims['knowledge-spelling'].choices,order.slice(0,i+1));
  const html=knowledgeMarkup(p,'spelling',words);assert(html.includes('data-ornaments="'+order.slice(0,i+1).sort((a,b)=>a-b).join(',')+'"'));assert(!html.includes('◆'));
 }
 assert(cupState(p,'spelling',words).complete);
 assert.equal(new Set(p.journey.adventure.claims['knowledge-spelling'].choices).size,9);
 assert.throws(()=>claimReward(p,'knowledge-spelling',{expectedLevel:10},words));
});
