import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {buildServiceWorker} from '../tools/service-worker.mjs';
function worker({quota=false}={}){
 const stores=new Map(),events={},removed=[];
 const key=r=>typeof r==='string'?r:r.url;
 const caches={open:async name=>{if(!stores.has(name))stores.set(name,new Map());const data=stores.get(name);return {match:async r=>data.get(key(r)),put:async(r,v)=>{if(quota)throw Error('quota');data.set(key(r),v);},delete:async r=>data.delete(key(r)),keys:async()=>[...data.keys()]};},keys:async()=>[...stores.keys()],delete:async name=>{removed.push(name);return stores.delete(name);}};
 const response={ok:true,type:'basic',clone(){return this;}};
 vm.runInNewContext(buildServiceWorker({hash:'next',core:[],bootstrap:[]}),{self:{addEventListener:(n,f)=>events[n]=f,clients:{claim:async()=>{}}},caches,URL,location:{origin:'https://game.test'},fetch:async()=>response});
 return {stores,removed,response,activate:async()=>{let done;events.activate({waitUntil:p=>done=p});await done;},fetch:async path=>{let done;events.fetch({request:{method:'GET',url:'https://game.test'+path},respondWith:p=>done=p});return done;}};
}
test('downloaded scene images and flags survive ordinary Studio/PWA cache rotations',async()=>{
 const w=worker();w.stores.set('mala-nauka-scenes-v1',new Map([['https://game.test/assets/scenes/a.webp',w.response]]));w.stores.set('mala-nauka-flags-v1',new Map());w.stores.set('mala-nauka-ds-old',new Map());await w.activate();
 assert.deepEqual(w.removed,['mala-nauka-ds-old']);assert.equal(await w.fetch('/assets/scenes/a.webp'),w.response);
});
test('persistent media cache evicts old entries and a full storage quota does not block rendering',async()=>{
 const w=worker();for(let i=0;i<161;i++)await w.fetch('/assets/managed/'+i+'.webp');const stored=w.stores.get('mala-nauka-scenes-v1');assert.equal(stored.size,160);assert.ok(!stored.has('https://game.test/assets/managed/0.webp'));
 const full=worker({quota:true});assert.equal(await full.fetch('/assets/scenes/a.webp'),full.response);
});
test('SVG flags have a distinct bounded persistent cache',async()=>{
 const w=worker();for(let i=0;i<261;i++)await w.fetch('/assets/flags/svg/'+i+'.svg');assert.equal(w.stores.get('mala-nauka-flags-v1').size,260);assert.ok(!w.stores.has('mala-nauka-scenes-v1'));
 const full=worker({quota:true});assert.equal(await full.fetch('/assets/flags/svg/pl.svg'),full.response);
});
