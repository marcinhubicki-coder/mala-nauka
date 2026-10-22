import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {configCSS} from '../design-system/model.mjs';

// Import under the same branch that the V2 HTML build injects BEFORE Studio boots.
globalThis.__DS_STUDIO_BRANCH__='refactor/v2-parity-first';
const {GitClient,BRANCH,assertStudioBranch}=await import('../design-system/git-client.mjs?roundtrip-v2');
const get=path=>JSON.parse(readFileSync(new URL('../'+path,import.meta.url),'utf8'));
const base=get('design-system/config.json'),assets=get('design-system/assets.json');

test('actual V2 editing contract creates one atomic commit on V2 and the PWA CSS can read it',async()=>{
 const original='a'.repeat(40),saved='b'.repeat(40),treeSha='c'.repeat(40),calls=[];
 const fetcher=async(url,options)=>{
  const path=url.split('/mala-nauka/')[1]||'',method=options.method;
  const data=options.body?JSON.parse(options.body):null;
  calls.push({path,method,data,authorization:options.headers.Authorization});
  let reply;
  if(path==='')reply={permissions:{push:true}};
  else if(path==='git/ref/heads/'+BRANCH)reply={object:{sha:original}};
  else if(path.startsWith('contents/design-system/config.json?ref='))reply={content:Buffer.from(JSON.stringify(base)).toString('base64')};
  else if(path==='git/commits/'+original)reply={tree:{sha:treeSha}};
  else if(path==='git/trees'&&method==='POST')reply={sha:'d'.repeat(40)};
  else if(path==='git/commits'&&method==='POST')reply={sha:saved};
  else if(path==='git/refs/heads/'+BRANCH&&method==='PATCH')reply={};
  else throw Error('Unmocked route: '+method+' '+path);
  return {ok:true,status:200,json:async()=>reply};
 };
 assert.equal(BRANCH,'refactor/v2-parity-first');
 assertStudioBranch(base.branch,BRANCH);
 const git=new GitClient(fetcher);
 const connected=await git.connect('ci-test-token',base);
 assert.equal(connected.stale,false);
 const next=structuredClone(base);next.revision+=1;next.tokens.card.radius+=1;
 const css=configCSS(next);
 assert.ok(css.includes('--ds-card-radius:'+next.tokens.card.radius+';'),'PWA contract did not compile edited token');
 const savedCommit=await git.save({config:next,assets,message:'Studio V2 card spacing parity'});
 assert.equal(savedCommit.sha,saved);
 const treeCall=calls.find(row=>row.path==='git/trees'&&row.method==='POST');
 const configBlob=treeCall.data.tree.find(row=>row.path==='design-system/config.json');
 assert.equal(JSON.parse(configBlob.content).tokens.card.radius,next.tokens.card.radius);
 assert.ok(treeCall.data.tree.some(row=>row.path==='design-system/assets.json'));
 const refCall=calls.find(row=>row.path==='git/refs/heads/'+BRANCH&&row.method==='PATCH');
 assert.equal(refCall.data.sha,saved);
 assert.equal(refCall.data.force,false);
 assert.ok(!calls.some(row=>row.path.includes('design/system-v1')));
 assert.ok(!JSON.stringify(treeCall.data).includes('ci-test-token'));
 git.disconnect();
 assert.equal(git.connected,false);
});
