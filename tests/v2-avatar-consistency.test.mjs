import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync,statSync} from 'node:fs';
import {profileAvatar} from '../shared/profile-parts.mjs';
import {selectOfflineBootstrapAssets} from '../tools/offline-cache-policy.mjs';
const root=new URL('../',import.meta.url);
const file=p=>readFileSync(new URL(p,root));
const catalog=JSON.parse(file('design-system/assets.json'));
const letters=[...'abcdefghijkl'];

function webpDimensions(bytes){
 assert.equal(bytes.toString('ascii',0,4),'RIFF');
 assert.equal(bytes.toString('ascii',8,12),'WEBP');
 assert.equal(bytes.toString('ascii',12,16),'VP8X');
 const width=1+bytes[24]+bytes[25]*256+bytes[26]*65536;
 const height=1+bytes[27]+bytes[28]*256+bytes[29]*65536;
 return [width,height];
}

test('All twelve actual avatar assets are identically sized square 384px WebP',()=>{
 const folder=new URL('../assets/brand/avatars/',import.meta.url);
 assert.deepEqual(readdirSync(folder).sort(),letters.map(x=>x+'.webp'));
 const sizes=[];
 for(const letter of letters){
  const name='assets/brand/avatars/'+letter+'.webp';
  const bytes=file(name);
  assert.deepEqual(webpDimensions(bytes),[384,384],name);
  assert.ok(bytes.length>5000&&bytes.length<350000,name);
  sizes.push(bytes.length);
  const asset=catalog.assets.find(x=>x.path===name);
  assert.ok(asset,name+' missing from asset catalog');
  assert.equal(asset.size,bytes.length,name);
 }
 assert.equal(sizes.length,12);
});

test('One avatar atom uses a real square image; no separate sprite SVG or CSS-background URL',()=>{
 for(const letter of letters){
  const html=profileAvatar({avatarId:letter},'player-avatar-large');
  assert.match(html,new RegExp('data-avatar="'+letter+'"'));
  assert.match(html,new RegExp('src="/assets/brand/avatars/'+letter+'\\.webp"'));
  assert.match(html,/class="player-avatar-image"/);
  assert.match(html,/width="384" height="384"/);
  assert.doesNotMatch(html,/<svg|<image|background-image|--player-avatar-src/);
 }
 // A caller with an explicit CDN / asset resolver keeps its URL unchanged.
 const remote=profileAvatar({avatarId:'h'},'',path=>'https://assets.example.test/'+path);
 assert.match(remote,/src="https:\/\/assets\.example\.test\/assets\/brand\/avatars\/h\.webp"/);
});

test('Avatar CSS preserves a circular 1:1 surface on picker, editor, selection and PIN',()=>{
 const css=file('player-profiles.css').toString('utf8');
 const runtime=file('shared/components.css').toString('utf8');
 assert.match(css,/\.player-avatar-art\s*\{[^}]*aspect-ratio:1\s*\/\s*1;[^}]*border-radius:50%;[^}]*overflow:hidden/s);
 assert.match(css,/\.player-avatar-image\s*\{[^}]*width:100%;[^}]*height:100%;[^}]*aspect-ratio:1\s*\/\s*1;[^}]*object-fit:contain;[^}]*border-radius:50%/s);
 assert.match(css,/\.player-avatar-large\s*\{[^}]*aspect-ratio:1\s*\/\s*1/);
 assert.match(runtime,/#app\[data-ds\] \.player-avatar-art\s*\{aspect-ratio:1\s*\/\s*1/);
 assert.doesNotMatch(css,/background-size:400% 200%|background-size:200% 200%|player-avatar-extra svg/);
 assert.doesNotMatch(css,/--player-avatar-src|player-avatars-extra-v1\.webp|player-avatars-3d\.webp/);
});

test('All 12 avatars stay offline-ready without precaching bulky obsolete sprite atlases',()=>{
 const names=new Set(selectOfflineBootstrapAssets(catalog.assets).map(x=>x.path));
 for(const letter of letters)assert.ok(names.has('assets/brand/avatars/'+letter+'.webp'));
 assert.ok(!names.has('assets/brand/player-avatars-3d.webp'));
 assert.ok(!names.has('assets/brand/player-avatars-extra-v1.webp'));
});
