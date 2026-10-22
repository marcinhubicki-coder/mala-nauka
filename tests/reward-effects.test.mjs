import test from 'node:test';import assert from 'node:assert/strict';
import {rewardEffectSettings,validateRewardEffects,progressCount} from '../shared/reward-effects.mjs';
import {puzzleCells,puzzleChain,validateDiscovery} from '../shared/campaign-discovery.mjs';
test('ambient chains use only hidden adjacent pieces, with a hard per-pulse cap',()=>{
 const cells=puzzleCells('triangles'),reveals=cells.map(c=>c.y>.6?1:0),ids=puzzleChain(cells,reveals,{x:.5,y:.3},99,()=>.1);
 assert(ids.length>=3&&ids.length<=24);assert.equal(new Set(ids).size,ids.length);assert(ids.every(i=>reveals[i]<.5));for(let n=1;n<ids.length;n++){const edges=c=>c.points.map((p,i)=>[p,c.points[(i+1)%c.points.length]].map(v=>v.map(x=>x.toFixed(6)).join(',')).sort().join('|'));assert(ids.slice(0,n).some(i=>edges(cells[i]).some(e=>edges(cells[ids[n]]).includes(e))),'new fragment shares an edge with the connected chain');}
 assert.deepEqual(puzzleChain(cells,cells.map(()=>1),{x:.3,y:.3}),[]);
});
test('effect settings reject expensive and invalid values, keeping old projects compatible',()=>{
 assert.doesNotThrow(()=>validateRewardEffects({}));assert.doesNotThrow(()=>validateDiscovery({}));
 for(const value of[{density:99},{stagger:0},{speed:0},{blackout:'yes'},{levels:['electric']}])assert.throws(()=>validateRewardEffects(value));
 for(const value of[{ambientCells:99},{ambientInterval:0},{glowIntensity:4.1},{ambientMaxChains:13},{ambientReveal:1.1},{globalGlowCount:7}])assert.throws(()=>validateDiscovery(value));
 const a=rewardEffectSettings(),b=rewardEffectSettings();a.levels[0]='electric';assert.equal(b.levels[0],'sparks');
});
test('small progress counts pass through whole numbers and settle exactly at the target',()=>{
 const values=new Set(Array.from({length:101},(_,i)=>progressCount(5,i/100)));assert.deepEqual([...values],[0,1,2,3,4,5]);assert.equal(progressCount(5,2),5);assert.equal(progressCount(5,-1),0);
});

test('strong card presets remain bounded and backwards compatible',()=>{assert.doesNotThrow(()=>validateRewardEffects({density:96,intensity:5,glow:64,width:8,roughness:4,spread:3,particleScale:3,speed:4}));assert.throws(()=>validateRewardEffects({density:97}));assert.throws(()=>validateRewardEffects({intensity:5.1}));});
