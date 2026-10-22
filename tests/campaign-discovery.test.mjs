import test from 'node:test';import assert from 'node:assert/strict';
import {DISCOVERY_DEFAULTS,puzzleCells,puzzleReveal,puzzleShape,campaignTileChoices,validateDiscovery,puzzleActivityBudget,CAMPAIGN_LIVE_PIECE_LIMIT} from '../shared/campaign-discovery.mjs';
import {CAMPAIGN_ROUTE} from '../shared/campaign-layout.mjs';
import {LEGACY_CAMPAIGN_ROUTE} from '../shared/campaign-layout.mjs';
import {migrateAdventure} from '../shared/adventure-model.mjs';
import {defaultAdventure,advanceCampaign,validateAdventure} from '../shared/adventure-model.mjs';
import {cleanJourney} from '../shared/progression.mjs';
test('puzzle progressively uncovers terrain and never hides a previously revealed piece',()=>{for(const shape of ['triangles','diamonds','squares']){const cells=puzzleCells(shape,12);for(const cell of cells){let previous=0;for(let n=0;n<=15;n++){const value=puzzleReveal(cell,n,CAMPAIGN_ROUTE);assert(value>=previous-1e-9,shape+'/'+cell.id+'/'+n);assert(value>=0&&value<=1);previous=value;}assert.equal(previous,1);}assert(cells.some(c=>puzzleReveal(c,0,CAMPAIGN_ROUTE)<.5));assert(cells.every(c=>puzzleReveal(c,14,CAMPAIGN_ROUTE)===1));}});
test('all puzzle shapes tile the full canvas without changing the map geometry',()=>{for(const shape of ['triangles','diamonds','squares']){const cells=puzzleCells(shape,12),area=cells.reduce((sum,c)=>sum+Math.abs(c.points.reduce((n,p,i)=>{const q=c.points[(i+1)%c.points.length];return n+p[0]*q[1]-q[0]*p[1];},0))/2,0);assert(Math.abs(area-1)<1e-9);assert.equal(new Set(cells.map(c=>c.id)).size,cells.length);}assert.notEqual(puzzleShape('city',DISCOVERY_DEFAULTS),puzzleShape('jungle',DISCOVERY_DEFAULTS));});
test('only the current and earlier route tiles launch rounds; replay does not advance or repeat world rewards',()=>{const config=defaultAdventure(),realm=config.realms[0],p={journey:cleanJourney(null)};p.journey.adventure.campaign.completed=config.steps.slice(0,5).map(s=>s.id);const before=structuredClone(p),choices=campaignTileChoices(p,realm,config);assert.equal(choices.filter(c=>c.enabled).length,6);assert(choices[0].complete);assert(!choices[6].enabled);const result=advanceCampaign(p,{id:'replay',campaignStepId:choices[0].step.id,mode:'spelling',correct:10,wrong:0},[],config);assert.equal(result.changed,true);assert.deepEqual(p.journey.adventure.campaign.completed,before.journey.adventure.campaign.completed);assert.equal(p.journey.sparks,before.journey.sparks);assert.equal(p.journey.adventure.campaign.ratings[choices[0].step.id].stars,5);assert.equal(p.journey.adventure.campaign.presentation.advance,false);});
test('saved discovery settings are validated and disabled mode reveals the original image',()=>{const c=defaultAdventure();assert.doesNotThrow(()=>validateAdventure(c));assert.throws(()=>validateDiscovery({...DISCOVERY_DEFAULTS,density:99}));assert.throws(()=>validateAdventure({...c,discovery:{duration:-1}}));assert.equal(puzzleReveal(puzzleCells()[0],0,CAMPAIGN_ROUTE,{...DISCOVERY_DEFAULTS,enabled:false}),1);});
test('precise tile calibration upgrades old defaults while preserving a manually moved route',()=>{const old=defaultAdventure();delete old.routeVersion;delete old.discovery;for(const r of old.realms)r.route=LEGACY_CAMPAIGN_ROUTE.map(([x,y])=>({x,y}));old.realms[1].route[3].x=.42;const next=migrateAdventure(old);assert.deepEqual(next.realms[0].route,CAMPAIGN_ROUTE);assert.deepEqual(next.realms[1].route,old.realms[1].route);assert.equal(old.routeVersion,undefined);assert.equal(next.routeVersion,2);assert.deepEqual(next.discovery,DISCOVERY_DEFAULTS);});

test('distant path stays undiscovered and fog and kaleidoscope can be toggled independently',()=>{assert.equal(puzzleReveal(CAMPAIGN_ROUTE[0],0,CAMPAIGN_ROUTE),1);assert(puzzleReveal(CAMPAIGN_ROUTE[12],0,CAMPAIGN_ROUTE)<.3);assert.doesNotThrow(()=>validateDiscovery({...DISCOVERY_DEFAULTS,fogEnabled:false,puzzleEnabled:true}));assert.doesNotThrow(()=>validateDiscovery({...DISCOVERY_DEFAULTS,fogEnabled:true,puzzleEnabled:false}));assert.throws(()=>validateDiscovery({...DISCOVERY_DEFAULTS,fogEnabled:'yes'}));});
test('completed progress clears broad terrain behind and to the sides without exposing the far future',()=>{assert.equal(puzzleReveal({x:.05,y:.85},5,CAMPAIGN_ROUTE),1);assert.equal(puzzleReveal({x:.95,y:.85},5,CAMPAIGN_ROUTE),1);assert.equal(puzzleReveal({x:.5,y:.96},5,CAMPAIGN_ROUTE),1);assert(puzzleReveal(CAMPAIGN_ROUTE[14],5,CAMPAIGN_ROUTE)<.5);});

test('simultaneous activity decreases with hidden area and keeps a hard surface budget',()=>{
 for(const shape of ['triangles','diamonds','squares']){
  const cells=puzzleCells(shape),first=cells.map(c=>puzzleReveal(c,0,CAMPAIGN_ROUTE));let previous=7;
  for(let index=0;index<=15;index++){
   const reveals=cells.map(c=>puzzleReveal(c,index,CAMPAIGN_ROUTE)),b=puzzleActivityBudget(cells,reveals,first);
   if(index===0)assert.equal(b.chains,7);assert(b.chains<=previous);assert(b.cellsPerChain*b.chains<=CAMPAIGN_LIVE_PIECE_LIMIT);previous=b.chains;
   if(index===15)assert.equal(b.chains,0);
  }
  const max=puzzleActivityBudget(cells,first,first,{...DISCOVERY_DEFAULTS,ambientMaxChains:12,ambientCells:24});assert.equal(max.chains,12);assert.equal(max.cellsPerChain,16);
  assert.equal(puzzleActivityBudget(cells,first,first,{...DISCOVERY_DEFAULTS,ambientEnabled:false}).chains,0);
 }
});
test('activity uses polygon surface rather than counting differently sized shards',()=>{
 const cells=puzzleCells('diamonds',6),first=cells.map(()=>0),diamond=cells.map(c=>c.points.length===4?0:1),corners=cells.map(c=>c.points.length===3?0:1);
 const a=puzzleActivityBudget(cells,diamond,first),b=puzzleActivityBudget(cells,corners,first);assert(Math.abs(a.fraction-.5)<1e-9);assert(Math.abs(a.fraction-b.fraction)<1e-9);assert.equal(a.chains,b.chains);
});
