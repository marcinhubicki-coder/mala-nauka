import test from 'node:test';
import assert from 'node:assert/strict';
import { clothPoint, clothLight, sizedSvg, renderFlagCloth } from '../flagi/flag-cloth.mjs';

test('cloth remains inside its Retina canvas and its mesh never folds over',()=>{
  const epsilon=.0001;
  for(let row=0;row<=80;row++)for(let column=0;column<=80;column++){
    const u=column/80,v=row/80,p=clothPoint(u,v),pu=clothPoint(u+epsilon,v),pv=clothPoint(u,v+epsilon);
    assert.ok(p.x>=0&&p.x<=1&&p.y>=0&&p.y<=1,'surface must not clip');
    const determinant=(pu.x-p.x)*(pv.y-p.y)-(pv.x-p.x)*(pu.y-p.y);
    assert.ok(determinant>0,'emblems must not invert or cross themselves');
    assert.ok(Number.isFinite(clothLight(u,v)),'light must stay finite');
  }
});

test('the hoist is straight and the free top edge drapes down from it',()=>{
  const anchor=clothPoint(0,0);
  for(let row=0;row<=20;row++)assert.equal(clothPoint(0,row/20).x,anchor.x);
  assert.ok(clothPoint(1,0).y-anchor.y>.15,'cloth should visibly drape');
});


test('canvas SVG sources have explicit intrinsic dimensions for every country',async()=>{
 const {FLAGS}=await import('../data/flags.mjs');const {readFile}=await import('node:fs/promises');
 for(const record of FLAGS){
  const source=await readFile(new URL('../'+record.flagSvg,import.meta.url),'utf8');
  const normalized=sizedSvg(source),root=normalized.match(/<svg\b[^>]*>/)[0];
  assert.match(root,/width="[\d.]+"/);assert.match(root,/height="[\d.]+"/);
  assert.equal(sizedSvg(normalized),normalized,'normalization is stable');
 }
 assert.throws(()=>sizedSvg('<html>Offline</html>'));
});

test('a blank browser decoder never hides the visible source fallback',async()=>{
 const previous={window:globalThis.window,document:globalThis.document,Image:globalThis.Image,fetch:globalThis.fetch,warn:console.warn};
 const classes=new Set(['is-painted']),messages=[];
 const blankCanvas=()=>{
  const canvas={width:0,height:0,getContext:()=>({drawImage(){},putImageData(){},getImageData:()=>({data:new Uint8ClampedArray(canvas.width*canvas.height*4)})})};
  return canvas;
 };
 try{
  globalThis.window={devicePixelRatio:1};globalThis.document={createElement:blankCanvas};
  globalThis.Image=class{set src(value){queueMicrotask(()=>this.onload());}decode(){return Promise.resolve();}};
  globalThis.fetch=async()=>({ok:true,text:async()=>'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480"></svg>'});
  console.warn=(...args)=>messages.push(args);
  const canvas={...blankCanvas(),clientWidth:20,clientHeight:20,isConnected:true,dataset:{clothSource:'https://example.test/blank.svg'},closest:()=>({classList:{add:name=>classes.add(name),remove:name=>classes.delete(name)}})};
  await renderFlagCloth(canvas);
  assert.equal(canvas.dataset.clothReady,'fallback');assert.equal(classes.has('is-painted'),false);
  assert.equal(canvas.width,0);assert.equal(canvas.height,0);assert.equal(messages.length,1);
 }finally{for(const key of ['window','document','Image','fetch']){if(previous[key]===undefined)delete globalThis[key];else globalThis[key]=previous[key];}console.warn=previous.warn;}
});
