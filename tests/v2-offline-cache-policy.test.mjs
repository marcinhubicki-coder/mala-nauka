import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {offlineAssetBudget,selectOfflineBootstrapAssets} from '../tools/offline-cache-policy.mjs';
const catalog=JSON.parse(readFileSync(new URL('../design-system/assets.json',import.meta.url),'utf8'));
test('PWA installation does not download the entire illustrations archive',()=>{
 const b=offlineAssetBudget(catalog.assets);
 assert.ok(b.catalogCount>=600);
 assert.ok(b.bootstrapCount>10 && b.bootstrapCount<45);
 assert.ok(b.bootstrapBytes<6*1024*1024);
 assert.ok(b.deferredBytes>60*1024*1024);
 assert.ok(b.bootstrapBytes/b.catalogBytes<.1);
});
test('Core home and spelling illustrations remain prepared for offline bootstrap',()=>{
 const names=new Set(selectOfflineBootstrapAssets(catalog.assets).map(x=>x.path));
 for(const name of ['assets/brand/home-adventure-3d.webp','assets/brand/home-mark.png','assets/ortografia/wizard-meadow-animals-v2.webp','assets/ortografia/game-meadow-v1.webp'])assert.ok(names.has(name),name);
 assert.ok(![...names].some(name=>/^assets\/ortografia\/words\//.test(name)));
});
test('both readable book fonts are available on first offline use without preloading reward art',()=>{
 const starter=selectOfflineBootstrapAssets(catalog.assets),paths=new Set(starter.map(a=>a.path)),book=catalog.assets.filter(a=>a.id.startsWith('campaign-book-charm-'));
 assert.equal(book.length,2);for(const font of book)assert(paths.has(font.path));
 assert.equal(starter.filter(a=>a.id.startsWith('reward-part-')).length,0);
});
