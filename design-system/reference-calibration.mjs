/* Screenshot comparison is a local-only Studio tool, never part of PWA. */
const DATABASE='mala-nauka-v2-reference-screens',STORE='screens';
export const screenshotViewByFilename=Object.freeze({
 IMG_2946:'home',IMG_2947:'spelling-settings',IMG_2948:'spelling-wrong',
 IMG_2949:'spelling-wrong-complete',IMG_2950:'spelling-results'
});
export function referenceViewForFile(name){
 const filename=String(name||'').replaceAll('\\','/').split('/').pop().replace(/\.[a-z0-9]+$/i,'').toUpperCase();
 return screenshotViewByFilename[filename]||null;
}
export const referenceProfiles=Object.freeze({
 home:'Home — produkcja',
 'spelling-settings':'Ortografia — ustawienia',
 'spelling-initial':'Ortografia — gra',
 'spelling-correct':'Ortografia — poprawna odpowiedź',
 'spelling-wrong':'Ortografia — błąd i slider (połowa)',
 'spelling-wrong-complete':'Ortografia — błąd i slider (koniec)',
 'spelling-results':'Ortografia — wyniki',
 'spelling-rule':'Ortografia — zasada pisowni'
});
export function referenceStorageKey(view,wrongVariant='mid'){
 return view==='spelling-wrong'&&wrongVariant==='complete'?'spelling-wrong-complete':view;
}
export function referenceAspect(width,height,targetWidth=390,targetHeight=844){
 if(!(width>0&&height>0))return {compatible:false,delta:Infinity};
 const delta=Math.abs(width/height-targetWidth/targetHeight)/(targetWidth/targetHeight);
 return {compatible:delta<=.035,delta};
}
let dbPromise;
function database(){
 if(!globalThis.indexedDB)return Promise.reject(new Error('IndexedDB nie jest dostępna'));
 return dbPromise??=new Promise((resolve,reject)=>{
  const request=indexedDB.open(DATABASE,1);
  request.onupgradeneeded=()=>request.result.createObjectStore(STORE);
  request.onerror=()=>reject(request.error||new Error('Nie udało się otworzyć bazy wzorców'));
  request.onsuccess=()=>resolve(request.result);
 });
}
async function request(mode,operation){
 const db=await database();
 return new Promise((resolve,reject)=>{
  const tr=db.transaction(STORE,mode),req=operation(tr.objectStore(STORE));
  req.onsuccess=()=>resolve(req.result||null);
  req.onerror=()=>reject(req.error||new Error('Błąd zapisu wzorca'));
 });
}
export function readReference(view){return request('readonly',store=>store.get(view));}
export function removeReference(view){return request('readwrite',store=>store.delete(view));}
export async function saveReference(view,file){
 if(!/image\/(png|jpeg|webp)/.test(file?.type||''))throw Error('Wybierz PNG, JPG lub WebP');
 if(file.size>12_000_000)throw Error('Obraz przekracza 12 MB');
 const bitmap=await createImageBitmap(file),size={width:bitmap.width,height:bitmap.height};
 bitmap.close();
 await request('readwrite',store=>store.put({image:file,...size,updatedAt:Date.now()},view));
 return size;
}
export class ReferenceCalibration {
 constructor(studio){this.studio=studio;this.cache=new Map();this.pending=new Set();this.loaded=new Set();this.opacity=50;this.wrongVariant='mid';}
 selectedKey(view){return referenceStorageKey(view,this.wrongVariant);}
 bind(){
  const root=this.studio.workspace;
  root.addEventListener('change',event=>{
   if(event.target?.id==='reference-variant'){
    this.wrongVariant=event.target.value==='complete'?'complete':'mid';this.sync();return;
   }
   if(event.target?.id!=='reference-upload')return;
   const files=[...(event.target.files||[])];if(files.length)void this.importFiles(files);
   event.stopImmediatePropagation();
  },true);
  root.addEventListener('input',event=>{
   if(event.target?.id!=='reference-opacity')return;
   this.opacity=Number(event.target.value);this.sync();
   event.stopImmediatePropagation();
  },true);
  root.addEventListener('click',event=>{
   if(event.target?.id!=='reference-remove')return;
   event.stopImmediatePropagation();void this.remove(this.selectedKey(this.studio.viewId));
  },true);
 }
 renderControls(){
  const node=this.studio.workspace.querySelector('#preview-controls');
  if(!node||node.querySelector('.reference-calibration'))return;
  node.insertAdjacentHTML('beforeend',`<section class="reference-calibration" aria-label="Porównanie ze wzorcem">
   <div class="reference-heading"><strong>Porównaj z produkcją</strong><span id="reference-status" role="status">Wczytaj wzorzec ekranu</span></div>
   <div class="reference-actions">
    <label class="small-button reference-upload">Wczytaj wzorce<input type="file" id="reference-upload" multiple accept="image/png,image/jpeg,image/webp" aria-label="Wczytaj zrzut produkcyjny"></label>
    <label class="reference-opacity">Nałożenie <input type="range" id="reference-opacity" min="0" max="100" value="${this.opacity}" aria-label="Procent widoczności wzorca"><output id="reference-opacity-value">${this.opacity}%</output></label>
    <label id="reference-variant-wrap" hidden>Stan slidera <select id="reference-variant" aria-label="Moment przesuwania slidera"><option value="mid">W połowie · IMG_2948</option><option value="complete">Przy końcu · IMG_2949</option></select></label>
    <button type="button" class="small-button" id="reference-remove">Usuń wzorzec</button>
   </div><p class="reference-help">Zaznacz razem IMG_2946–2950: Studio przypisze je do Home, ustawień, dwóch momentów slidera po błędzie i wyników. Obrazy pozostają tylko w tej przeglądarce (IndexedDB). Wyciętego kadru z V1 nie rozciągamy do 390 × 844.</p>
  </section>`);
  this.status();
 }
 status(){
  const reference=this.cache.get(this.selectedKey(this.studio.viewId)),node=this.studio.workspace;
  const label=node.querySelector('#reference-status'),remove=node.querySelector('#reference-remove'),slider=node.querySelector('#reference-opacity'),output=node.querySelector('#reference-opacity-value');
  if(label)label.textContent=reference?(reference.compatible?'Wzorzec wyrównany do telefonu':'Uwaga: wzorzec jest wykadrowany'):'Brak zapisanego wzorca dla tego ekranu';
  if(remove)remove.disabled=!reference;
  const variant=node.querySelector('#reference-variant-wrap');if(variant)variant.hidden=this.studio.viewId!=='spelling-wrong';
  const select=node.querySelector('#reference-variant');if(select)select.value=this.wrongVariant;
  if(slider)slider.value=String(this.opacity);
  if(output)output.textContent=this.opacity+'%';
 }
 async load(view){
  if(this.pending.has(view)||this.loaded.has(view))return;
  this.pending.add(view);this.loaded.add(view);
  try{
   const data=await readReference(view);
   if(data?.image)this.cache.set(view,{url:URL.createObjectURL(data.image),...referenceAspect(data.width,data.height)});
  }catch{}
  finally{this.pending.delete(view);this.sync();this.status();}
 }
 sync(){
  for(const tile of this.studio.workspace.querySelectorAll('.preview-tile')){
   const view=tile.dataset.tileView,phone=tile.querySelector('.phone-outer');
   if(!phone)continue;
   const key=this.selectedKey(view),ref=this.cache.get(key);
   let image=phone.querySelector('.studio-reference-image');
   if(ref){
    if(!image){image=document.createElement('img');image.className='studio-reference-image';image.alt='Wzorzec produkcyjny';image.draggable=false;phone.append(image);}
    if(image.src!==ref.url)image.src=ref.url;
    image.style.opacity=String(this.opacity/100);
   }else{image?.remove();if(!this.pending.has(view))void this.load(key);}
  }
  this.status();
 }
 async importFiles(files){
  let loaded=0,skipped=0;
  for(const file of files){
   const view=referenceViewForFile(file.name)||(files.length===1?this.studio.viewId:null);
   if(!view){skipped++;continue;}
   if(await this.import(view,file,{silent:true}))loaded++;
  }
  this.sync();
  this.studio.notice(loaded?'Wczytano '+loaded+' wzorców'+(skipped?' · pominięto '+skipped+' nierozpoznanych plików':''):'Nie rozpoznano wzorców. Wybierz IMG_2946–2950.');
 }
 async import(view,file,{silent=false}={}){
  try{
   const size=await saveReference(view,file);
   const old=this.cache.get(view);if(old?.url)URL.revokeObjectURL(old.url);
   const ratio=referenceAspect(size.width,size.height);
   this.cache.set(view,{url:URL.createObjectURL(file),...ratio});
   this.sync();
   if(!silent)this.studio.notice(ratio.compatible?'Wzorzec zapisany. Przesuń suwak nałożenia.':'Zapisano wykadrowany obraz. Pełny screenshot da dokładniejsze porównanie.');
   return true;
  }catch(error){this.studio.notice('Nie udało się zapisać wzorca: '+error.message);return false;}
 }
 async remove(view){
  try{await removeReference(view);}catch(error){this.studio.notice('Błąd usuwania wzorca: '+error.message);return;}
  const old=this.cache.get(view);if(old?.url)URL.revokeObjectURL(old.url);
  this.cache.delete(view);this.sync();
 }
}
