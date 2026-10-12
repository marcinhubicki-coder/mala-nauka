import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PARTS,PART_BY_ID,structureCatalog,partVariants,partStates,PAGE_TEMPLATES,composeTemplate} from '../shared/structure-model.mjs';
import {renderHomeScreen,renderHomeModeCard,renderHomeProgress,renderHomeSettings} from '../home-screen.mjs';
import {partSample} from '../shared/part-samples.mjs';
import {MISSION_SIZE,missionIllustration} from '../shared/mission-parts.mjs';
import {progressCollectionMarkup,collectionWordMarkup} from '../progress-screen.mjs';
import {migrateAtomicConfig} from '../shared/atomic-config.mjs';
import {visualValue,declarations,elementCSS,elementPartState} from '../shared/element-system.mjs';
import {validateConfig} from '../design-system/model.mjs';
import {designFields} from '../design-system/project-model.mjs';
import {transitionMotion,motionFrames,animateScreen} from '../shared/screen-motion.mjs';
const registry=JSON.parse(await readFile(new URL('../design-system/registry.json',import.meta.url)));
const config=JSON.parse(await readFile(new URL('../design-system/config.json',import.meta.url)));
const modes=['spelling','math','english','flags','reading'];

test('Home has six ordered template slots and actual composed families, without generated poster groups',()=>{
 assert.deepEqual(PAGE_TEMPLATES.home.slots.map(s=>s.recipe),['background-home','image-home-logo-art','button-home-settings','family-home-welcome','container-home-adventures','family-home-modes']);
 const markup=renderHomeScreen({nickname:'Odkrywco',today:0,lastScore:'0 pkt',lastLabel:'Zagraj pierwszą rundę',modeIds:modes,modes:Object.fromEntries(modes.map(mode=>[mode,{name:mode}]))});
 assert.equal([...markup.matchAll(/data-ds-recipe="background-home"/g)].length,1);
 assert.equal([...markup.matchAll(/data-ds-recipe="button-home-card"/g)].length,5);
 let previous=-1;for(const slot of PAGE_TEMPLATES.home.slots){const index=markup.indexOf(`data-ds-recipe="${slot.recipe}"`);assert.ok(index>previous,slot.recipe);previous=index;}
 assert.doesNotMatch(markup,/home-art-backdrop|home-sky-bleed|home-hero-underlap|home-sr-only/);
 assert.throws(()=>composeTemplate('home',{}),/Brak slotu/);
 assert.match(renderHomeSettings(),/<button[^>]*data-ds-atomic="true"/);assert.doesNotMatch(renderHomeSettings(),/<image|<img/);
});
test('decorative symbols are atomic and mode tiles remain composed groups in every surface',()=>{
 for(const id of ['icon-home-target','icon-home-star','button-home-settings']){assert.equal(PART_BY_ID[id].level,'atom');assert.deepEqual(PART_BY_ID[id].children,[]);assert.deepEqual(partVariants(PART_BY_ID[id]).choices,{default:'Domyślny'});}
 assert.equal(PART_BY_ID['button-home-card'].level,'group');
 for(const mode of modes){const production=renderHomeModeCard(mode,partVariants(PART_BY_ID['button-home-card']).choices[mode],'left:0;top:0;width:100%;height:100%');assert.ok(partSample('button-home-card',{mode}).includes(production.slice(production.indexOf('>')+1)));}
 const stats=renderHomeProgress({today:0,lastScore:'0 pkt',lastLabel:'Zagraj pierwszą rundę'},'left:0;top:0;width:100%;height:100%');assert.ok(partSample('container-home-stats').includes(stats.slice(stats.indexOf('>')+1)));
 for(const id of ['container-home-stat-icon','icon-home-stat-backing','icon-home-stat-symbol'])assert.equal(PART_BY_ID[id],undefined);
 for(const p of PARTS)if(p.level==='atom')assert.equal(p.children.length,0,p.id);
});
test('mission has five content modes, five real setup uses and one common protrusion',()=>{
 const mission=structureCatalog(registry).find(p=>p.id==='image-mission');assert.equal(mission.uses.length,5);assert.ok(mission.uses.every(u=>u.view.endsWith('-settings')));
 assert.equal(partVariants(mission).label,'Tryb');assert.deepEqual(Object.keys(partVariants(mission).choices),modes);
 assert.equal(MISSION_SIZE.height-MISSION_SIZE.plateHeight,MISSION_SIZE.overflow);
 const art=modes.map(mode=>missionIllustration(mode));assert.equal(new Set(art).size,5);
 for(const mode of modes){const sample=partSample('image-mission',{mode,assetURL:p=>p});assert.ok(sample.includes(missionIllustration(mode)));assert.match(sample,/viewBox="0 0 350 127"/);}
 assert.match(art[1],/1\+2/);assert.match(art[3],/flags\/adventure\/mission-v1/);assert.match(art[4],/czytanie\/wizard-mission/);
});
test('library collection uses the same production illustration and word card',()=>{
 assert.ok(partSample('container-progress-collection').includes(progressCollectionMarkup()));
 assert.ok(partSample('family-collection').includes(collectionWordMarkup({word:'król',masked:'kr_l',answer:'ó',category:'u/ó'},'mastered')));
 assert.doesNotMatch(partSample('family-collection'),/part-composition|part-surface|player-logo/);
});
test('shared scale and shared state styles reach composed children, preserving explicit local exceptions',()=>{
 const c=structuredClone(config);c.elementStyles['button-home-card']={scale:1.25};c.recipeStates={'button-home-card':{pressed:{scale:1.1}}};c.elementOverrides={home:{'home-mode-spelling':{scale:.9}}};
 validateConfig(c);assert.equal(designFields(c).recipeStates['button-home-card'].pressed.scale,1.1);
 const sample={id:'sample',recipe:'button-home-card',kind:'button',state:'pressed'};
 assert.equal(visualValue(c,'',sample).scale,1.1);assert.equal(visualValue(c,'home',{...sample,id:'home-mode-spelling'}).scale,.9);
 assert.equal(visualValue(c,'', {...sample,state:'default'}).scale,1.25);
 assert.match(elementCSS(c),/data-ds-state="pressed"/);assert.match(declarations({scale:1.25}),/scale:1.25!important/);
 const node={classList:{contains:()=>false},getAttribute:()=>null,matches:()=>false,disabled:false};
 assert.equal(elementPartState(node,PART_BY_ID['icon-home-target'],'dictation'),'default');assert.deepEqual(partStates(PART_BY_ID['icon-home-target']),['default']);
 c.recipeStates['button-home-card'].invented={scale:1};assert.throws(()=>validateConfig(c),/stan przepisu/);
});
test('migration removes obsolete artwork tuning and promotes known instance tuning once',()=>{
 const old=structuredClone(config);old.elementOverrides={'spelling-settings':{primary:{offsetY:18},'spelling-mission-art':{imageScale:1.05},'spacer-muwfhj4u':{width:215}},'spelling-results':{'strong-5':{text:'Zachowaj mnie'}}};
 const next=migrateAtomicConfig(old);assert.deepEqual(migrateAtomicConfig(next),next);assert.equal(next.elementStyles['button-game-start'].offsetY,18);assert.deepEqual(next.elementOverrides,{'spelling-results':{'strong-5':{text:'Zachowaj mnie'}}});
 assert.equal(Object.values(config.elementOverrides).reduce((n,row)=>n+Object.keys(row).length,0),3);validateConfig(next);
});
test('return routes and results use blobs at 1x, speed zero skips and speed two halves time',()=>{
 for(const from of modes.map(m=>m+'-settings').concat('progress')){const motion=transitionMotion(config.motion,from,'home');assert.equal(motion.style,'blob');assert.equal(motion.speed,1);}
 assert.equal(transitionMotion(config.motion,'home','progress').style,'blob');
 assert.deepEqual(motionFrames({...transitionMotion({},'x','y'),speed:0}),[]);
 let options;animateScreen({animate:(_,value)=>{options=value;return {}; }},{style:'blur',duration:1500,distance:0,easing:'ease-out',speed:2},{reduced:false});assert.equal(options.duration,750);
 for(const mode of modes){assert.equal(transitionMotion({},mode+'-settings',mode+'-initial').duration,1500);assert.equal(transitionMotion({},mode+'-initial',mode+'-results').duration,1500);}
 assert.deepEqual(designFields(config).exitTransition,config.exitTransition);
});
test('selecting a library item preserves the three independent scroll positions',async()=>{
 const originalFetch=globalThis.fetch;globalThis.fetch=async()=>({json:async()=>config});
 let LiveRecipes;try{({LiveRecipes}=await import('../design-system/live-recipes.mjs'));}finally{globalThis.fetch=originalFetch;}
 const selectors=['.recipe-library','.recipe-editor','.recipe-context'],old=selectors.map((_,i)=>({scrollTop:250+i*20,scrollLeft:3})),fresh=selectors.map(()=>({scrollTop:0,scrollLeft:0}));let nodes=old;
 const library=Object.create(LiveRecipes.prototype);library.groups=new Map();library.owner={workspace:{querySelector:s=>nodes[selectors.indexOf(s)],querySelectorAll:()=>[]},render:()=>{nodes=fresh;}};
 library.refresh();library.restoreScroll();assert.deepEqual(fresh,old);
});
