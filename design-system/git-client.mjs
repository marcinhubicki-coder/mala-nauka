import {discoverImages} from './catalog-refresh.mjs';
import {validateWords} from '../game.mjs';
import {validateRules} from '../shared/rules-library.mjs';
import {validateAssets} from './validation.mjs';
import {diff,validateConfig} from './model.mjs';
import {validateBatches,validatePublication,EMPTY_BATCHES} from './batch-model.mjs';
export const REPOSITORY='marcinhubicki-coder/mala-nauka';
export const BRANCH='design/system-v1';
export const PRODUCTION_BRANCH='main';
const bytesToBase64 = bytes => {let text='';for(let offset=0;offset<bytes.length;offset+=32768)text+=String.fromCharCode(...bytes.subarray(offset,offset+32768));return btoa(text);};
const decode = value => new TextDecoder().decode(Uint8Array.from(atob(value.replace(/\s/g,'')),char=>char.charCodeAt(0)));
export class GitConflict extends Error{constructor(message,paths=[]){super(message);this.name='GitConflict';this.paths=paths;}}
export class GitClient {
 #token=''; #head='';
 constructor(fetcher=globalThis.fetch.bind(globalThis)){this.fetcher=fetcher;}
 get connected(){return Boolean(this.#token);}
 get head(){return this.#head;}
 disconnect(){this.#token='';this.#head='';}
 async request(path,method='GET',body){
  const headers={Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'};
  if(this.#token)headers.Authorization=`Bearer ${this.#token}`;
  if(body)headers['Content-Type']='application/json';
  const endpoint=`https://api.github.com/repos/${REPOSITORY}${path?`/${path}`:''}`;
  const response=await this.fetcher(endpoint,{method,headers,body:body?JSON.stringify(body):undefined,cache:'no-store'});
  const data=await response.json();
  if(!response.ok){const error=new Error(response.status===401?'GitHub nie przyjął tokenu.':response.status===403?'GitHub odmówił operacji. Sprawdź uprawnienia tokenu: Contents oraz Pull requests — Read and write.':`GitHub: ${data.message||response.status}`);error.status=response.status;throw error;}
  return data;
 }
 async readJSON(path,ref=this.#head){const row=await this.request(`contents/${path}?ref=${encodeURIComponent(ref||BRANCH)}`);return JSON.parse(decode(row.content));}
 async connect(token,baseConfig){
  this.#token=String(token).trim();
  try{
   const repo=await this.request('');if(!repo.permissions?.push)throw Error('Połączenie nie ma prawa zapisu w repozytorium.');
   const ref=await this.request(`git/ref/heads/${BRANCH}`);this.#head=ref.object.sha;
   const remote=await this.readJSON('design-system/config.json');
   return {head:this.#head,remote,stale:diff(baseConfig,remote).length>0};
  }catch(error){this.disconnect();throw error;}
 }
 async latest(){
  const ref=await this.request(`git/ref/heads/${BRANCH}`),head=ref.object.sha;
  const [config,assets,rules]=await Promise.all(['config','assets','rules'].map(name=>this.readJSON(`design-system/${name}.json`,head)));
  let batches;try{batches=await this.readJSON('design-system/word-batches.json',head);}catch(error){if(error.status!==404)throw error;batches=structuredClone(EMPTY_BATCHES);}
  const wordPacks=Object.fromEntries(await Promise.all(Array.from({length:8},async(_,i)=>{const path=`data/words-0${i+1}.json`;return [path,await this.readJSON(path,head)];})));
  validateConfig(config);validateAssets(assets);validateRules(rules);validateBatches(batches);
  validateWords(Object.values(wordPacks).flat());
  const tree=await this.request(`git/trees/${head}?recursive=1`);
  const catalog=await discoverImages(assets,tree,async path=>{
   const response=await this.fetcher(`https://raw.githubusercontent.com/${REPOSITORY}/${head}/${path}`,{cache:'no-store'});
   if(!response.ok)throw Error(`Nie udało się pobrać grafiki: ${path}`);
   return response.arrayBuffer();
  },async(path,bytes)=>{
   if(typeof globalThis.createImageBitmap!=='function')return {};
   const extension=path.split('.').at(-1).toLowerCase(),type={png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',avif:'image/avif'}[extension];
   if(!type)return {};
   const bitmap=await globalThis.createImageBitmap(new Blob([bytes],{type}));
   const dimensions={width:bitmap.width,height:bitmap.height};bitmap.close();return dimensions;
  });
  return {head,config,assets,catalog,rules,batches,wordPacks};
 }
 acceptHead(head){if(!/^[0-9a-f]{40}$/.test(head))throw Error('Nieprawidłowy commit.');this.#head=head;}
 async deploymentStatus(sha=this.#head){
  if(!/^[0-9a-f]{40}$/.test(sha))throw Error('Najpierw połącz GitHub lub zapisz commit.');
  const result=await this.request(`commits/${sha}/status`);
  const row=result.statuses?.find(s=>/vercel/i.test(s.context));
  return {
   sha,
   state:row?.state||'unknown',
   description:row?.description||'GitHub nie podał jeszcze statusu Vercel.',
   url:`https://github.com/${REPOSITORY}/commit/${sha}/checks`,
   providerUrl:row?.target_url||''
  };
 }
 async previewURL(sha=this.#head){
  if(!/^[0-9a-f]{40}$/.test(sha))throw Error('Brak poprawnego commitu Preview.');
  const deployments=await this.request(`deployments?sha=${sha}&per_page=100`);
  for(const deployment of deployments){
   if(deployment.sha!==sha)continue;
   const statuses=await this.request(`deployments/${deployment.id}/statuses`);
   const status=statuses[0];
   if(status?.state!=='success'||!status.environment_url)continue;
   const url=new URL(status.environment_url);
   // Vercel's deployment URL is immutable; branch aliases and custom domains are not.
   // Do not fetch protected deployment metadata across origins: it requires Vercel login.
   if(url.protocol!=='https:'||url.username||url.password||url.hostname.includes('-git-')||!/^[-a-z0-9]+-[a-z0-9]{9}-[-a-z0-9]+\.vercel\.app$/.test(url.hostname))continue;
   return new URL('/',url).href;
  }
  throw Error('Brak gotowego, zweryfikowanego adresu wdrożenia dla tego commitu. Spróbuj po zakończeniu budowania Preview.');
 }
 async productionSummary(sha=this.#head){
  if(!this.connected)throw Error('Połącz GitHub przed sprawdzeniem publikacji.');
  if(!/^[0-9a-f]{40}$/.test(sha))throw Error('Brak poprawnego commitu Preview.');
  const comparison=await this.request(`compare/${PRODUCTION_BRANCH}...${sha}`);
  return {
   sha,
   status:comparison.status,
   commits:Number(comparison.ahead_by||0),
   behind:Number(comparison.behind_by||0),
   files:Array.isArray(comparison.files)?comparison.files.length:null,
   truncated:Boolean(comparison.too_large),
   mainSha:comparison.base_commit?.sha||'',
   identical:['identical','behind'].includes(comparison.status)
  };
 }
 async promoteToProduction(sha=this.#head){
  if(!this.connected)throw Error('Połącz GitHub przed publikacją na produkcję.');
  if(!/^[0-9a-f]{40}$/.test(sha))throw Error('Brak poprawnego commitu Preview.');
  const deployment=await this.deploymentStatus(sha);
  if(deployment.state!=='success')throw Error('Preview musi mieć zakończone, poprawne wdrożenie Vercel przed publikacją.');
  const previewRef=await this.request(`git/ref/heads/${BRANCH}`);
  if(previewRef.object?.sha!==sha)throw Error('Branch Preview ma już nowszy commit. Otwórz i zaakceptuj najnowsze Preview przed publikacją.');
  const comparison=await this.request(`compare/${PRODUCTION_BRANCH}...${sha}`);
  if(['identical','behind'].includes(comparison.status))return {sha,mergeSha:comparison.base_commit?.sha||sha,already:true,prNumber:null,prUrl:`https://github.com/${REPOSITORY}/tree/${PRODUCTION_BRANCH}`};
  const branch=`studio/release-${sha.slice(0,12)}`;
  try{
   const ref=await this.request(`git/ref/heads/${branch}`);
   if(ref.object?.sha!==sha)throw Error('Branch wydania wskazuje inny commit. Odśwież Preview i spróbuj ponownie.');
  }catch(error){
   if(error.status!==404)throw error;
   await this.request('git/refs','POST',{ref:`refs/heads/${branch}`,sha});
  }
  const owner=REPOSITORY.split('/')[0],query=`pulls?state=open&head=${encodeURIComponent(owner+':'+branch)}&base=${PRODUCTION_BRANCH}`;
  const open=await this.request(query);
  const pr=open[0]||await this.request('pulls','POST',{
   title:`Studio: publish ${sha.slice(0,7)}`,
   head:branch,
   base:PRODUCTION_BRANCH,
   body:`Publikacja zaakceptowanego Preview z Design Studio.\n\nPreview SHA: \`${sha}\``
  });
  const merge=await this.request(`pulls/${pr.number}/merge`,'PUT',{
   sha,
   merge_method:'merge',
   commit_title:`Studio: publish ${sha.slice(0,7)}`,
   commit_message:'Promocja zaakceptowanego Preview do produkcji.'
  });
  if(!merge.merged)throw Error(merge.message||'GitHub nie połączył wersji z main.');
  return {sha,mergeSha:merge.sha,already:false,prNumber:pr.number,prUrl:pr.html_url||`https://github.com/${REPOSITORY}/pull/${pr.number}`};
 }
 async save({config,assets,rules,batches,uploads=[],wordEdits=[],message='Design system: aktualizacja komponentów'}){
  if(!this.connected)throw Error('Połącz GitHub, aby zapisać commit.');
  validateConfig(config);validateAssets(assets);if(rules)validateRules(rules);
  if(batches)validateBatches(batches);validatePublication(batches,assets,wordEdits);
  const ref=await this.request(`git/ref/heads/${BRANCH}`);
  if(ref.object.sha!==this.#head)throw new GitConflict('Branch zmienił się od ostatniego odczytu. Wczytaj aktualną wersję i scal zmiany.');
  const parent=await this.request(`git/commits/${this.#head}`);
  const tree=[{path:'design-system/config.json',mode:'100644',type:'blob',content:JSON.stringify(config,null,2)+'\n'},{path:'design-system/assets.json',mode:'100644',type:'blob',content:JSON.stringify(assets,null,2)+'\n'}];
  if(rules)tree.push({path:'design-system/rules.json',mode:'100644',type:'blob',content:JSON.stringify(rules,null,2)+'\n'});
  if(batches)tree.push({path:'design-system/word-batches.json',mode:'100644',type:'blob',content:JSON.stringify(batches,null,2)+'\n'});
  for(const upload of uploads){
   if(!/^assets\/managed\/[0-9a-f]{64}\.(png|jpe?g|webp|avif)$/.test(upload.path))throw Error('Nieprawidłowa ścieżka assetu.');
   const blob=await this.request('git/blobs','POST',{content:bytesToBase64(upload.bytes),encoding:'base64'});
   tree.push({path:upload.path,mode:'100644',type:'blob',sha:blob.sha});
  }
  for(const edit of wordEdits){
   if(!/^data\/words-0[1-8]\.json$/.test(edit.path))throw Error('Nieprawidłowy plik słów.');
   tree.push({path:edit.path,mode:'100644',type:'blob',content:JSON.stringify(edit.value,null,2)+'\n'});
  }
  const createdTree=await this.request('git/trees','POST',{base_tree:parent.tree.sha,tree});
  const commit=await this.request('git/commits','POST',{message,tree:createdTree.sha,parents:[this.#head]});
  try{await this.request(`git/refs/heads/${BRANCH}`,'PATCH',{sha:commit.sha,force:false});}
  catch(error){if(error.status===422)throw new GitConflict('Równoległy commit zablokował zapis. Twoje zmiany pozostają w szkicu.');throw error;}
  this.#head=commit.sha;
  return {sha:commit.sha,url:`https://github.com/${REPOSITORY}/commit/${commit.sha}`};
 }
}
export function mergeDraft(base,local,remote){
 const changes=diff(base,local),remoteChanges=diff(base,remote),conflicts=changes.filter(change=>remoteChanges.some(row=>row.path===change.path&&JSON.stringify(row.after)!==JSON.stringify(change.after)));
 if(conflicts.length)throw new GitConflict('Te same wartości zmieniły się również na GitHub.',conflicts.map(row=>row.path));
 const merged=structuredClone(remote);
 for(const change of changes){const keys=change.path.split('.');let cursor=merged;for(const key of keys.slice(0,-1))cursor=cursor[key]||={};if(change.after===undefined)delete cursor[keys.at(-1)];else cursor[keys.at(-1)]=change.after;}
 return merged;
}

// Catalog keys contain dots and slashes; merge values without splitting keys.
export function mergeRecords(base,local,remote,label='rejestr'){
 const merged=structuredClone(remote),conflicts=[];
 for(const key of new Set([...Object.keys(base),...Object.keys(local)])){
  if(JSON.stringify(base[key])===JSON.stringify(local[key]))continue;
  if(JSON.stringify(base[key])!==JSON.stringify(remote[key])&&JSON.stringify(local[key])!==JSON.stringify(remote[key])){conflicts.push(`${label}: ${key}`);continue;}
  if(local[key]===undefined)delete merged[key];else merged[key]=structuredClone(local[key]);
 }
 if(conflicts.length)throw new GitConflict('Te same wpisy zmieniły się na GitHub.',conflicts);
 return merged;
}
export function mergeCatalog(base,local,remote){
 const byPath=rows=>Object.fromEntries(rows.map(row=>[row.path,row]));
 return {...remote,words:mergeRecords(base.words,local.words,remote.words,'słowo'),aliases:mergeRecords(base.aliases,local.aliases,remote.aliases,'alias'),assets:Object.values(mergeRecords(byPath(base.assets),byPath(local.assets),byPath(remote.assets),'asset')).sort((a,b)=>a.path.localeCompare(b.path))};
}
export function mergeWordPack(base,local,remote){
 const byWord=rows=>Object.fromEntries(rows.map(row=>[row.word,row]));
 const values=mergeRecords(byWord(base),byWord(local),byWord(remote),'treść słowa');
 return [...remote.filter(row=>values[row.word]).map(row=>values[row.word]),...Object.values(values).filter(row=>!remote.some(old=>old.word===row.word))];
}
