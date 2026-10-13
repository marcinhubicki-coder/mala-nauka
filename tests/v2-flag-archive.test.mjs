import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {assertFlagArchive,isFrozenFlagFile,FLAG_ARCHIVE_SHA} from '../tools/flag-archive-policy.mjs';

const current=JSON.parse(readFileSync(new URL('../design-system/assets.json',import.meta.url),'utf8'));
const flags=current.assets.filter(x=>isFrozenFlagFile(x.path));

test('all country and adventure flag source files are managed by one index',()=>{
 assert.equal(flags.length,256);
 assert.equal(flags.filter(x=>x.type==='svg').length,249);
 assert.equal(flags.filter(x=>x.type==='webp').length,7);
 assert.equal(FLAG_ARCHIVE_SHA.length,40);
 assert.deepEqual(assertFlagArchive(current,current),{count:256});
});
test('archive gate blocks missing, changed and unexpected flag assets',()=>{
 const a=structuredClone(current);
 const path=flags[0].path;
 a.assets.find(x=>x.path===path).sha='0'.repeat(64);
 assert.throws(()=>assertFlagArchive(current,a),/Inna zawartość flagi/);
 a.assets=a.assets.filter(x=>x.path!==path);
 assert.throws(()=>assertFlagArchive(current,a),/Nieopublikowana flaga/);
 const b=structuredClone(current);b.assets.find(x=>x.path===path).sha='0'.repeat(64);
 assert.throws(()=>assertFlagArchive(b,current),/Inna zawartość flagi/);
});
test('hosted V2 rewrites SVG and transparent material to immutable archive',()=>{
 const routes=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8')).rewrites;
 assert.ok(routes.some(x=>x.source==='/assets/flags/:path*'&&x.destination==='https://mala-nauka-assets.vercel.app/assets/flags/:path*'));
 assert.equal(isFrozenFlagFile('assets/flags/svg/np.svg'),true);
 assert.equal(isFrozenFlagFile('assets/flags/adventure/cloth-light-v1.webp'),true);
 assert.equal(isFrozenFlagFile('assets/flags/svg/LICENSE.txt'),false);
});
