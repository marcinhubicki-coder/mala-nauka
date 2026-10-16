import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { validateWords } from '../game.mjs';
import { sceneFor } from '../spelling/scenes.mjs';
import {configureAssets,playableWords} from '../shared/asset-loader.mjs';
import {ASSET_ORIGIN,readPublishedCatalog,assertPublishedAssets,verifyPublishedImages} from '../design-system/library-publish.mjs';

test('every offline precache request resolves to an existing file or entry directory', async () => {
  const sw = await readFile(new URL('../dist/sw.js', import.meta.url), 'utf8');
  const core = JSON.parse(sw.match(/const CORE=(\[[\s\S]*?\]);/)[1]);
  const assets=JSON.parse(sw.match(/const ASSETS=(\[[\s\S]*?\]);/)[1]);
  const deployment=JSON.parse(await readFile(new URL('../dist/design-system/deployment.json',import.meta.url),'utf8'));
  const catalog=JSON.parse(await readFile(new URL('../dist/design-system/assets.json',import.meta.url),'utf8'));
  const remotePaths=new Set([...catalog.assets.map(row=>row.path),'design-system/rules.json','design-system/config.json','design-system/assets.json',...Array.from({length:8},(_,i)=>`data/words-0${i+1}.json`)]);
  if(deployment.consumer)assert.match(deployment.contentSource,/^https:\/\/raw\.githubusercontent\.com\/marcinhubicki-coder\/mala-nauka\/[0-9a-f]{40}\/$/);
  // Offline bootstrap deliberately excludes the 700+ asset archive. Core app
  // modules stay available offline; lesson illustrations are cached on demand.
  assert.ok(core.length>0);
  assert.ok(catalog.assets.length>650);
  assert.ok(assets.length>10 && assets.length<50, 'Keep installation asset requests bounded');
  assert.ok(assets.length < catalog.assets.length/10);
  const externalBootstrap=[];
  for (const request of [...core,...assets]) {
    if(/^https?:/.test(request)){
      assert.ok(deployment.consumer,'Remote precache only belongs to a consumer build');
      assert.ok(request.startsWith(deployment.contentSource),'Remote precache must use the pinned content source');
      assert.ok(remotePaths.has(request.slice(deployment.contentSource.length)),'Remote precache must exist in the pinned asset/word catalog');
      continue;
    }
    const path=request.replace(/^\//,'').split('?')[0];
    try{await access(new URL('../dist/'+path,import.meta.url));}
    catch(error){
      if(error.code!=='ENOENT'||deployment.assetLibraryOrigin!==ASSET_ORIGIN||!/^assets\/.+\.(png|jpe?g|webp|avif|svg)$/i.test(path))throw error;
      const asset=catalog.assets.find(asset=>asset.path===path);assert.ok(asset,'Missing bootstrap metadata: '+path);externalBootstrap.push(asset);
    }
  }
  if(externalBootstrap.length){assertPublishedAssets(externalBootstrap,await readPublishedCatalog());await verifyPublishedImages(externalBootstrap);}
  assert.ok(core.includes('/shared/design-runtime.mjs'));
  assert.ok(core.includes('/design-system/config.json'));
  assert.ok(core.some(request => request.includes('result-motion.mjs')));
});

test('all words retain learning data while only illustrated words enter the game', async () => {
  const parts = await Promise.all(Array.from({ length: 8 }, (_, i) => readFile(new URL(`../data/words-0${i + 1}.json`, import.meta.url), 'utf8').then(JSON.parse)));
  const words = validateWords(parts.flat());
  const assets=JSON.parse(await readFile(new URL('../design-system/assets.json',import.meta.url),'utf8'));configureAssets(assets);
  assert.equal(words.length, new Set(words.map(row=>row.word)).size);
  for(const word of words)assert.ok(word.learning,word.word);
  const ready=playableWords(words);assert.equal(ready.length,Object.keys(assets.words).length);
  const external=[];
  for (const word of ready) {
    const scene = sceneFor(word.masked, word.word);
    assert.ok(scene, word.word);
    const path=scene.asset.startsWith('assets/')?scene.asset:'assets/scenes/'+scene.asset;
    try{await access(new URL('../'+path,import.meta.url));}
    catch(error){
      if(error.code!=='ENOENT'||!/^assets\/(managed|scenes|flags)\//.test(path))throw error;
      const record=assets.assets.find(asset=>asset.path===path);assert.ok(record,'Missing image metadata: '+path);
      external.push({path,sha:record.sha,size:record.size});
    }
  }
  if(external.length){assertPublishedAssets(external,await readPublishedCatalog());await verifyPublishedImages(external);}
});
