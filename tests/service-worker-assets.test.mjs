import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync} from 'node:fs';
import {buildServiceWorker} from '../tools/service-worker.mjs';
import {selectOfflineBootstrapAssets} from '../tools/offline-cache-policy.mjs';
test('the generated worker is valid JavaScript and installation downloads only its explicit starter list',async()=>{
 const events={},requested=[];const source=buildServiceWorker({hash:'test',core:['/app.js'],bootstrap:['/assets/brand/home-mark.png']});new vm.Script(source);
 const cache={put:async()=>{}};const self={addEventListener:(name,fn)=>events[name]=fn,skipWaiting:()=>{}};
 vm.runInNewContext(source,{self,caches:{open:async()=>cache},fetch:async url=>{requested.push(url);return {ok:true};},URL,location:{origin:'https://game.test'}});
 let done;events.install({waitUntil:p=>done=p});await done;assert.deepEqual(requested,['/app.js','/assets/brand/home-mark.png']);
});
test('reward atlases and the word/flag bank stay outside offline installation',()=>{
 const assets=JSON.parse(readFileSync(new URL('../design-system/assets.json',import.meta.url))).assets,bootstrap=selectOfflineBootstrapAssets(assets);
 assert.ok(bootstrap.length<40);assert.equal(bootstrap.filter(a=>/assets\/(managed|scenes|flags)\//.test(a.path)&&!a.path.endsWith('.woff2')).length,0);
 const vercel=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url)));assert.deepEqual(vercel.rewrites,[{source:'/assets/:path*',destination:'https://mala-nauka-assets.vercel.app/assets/:path*'}]);
});
test('offline starter images are served from installation cache without downloading the bank',async()=>{
 const events={},response={ok:true,clone(){return this;}},source=buildServiceWorker({hash:'test',core:[],bootstrap:['/assets/brand/home-mark.png']});let fetched=0;
 const media={match:async()=>null},starter={match:async()=>response};
 vm.runInNewContext(source,{self:{addEventListener:(name,fn)=>events[name]=fn},caches:{open:async name=>name==='mala-nauka-scenes-v1'?media:starter},fetch:async()=>{fetched++;throw Error('offline');},URL,location:{origin:'https://game.test'}});
 let result;events.fetch({request:{method:'GET',url:'https://game.test/assets/brand/home-mark.png'},respondWith:p=>result=p});assert.equal(await result,response);assert.equal(fetched,0);
});
test('offline rounds choose only cached word images and cached question flags',async()=>{
 const {configureAssets,offlinePlayableWords}=await import('../shared/asset-loader.mjs');const {createSource}=await import('../modes.mjs');
 const catalog=JSON.parse(readFileSync(new URL('../design-system/assets.json',import.meta.url)));configureAssets(catalog,'https://game.test/');const words=Object.keys(catalog.words).slice(0,2).map(word=>({word}));
 const cachedPath=catalog.words[words[0].word].path,cacheStorage={keys:async()=>['media'],open:async()=>({keys:async()=>[{url:'https://game.test/'+cachedPath}]})};
 assert.deepEqual(await offlinePlayableWords(words,{online:false,cacheStorage}),[words[0]]);
 const source=createSource('flags',{offlineFlagIds:['pl'],category:'all'});for(let i=0;i<8;i++)assert.equal(source({question:i}).countryId,'pl');
 assert.throws(()=>createSource('flags',{offlineFlagIds:[],category:'all'}),/internetem/);
});
