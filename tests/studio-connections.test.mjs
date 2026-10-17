import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {orthogonalRoute,segmentHitsRect,roundedRoute,focusConnectionControl,drawMapConnections} from '../design-system/map-connections.mjs';
import {screenLinks,routeKey} from '../shared/navigation.mjs';
import {flowEdges,motionEdges} from '../shared/flow-model.mjs';
import {motionFrames,transitionMotion,animateScreen} from '../shared/screen-motion.mjs';
import {mapViewIcon} from '../design-system/studio-ui.mjs';
import {EXIT_BLOB_CONFIG} from '../shared/screen-blob-transition.mjs';
import {logoFrame,logoTiming} from '../shared/logo-transition.mjs';
import {StudioSound} from '../design-system/studio-sound.mjs';
const registry=JSON.parse(await readFile(new URL('../design-system/registry.json',import.meta.url)));
test('round start and string targets appear consistently in screen maps and transitions',()=>{
 for(const mode of ['spelling','english','flags','reading','math']){
  assert.ok(screenLinks(registry,mode+'-settings').some(r=>r.action==='start'&&r.to===mode+'-initial'));
  assert.ok(motionEdges(registry).some(r=>r.from===mode+'-results'&&r.to===mode+'-initial'));
  assert.equal(registry.views.find(v=>v.id===mode+'-initial').name.includes(' · gra'),true);
 }
 const home=screenLinks(registry,'home');assert.equal(home.length,7);assert.equal(new Set(home.map(r=>routeKey(r.from,r.action,r.context))).size,7);
 assert.ok(!flowEdges(registry).some(r=>r.to.length===1),'string targets must not become individual letters');
 assert.equal(mapViewIcon(registry.views.find(v=>v.id==='home')),'home');assert.equal(mapViewIcon(registry.views.find(v=>v.id==='players')),'users');
});
test('seven outgoing routes and return routes avoid every card, including intervening columns',()=>{
 const cards=[];for(let col=0;col<5;col++)for(let row=0;row<5;row++)cards.push({left:24+col*208,top:80+row*224,width:160,height:188+(row%2)*12});
 const source=cards[5],targets=[cards[10],cards[11],cards[12],cards[13],cards[14],cards[6],cards[20]];
 for(const target of targets)for(const [from,to]of [[source,target],[target,source]]){
  const points=orthogonalRoute(from,to,cards);assert.ok(points.length>=2);assert.ok(roundedRoute(points).startsWith('M '));
  for(let i=1;i<points.length;i++)assert.ok(!cards.some(r=>segmentHitsRect(points[i-1],points[i],r)),'route crosses a card');
 }
});
test('map SVG represents every connection separately, with directional arrows and keyboard selection',()=>{
 const cards=[{id:'home',left:20,top:50,width:160,height:180},...Array.from({length:7},(_,i)=>({id:'target-'+i,left:228,top:50+i*220,width:160,height:180}))];
 const map={scrollWidth:440,scrollHeight:1650,getBoundingClientRect:()=>({left:0,top:0}),querySelectorAll:()=>cards.map(r=>({getAttribute:()=>r.id,getBoundingClientRect:()=>r}))};
 const svg={setAttribute(){},innerHTML:''};const links=cards.slice(1).map(r=>({from:'home',to:r.id,key:r.id,label:'Home → '+r.id}));
 drawMapConnections({map,svg,cardSelector:'x',keyAttribute:'id',links,selected:'target-3'});
 assert.equal([...svg.innerHTML.matchAll(/data-map-connection=/g)].length,7);assert.equal([...svg.innerHTML.matchAll(/marker-end=/g)].length,7);assert.equal([...svg.innerHTML.matchAll(/aria-pressed="true"/g)].length,1);assert.match(svg.innerHTML,/tabindex="0"/);
});
test('connection selection opens, scrolls and focuses a control without opening its option list',()=>{
 const previous=globalThis.matchMedia;globalThis.matchMedia=()=>({matches:false});const events=[],details={open:false},row={classList:{add(){}}};
 const control={closest:selector=>selector==='details'?details:row,scrollIntoView:()=>events.push('scroll'),focus:()=>events.push('focus')};
 try{focusConnectionControl(control);assert.equal(details.open,true);assert.deepEqual(events,['scroll','focus']);}finally{globalThis.matchMedia=previous;}
});
test('round-end preview uses the existing blur contract and reduced motion avoids animation',()=>{
 const motion=transitionMotion({},'spelling-initial','spelling-results');assert.equal(motion.style,'blur');assert.equal(motion.duration,1500);assert.equal(motionFrames(motion)[0].filter,'blur(28px)');
 assert.equal(animateScreen({animate(){throw Error('must not animate');}},motion,{reduced:true}),null);
 const timing=logoTiming(EXIT_BLOB_CONFIG);assert.equal(logoFrame(EXIT_BLOB_CONFIG,390,844,timing.orbit).stage,'Kolorowe bloby');assert.equal(EXIT_BLOB_CONFIG.soundInParent,false,'screen animation owns its audio timeline');
});
test('closing the Sound Lab task test removes its live iframe and stops preview audio',()=>{
 const state={removed:0,stopped:0},stage={innerHTML:''},button={hidden:false};
 const sound=Object.create(StudioSound.prototype);sound.gameFrame=()=>({remove:()=>state.removed++});sound.engine={stop:()=>state.stopped++};sound.clearCheck=()=>{};sound.status=()=>{};sound.workspace={querySelector:selector=>selector.includes('game-stage')?stage:button};
 sound.closeTest();assert.equal(state.removed,1);assert.equal(state.stopped,1);assert.equal(button.hidden,true);assert.match(stage.innerHTML,/Test zakończony/);
});
