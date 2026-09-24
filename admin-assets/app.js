import { sceneFor } from '../spelling/scenes.mjs?v=admin-loader';

const TARGET=1080, MAX_BYTES=235*1024, QUALITIES=[.92,.88,.84,.80,.76,.72];
const DB_NAME='mala-nauka-asset-loader', STORE='staged';
const $=s=>document.querySelector(s);
const ui={list:$('#list'),status:$('#status'),missing:$('#missingCount'),staged:$('#stagedCount'),assigned:$('#assignedCount'),missingTab:$('#missingTab'),assignedTab:$('#assignedTab'),file:$('#fileInput'),commit:$('#commitButton')};
let words=[], queue=[], view='missing', selected=null, busy=false;
const committedNow=new Set(JSON.parse(sessionStorage.getItem('assetLoaderCommitted')||'[]'));

function setStatus(text='',kind=''){ui.status.textContent=text;ui.status.className='status'+(kind?' '+kind:'')}
function slug(word){return word.toLowerCase().replaceAll('ł','l').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function kb(n){return Math.max(1,Math.round(n/1024))+' KB'}
function hasAsset(w){return Boolean(sceneFor(w.masked,w.word))||committedNow.has(w.word)}
function queued(){return new Map(queue.map(x=>[x.word,x]))}
function openDb(){return new Promise((resolve,reject)=>{const r=indexedDB.open(DB_NAME,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'word'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function dbAll(){const db=await openDb();return new Promise((resolve,reject)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>reject(r.error)})}
async function dbPut(x){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(x);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
async function dbClear(){const db=await openDb();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}

function missingWords(){const q=queued();return words.filter(w=>!hasAsset(w)&&!q.has(w.word))}
function assignedWords(){const q=queued();const staged=queue.map(stage=>({...stage,stage}));const existing=words.filter(hasAsset).filter(w=>!q.has(w.word));return [...staged,...existing].sort((a,b)=>a.word.localeCompare(b.word,'pl'))}
function rowFor(item){
  const row=document.createElement('article');row.className='row';
  const main=document.createElement('div'),word=document.createElement('div'),meta=document.createElement('div');
  word.className='word';word.textContent=item.word;meta.className='meta';meta.textContent=(item.category||'')+' · trudność '+(item.difficulty||'—');main.append(word,meta);row.append(main);
  if(view==='missing'){
    const b=document.createElement('button');b.type='button';b.className='action';b.textContent='Dodaj';b.onclick=()=>pick(item);row.append(b);
  }else{
    const side=document.createElement('div');side.className='side';
    if(item.stage){
      const img=document.createElement('img');img.className='thumb';img.alt='';img.src=URL.createObjectURL(item.blob);img.onload=()=>URL.revokeObjectURL(img.src);
      const badge=document.createElement('span');badge.className='badge';badge.textContent=kb(item.size);
      const b=document.createElement('button');b.type='button';b.className='action';b.textContent='Zmień';b.onclick=()=>pick(item);side.append(img,badge,b);
    }else{const badge=document.createElement('span');badge.className='badge';badge.textContent='w repo';side.append(badge)}
    row.append(side);
  }
  return row;
}
function render(){
  const missing=missingWords(),assigned=assignedWords();ui.missing.textContent=missing.length;ui.staged.textContent=queue.length;ui.assigned.textContent=assigned.length;ui.commit.disabled=busy||!queue.length;
  const data=view==='missing'?missing:assigned;
  const nodes=data.length?data.map(rowFor):[Object.assign(document.createElement('div'),{className:'empty',textContent:view==='missing'?'Brak słów bez grafiki.':'Brak przypisanych grafik.'})];
  ui.list.replaceChildren(...nodes);
}
function setView(next){view=next;ui.missingTab.classList.toggle('active',next==='missing');ui.assignedTab.classList.toggle('active',next==='assigned');render()}
function pick(item){if(busy)return;selected=item;ui.file.value='';ui.file.click()}
function loadImage(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),img=new Image();img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Nie udało się odczytać obrazu.'))};img.src=url})}
function toWebp(canvas,q){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Nie udało się zakodować WebP.')),'image/webp',q))}
async function resize(file){
  const img=await loadImage(file),side=Math.min(img.naturalWidth,img.naturalHeight),sx=(img.naturalWidth-side)/2,sy=(img.naturalHeight-side)/2;
  let source=img,sourceX=sx,sourceY=sy,sourceSide=side;
  if(side>TARGET*2){const mid=document.createElement('canvas');mid.width=TARGET*2;mid.height=TARGET*2;const m=mid.getContext('2d',{alpha:false});m.imageSmoothingEnabled=true;m.imageSmoothingQuality='high';m.drawImage(img,sx,sy,side,side,0,0,mid.width,mid.height);source=mid;sourceX=0;sourceY=0;sourceSide=mid.width}
  const out=document.createElement('canvas');out.width=TARGET;out.height=TARGET;const ctx=out.getContext('2d',{alpha:false});ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(source,sourceX,sourceY,sourceSide,sourceSide,0,0,TARGET,TARGET);
  let blob;for(const q of QUALITIES){blob=await toWebp(out,q);if(blob.type!=='image/webp')throw new Error('Ta przeglądarka nie obsługuje zapisu WebP.');if(blob.size<=MAX_BYTES)break}return blob;
}
async function asBase64(blob){const bytes=new Uint8Array(await blob.arrayBuffer());let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(s)}
async function post(path,body){const r=await fetch(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||('Błąd '+r.status));return data}
async function onFile(){
  const file=ui.file.files?.[0],item=selected;selected=null;if(!file||!item)return;
  busy=true;render();setStatus('Przygotowuję „'+item.word+'”…');
  try{
    const blob=await resize(file),filename=slug(item.word)+'.webp';
    const staged=await post('/api/asset-stage',{filename,content:await asBase64(blob)});
    await dbPut({word:item.word,masked:item.masked,category:item.category,difficulty:item.difficulty,filename,blobSha:staged.sha,blob,size:blob.size,createdAt:Date.now()});
    queue=await dbAll();setStatus(item.word+' · 1080×1080 · '+kb(blob.size),'ok');
  }catch(e){setStatus(e.message||String(e),'error')}finally{busy=false;render()}
}
async function commit(){
  if(busy||!queue.length)return;busy=true;render();setStatus('Tworzę jeden zbiorczy commit…');
  try{
    const items=queue.map(({word,masked,category,difficulty,filename,blobSha})=>({word,masked,category,difficulty,filename,blobSha}));
    const result=await post('/api/asset-commit',{items});
    items.forEach(x=>committedNow.add(x.word));sessionStorage.setItem('assetLoaderCommitted',JSON.stringify([...committedNow]));await dbClear();queue=[];setView('assigned');setStatus('Gotowe — '+result.count+' grafik w jednym commicie.','ok');
  }catch(e){setStatus(e.message||String(e),'error')}finally{busy=false;render()}
}
ui.missingTab.onclick=()=>setView('missing');ui.assignedTab.onclick=()=>setView('assigned');ui.file.onchange=onFile;ui.commit.onclick=commit;
try{const packs=await Promise.all(Array.from({length:8},(_,i)=>fetch('../data/words-0'+(i+1)+'.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Nie udało się wczytać bazy słów.');return r.json()})));words=packs.flat();queue=await dbAll();render();setStatus('Gotowe.')}catch(e){setStatus(e.message||String(e),'error')}
