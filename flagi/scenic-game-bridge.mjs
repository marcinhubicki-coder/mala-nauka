// Keep the real configured Session (difficulty, source, score and history) in
// the application. The scenic frame supplies presentation and its readiness.
export function prepareScenicGame(session,{onExit,onEnd,onAnswer}={}){
 const standalone=navigator.standalone===true||matchMedia('(display-mode:standalone)').matches;
 const host=document.createElement('section'),frame=document.createElement('iframe');
 host.className='scenic-host';host.inert=true;host.setAttribute('aria-label','Gra Flagi');host.style.cssText='position:fixed;inset:0;z-index:30;display:grid;place-items:center;background:#253222;opacity:0;pointer-events:none';
 frame.title='Mała Nauka — Flagi';frame.scenicSession=session;frame.scenicActive=false;
 frame.style.cssText='display:block;border:0;flex:none;transform-origin:center center';host.append(frame);document.body.append(host);
 const probe=document.createElement('div');probe.style.cssText='position:fixed;visibility:hidden;padding:var(--app-safe-top,env(safe-area-inset-top)) 0 var(--app-safe-bottom,env(safe-area-inset-bottom))';document.body.append(probe);const safe=getComputedStyle(probe);
 frame.scenicInsets={top:parseFloat(safe.paddingTop)||0,bottom:parseFloat(safe.paddingBottom)||0};probe.remove();
 const url=new URL('flagi/scenic-preview.html',document.baseURI);url.searchParams.set('view','game');url.searchParams.set('hosted','1');url.searchParams.set('v','39');
 url.searchParams.set('lang',window.MalaNaukaFlagLanguage?.language==='en'?'en':'pl');frame.src=url.href;
 function fit(){
  if(standalone){frame.style.width='100%';frame.style.height='100%';frame.style.transform='none';}
  else{const scale=Math.min(innerWidth/390,innerHeight/844,480/390);frame.style.width='390px';frame.style.height='844px';frame.style.transform=`scale(${scale})`;}
 }
 fit();addEventListener('resize',fit);
 let resolve,reject;const ready=new Promise((a,b)=>{resolve=a;reject=b});
 const send=(type,paused)=>frame.contentWindow?.postMessage({type,paused},location.origin);
 function message(event){
  if(event.origin!==location.origin||event.source!==frame.contentWindow)return;
  if(event.data?.type==='mala-nauka:scenic-ready')resolve();
  if(event.data?.type==='mala-nauka:scenic-error')reject(Error('Nie udało się przygotować przygody. Spróbuj ponownie.'));
  if(event.data?.type==='mala-nauka:scenic-exit')onExit?.();
  if(event.data?.type==='mala-nauka:scenic-ended')onEnd?.();
  if(event.data?.type==='mala-nauka:scenic-answer')onAnswer?.(event.data.correct===true);
  if(event.data?.type==='mala-nauka:scenic-language')window.MalaNaukaFlagLanguage?.setLanguage(event.data.language);
 }
 addEventListener('message',message);
 // Never reparent a loaded iframe: WebKit would discard the prepared document.
 return {ready,frame,mount(root){host.style.opacity='1';host.style.pointerEvents='auto';root.replaceChildren();root.dataset.scenic='true';if(standalone)document.body.classList.add('scenic-hosted-standalone');},activate(){host.inert=false;frame.scenicActive=true;send('mala-nauka:scenic-activate')},pause(paused){send('mala-nauka:scenic-pause',paused)},destroy(){removeEventListener('resize',fit);removeEventListener('message',message);host.remove();document.body.classList.remove('scenic-hosted-standalone');}};
}
