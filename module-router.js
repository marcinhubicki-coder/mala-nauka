const studioMode=new URLSearchParams(location.search).has('studio');
const lockedMode=globalThis.__MALA_NAUKA_MODE__||'';
let booted=false;

// The app hosts each mode document, keeping one background audio context alive.

// Strony modułów używają tej samej powłoki i po załadowaniu od razu otwierają swój tryb.
if(lockedMode&&!studioMode&&new URLSearchParams(location.search).get('audio-host')!=='1'){
  const root=document.querySelector('#app');
  const boot=()=>{
    if(booted)return;
    const button=root?.querySelector(`button[data-action="choose-mode"][data-mode="${lockedMode}"]`);
    if(!button||studioMode)return;
    booted=true;
    button.click();
  };
  new MutationObserver(boot).observe(root,{childList:true,subtree:true});
  boot();
}
