// Decode the real scene materials while the entry blur is still visible.
// A failed required asset keeps the gate closed and offers an explicit retry.
const images=new Map();
export function decodeScenicImage(source){
 const url=new URL(source,document.baseURI).href;
 if(!images.has(url)){
  const task=(async()=>{const image=new Image();image.src=url;await image.decode();return image})();
  images.set(url,task);task.catch(()=>images.delete(url));
 }
 const job=images.get(url);images.delete(url);images.set(url,job);
 // Scene materials and two rounds fit comfortably; flags from past rounds
 // must not accumulate as decoded full-size images during a long session.
 while(images.size>40)images.delete(images.keys().next().value);
 return job;
}
const materials=['scenic-scene-v29.webp','scenic-boy-v29.webp','scenic-paper-v14.webp','scenic-compass-v10.webp','scenic-answer-border-v29.webp','scenic-answer-grain-v29.webp','scenic-neighbor-border-v29.webp','scenic-neighbor-grain-v29.webp','scenic-swipe-border-v29.webp','scenic-swipe-grain-v29.webp','scenic-task-sign-v28.webp','scenic-task-back-mask-v29.svg','scenic-task-front-mask-v29.svg'];
export function prepareScenicScene(){
 return Promise.all([document.fonts.ready,...[['ScenicCartography',28],['ScenicBody',20],['ScenicPrint',20],['ScenicRound',40],['ScenicAtlas',17]].map(([family,size])=>document.fonts.load(`700 ${size}px ${family}`,'Zażółć gęślą jaźń')),...materials.map(name=>decodeScenicImage('assets/flags/adventure/'+name)),decodeScenicImage('assets/maps/europe-edge-v22.webp')]);
}
export function createScenicGate(app,language){
 const gate=document.createElement('div');gate.className='scenic-entry-gate';gate.setAttribute('role','status');gate.setAttribute('aria-live','polite');
 const label=document.createElement('span'),retry=document.createElement('button');retry.type='button';retry.hidden=true;gate.append(label,retry);document.body.append(gate);
 const copy=()=>language()==='en'?['Preparing your adventure…','Could not load the adventure.','Try again']:['Przygotowujemy przygodę…','Nie udało się wczytać przygody.','Spróbuj ponownie'];
 function hold(){app.dataset.ready='false';app.inert=true;app.setAttribute('aria-busy','true');gate.hidden=false;label.textContent=copy()[0];retry.hidden=true;}
 async function reveal(){if(!window.frameElement?.scenicSession)await new Promise(requestAnimationFrame);app.dataset.ready='true';app.inert=false;app.setAttribute('aria-busy','false');gate.hidden=true;document.dispatchEvent(new CustomEvent('mala-nauka:scenic-ready'));parent.postMessage({type:'mala-nauka:scenic-ready'},location.origin);}
 function fail(run){label.textContent=copy()[1];retry.textContent=copy()[2];retry.hidden=false;retry.onclick=()=>{hold();run()};parent.postMessage({type:'mala-nauka:scenic-error'},location.origin);}
 hold();return {hold,reveal,fail};
}
