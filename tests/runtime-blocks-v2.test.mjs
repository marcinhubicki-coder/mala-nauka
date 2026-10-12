import test from 'node:test';
import assert from 'node:assert/strict';
import {blockIdentity,runtimeCatalog,runtimeStack,runtimeLevel,runtimeRendererReady} from '../shared/runtime-blocks.mjs';
import {rawVisualValue,elementCSS,validateElementStyles} from '../shared/element-system.mjs';

// Minimal DOM contracts make identity tests independent of a browser engine.
const node=(tag,classes=[],attrs={},children=[])=>{
 const n={localName:tag,classList:classes,dataset:{},children,parentElement:null,getAttribute:k=>attrs[k]??null,matches:s=>s.includes('defs')&&tag==='defs'||s.includes('[data-mn-decoration]')&&Boolean(attrs['data-mn-decoration']),closest:s=>s==='svg'?(tag==='svg'?n:n.parentElement?.closest(s)):null};
 for(const child of children)child.parentElement=n;return n;
};
test('colour, content and interactive state do not split a block contract',()=>{
 const a=node('button',['home-tile'],{'data-mode':'spelling'},[node('span',['home-tile-name'])]);
 const b=node('button',['selected','home-tile'],{'data-mode':'math'},[node('span',['home-tile-name'])]);
 assert.equal(blockIdentity(a,'button-home-card'),blockIdentity(b,'button-home-card'));
 const plain=node('label',['choice'],{},[node('span')]),selected=node('label',['choice','jelly-v4-label'],{},[node('span',['jelly-v4-text-active'])]);assert.equal(blockIdentity(plain,'jelly-option'),blockIdentity(selected,'jelly-option'));
 const star=color=>node('svg',[],{viewBox:'0 0 24 24'},[node('path',[],{d:'M2 3L4 5Z',fill:color})]);
 assert.equal(blockIdentity(star('#ff0000'),'icon-star'),blockIdentity(star('#00ff00'),'icon-star'));
});
test('different vector shapes, structure and inherited anonymous hosts remain distinct',()=>{
 const arrow=path=>node('svg',[],{viewBox:'0 0 24 24'},[node('path',[],{d:path})]);
 assert.notEqual(blockIdentity(arrow('M1 2L3 4'),'icon'),blockIdentity(arrow('M1 4L3 2'),'icon'));
 assert.notEqual(blockIdentity(node('button',['primary']),'button-main'),blockIdentity(node('button',['answer']),'button-main'));
 const a=node('span'),b=node('span');node('div',['score'],{},[a]);node('div',['hint'],{},[b]);assert.notEqual(blockIdentity(a,'text'),blockIdentity(b,'text'));
});
test('every runtime item has exactly one library counterpart and exact ancestry',()=>{
 const views=[{id:'home',name:'Start',mode:'spelling'},{id:'math-initial',name:'Gra',mode:'math'}];
 const first=[{id:'layout-root',blockId:'screen-home',kind:'container',recipe:'layout',label:'Cały ekran'}, {id:'card',blockId:'block-card-a',recipe:'container-card',kind:'container',label:'Kafel',parent:'layout-root'}, {id:'title',blockId:'block-title-b',recipe:'text',kind:'text',label:'Tytuł',parent:'card'}, {id:'star',blockId:'block-icon-c',recipe:'icon',kind:'icon',label:'Gwiazda',parent:'card'}];
 const second=[{id:'layout-root',blockId:'screen-math-initial',kind:'container',recipe:'layout',label:'Gra'}, {...first[3],id:'score-star',parent:'layout-root'}];
 const inventories=new Map([['home',{items:first}],['math-initial',{items:second}]]),catalog=runtimeCatalog({views},inventories);
 for(const view of views)for(const item of inventories.get(view.id).items){const matches=catalog.filter(r=>r.id===item.blockId);assert.equal(matches.length,1);assert.ok(matches[0].uses.some(u=>u.view===view.id&&u.id===item.id));}
 assert.equal(catalog.find(r=>r.id==='block-icon-c').uses.length,2);
 assert.deepEqual(runtimeStack(views[0],first[3],first).map(r=>r.libraryId),['screen-home','block-card-a','block-icon-c']);
 assert.equal(runtimeLevel(first[0],first),'family');assert.equal(runtimeLevel(first[3],first),'atom');
 assert.deepEqual(runtimeCatalog({views},new Map()),[]);
});
test('shared geometry, theme colours and local content resolve consistently in production and library',()=>{
 const id='block-button-test',config={elementStyles:{[id]:{width:120}},familyStyles:{math:{[id]:{textColor:'#112233'}}},recipeStates:{[id]:{pressed:{scale:.9}}},elementOverrides:{'math-initial':{choice:{text:'Odpowiedź'}}}};
 validateElementStyles(config);
 const item={id:'choice',blockId:id,recipe:'button-answer',kind:'button',mode:'math',state:'pressed'};
 assert.deepEqual(rawVisualValue(config,'math-initial',item),{width:120,textColor:'#112233',scale:.9,text:'Odpowiedź'});
 assert.equal(rawVisualValue(config,'math-results',{...item,id:'another'}).width,120);
 assert.equal(rawVisualValue(config,'home',{...item,mode:'spelling'}).textColor,undefined);
 config.elementStyles['screen-home']={padding:15};config.elementOverrides.home={'layout-root':{padding:17}};
 const css=elementCSS(config);assert.match(css,/#app\[data-ds\]\[data-ds-block="screen-home"\]\{padding:15px/);assert.match(css,/#app\[data-ds-element="layout-root"\]\{padding:17px/);assert.match(css,/data-ds-block="block-button-test"[^}]*width:120px/);assert.match(css,/data-ds-mode="math"[^}]*color:#112233/);assert.match(css,/data-ds-state="pressed"[^}]*scale:0.9/);
 assert.throws(()=>validateElementStyles({...config,recipeStates:{[id]:{invented:{width:1}}}}),/stan przepisu/);
});

test('a provisional wizard is never accepted as the final block inventory',()=>{
 for(const mode of ['spelling','english','reading']){let mounted=false;const root={dataset:{view:'wizard',mode},querySelector:selector=>selector==='.loading'?null:mounted?{}:null};assert.equal(runtimeRendererReady(root),false);mounted=true;assert.equal(runtimeRendererReady(root),true);}
 assert.equal(runtimeRendererReady({dataset:{view:'home'},querySelector:()=>null}),true);
 assert.equal(runtimeRendererReady({dataset:{view:'home'},querySelector:()=>({})}),false);
});
