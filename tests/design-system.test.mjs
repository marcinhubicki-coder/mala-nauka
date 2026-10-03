import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {clone,set,validateConfig,configCSS,changedViews,viewIdFor} from '../design-system/model.mjs';
import {validateAssets} from '../design-system/validation.mjs';
import {configureAssets,assetUrl,wordAsset,previewAssets} from '../shared/asset-loader.mjs';
import {GitClient,GitConflict,mergeDraft,mergeCatalog,mergeWordPack,BRANCH} from '../design-system/git-client.mjs';
import {createStudioGame} from '../design-system/scenarios.mjs';
import {validateWords} from '../game.mjs';
import {cleanConfig} from '../modes.mjs';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8').then(JSON.parse);
const config=await read('design-system/config.json'),assets=await read('design-system/assets.json'),registry=await read('design-system/registry.json');
const words=validateWords((await Promise.all(Array.from({length:8},(_,i)=>read(`data/words-0${i+1}.json`)))).flat());
test('import rejects malformed CSS, unknown roles, prototype keys and invalid dimensions',()=>{
 for(const mutate of [c=>c.tokens.jelly.height=2,c=>c.tokens.jelly.inset=Infinity,c=>c.themes.flags.accent='red;display:none',c=>c.typography['bad-role']='nunito',c=>c.overrides=JSON.parse('{"__proto__":{"x":1}}'),c=>c.tokens.unknown={height:5}]){const c=clone(config);mutate(c);assert.throws(()=>validateConfig(c));}
 const c=clone(config);c.tokens.jelly.duration=5000;assert.doesNotThrow(()=>validateConfig(c));
 assert.throws(()=>set(c,'__proto__.polluted',true));assert.equal({}.polluted,undefined);
});
test('local view exceptions do not leak to other views and impact maps remain explicit',()=>{
 const c=clone(config);set(c,'overrides.english-settings.jelly.height',62);const css=configCSS(c);
 assert.match(css,/html\[data-ds-view="english-settings"\]\{--ds-jelly-height:62;/);
 assert.deepEqual(changedViews([{path:'overrides.english-settings.jelly.height'}],registry).map(v=>v.id),['english-settings']);
});
test('all 455 word illustrations and deleted aliases resolve to one existing canonical file',()=>{
 validateAssets(assets);assert.equal(words.length,455);assert.equal(Object.keys(assets.words).length,455);configureAssets(assets,'https://example.test/base/');
 for(const word of words)assert.ok(assets.assets.some(row=>row.path===assets.words[word.word]?.path),word.word);
 for(const [alias,target]of Object.entries(assets.aliases))assert.equal(assetUrl(alias),'https://example.test/base/'+target);
 const first=words[0].word,path=assets.words[first].path;previewAssets({[path]:'blob:temporary-image'});assert.equal(wordAsset(first),'blob:temporary-image');previewAssets();
 const invalid=clone(assets);invalid.words[first].path='../../escape.png';assert.throws(()=>validateAssets(invalid));
});
test('every real game fixture accepts answers and retains stopped time for both feedback states',()=>{
 for(const mode of ['spelling','english','flags','reading'])for(const correct of [true,false]){
  const game=createStudioGame(mode,cleanConfig(mode,{}),words),remaining=game.remaining;
  assert.equal(game.answer(correct?game.current.answer:game.options.find(o=>o!==game.current.answer)),true,mode);
  game.tick();assert.equal(game.state,correct?'feedback-correct':'feedback-wrong',mode);assert.equal(game.remaining,remaining,mode);
 }
});
test('three-way merge retains independent edits and refuses shared-value conflicts',()=>{
 const a=clone(config),b=clone(config);a.tokens.jelly.height=60;b.tokens.card.radius=29;
 const merged=mergeDraft(config,a,b);assert.equal(merged.tokens.jelly.height,60);assert.equal(merged.tokens.card.radius,29);
 b.tokens.jelly.height=70;assert.throws(()=>mergeDraft(config,a,b),GitConflict);
});
test('catalog merges dotted filenames and new uploads without losing remote assignments',()=>{
 const a=clone(assets),b=clone(assets),keys=Object.keys(assets.words),newRow={path:'assets/managed/'+ 'a'.repeat(64)+'.png',sha:'a'.repeat(64),size:15};
 a.assets.push(newRow);a.words[keys[0]]={...a.words[keys[0]],path:newRow.path};b.words[keys[1]]={...b.words[keys[1]],manual:true};
 const merged=mergeCatalog(assets,a,b);assert.ok(merged.assets.some(row=>row.path===newRow.path));assert.equal(merged.words[keys[1]].manual,true);
 const base=[{word:'góra',learning:{title:'A'}},{word:'chmura',learning:{title:'B'}}],local=clone(base),remote=clone(base);local[0].learning.title='Nowa';remote[1].learning.title='Inna';
 assert.deepEqual(mergeWordPack(base,local,remote).map(row=>row.learning.title),['Nowa','Inna']);remote[0].learning.title='Konflikt';assert.throws(()=>mergeWordPack(base,local,remote),GitConflict);
});
function github({movedBefore=false,movedDuring=false}={}){
 const calls=[],head='1'.repeat(40),newHead='2'.repeat(40);let refReads=0;
 const fetcher=async(url,options)=>{
  const path=url.split('/mala-nauka/')[1],body=options.body?JSON.parse(options.body):undefined;calls.push({path,method:options.method,body,headers:options.headers});let value,status=200;
  if(path==='')value={permissions:{push:true}};
  else if(path.startsWith('git/ref/'))value={object:{sha:movedBefore&&++refReads>1?newHead:head}};
  else if(path.startsWith('contents/'))value={content:Buffer.from(JSON.stringify(config)).toString('base64')};
  else if(path==='git/commits/'+head)value={tree:{sha:'3'.repeat(40)}};
  else if(path==='git/blobs')value={sha:'4'.repeat(40)};
  else if(path==='git/trees')value={sha:'5'.repeat(40)};
  else if(path==='git/commits')value={sha:newHead};
  else if(path.startsWith('git/refs/')){value={};if(movedDuring){status=422;value.message='Not fast-forward';}}
  else throw Error(path);
  return{ok:status===200,status,json:async()=>value};
 };return{calls,fetcher,head,newHead};
}
test('a save creates one atomic Git commit with config, catalog, upload and words on the design branch',async()=>{
 const server=github(),git=new GitClient(server.fetcher);await git.connect('test-only-token',config);
 const path='assets/managed/'+'a'.repeat(64)+'.png';
 const result=await git.save({config,assets,uploads:[{path,bytes:Uint8Array.of(1,2,3)}],wordEdits:[{path:'data/words-01.json',value:[]}],message:'Test'});
 assert.equal(result.sha,server.newHead);assert.equal(server.calls.filter(c=>c.path==='git/commits').length,1);
 const tree=server.calls.find(c=>c.path==='git/trees').body.tree;assert.deepEqual(tree.map(r=>r.path),['design-system/config.json','design-system/assets.json',path,'data/words-01.json']);
 const patch=server.calls.find(c=>c.method==='PATCH');assert.equal(patch.path,'git/refs/heads/'+BRANCH);assert.equal(patch.body.force,false);
 assert.ok(!JSON.stringify(tree).includes('test-only-token'));git.disconnect();assert.equal(git.connected,false);
});
test('both early and late concurrent commits stop the save instead of overwriting the branch',async()=>{
 for(const options of [{movedBefore:true},{movedDuring:true}]){const server=github(options),git=new GitClient(server.fetcher);await git.connect('test-only-token',config);await assert.rejects(git.save({config,assets}),GitConflict);assert.equal(git.head,server.head);if(options.movedBefore)assert.equal(server.calls.filter(c=>c.method==='POST').length,0);}
});

test('normal routes share studio view IDs for settings, feedback, profiles and auxiliary screens',()=>{
 assert.equal(viewIdFor({view:'wizard',mode:'reading'}),'reading-settings');
 assert.equal(viewIdFor({view:'game',mode:'spelling',state:'feedback-wrong'}),'spelling-wrong');
 assert.equal(viewIdFor({view:'players',hasPlayers:false}),'players-empty');
 assert.equal(viewIdFor({view:'history',historyState:'achievements'}),'trophies');
 assert.equal(viewIdFor({view:'results',popup:'rule'}),'spelling-rule');
});
