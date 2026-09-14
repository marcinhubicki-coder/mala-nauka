const MODULE_PATHS={
  spelling:'ortografia',
  math:'matematyka',
  english:'angielski',
  flags:'flagi',
  reading:'czytanie'
};

const lockedMode=globalThis.__MALA_NAUKA_MODE__||'';
let booted=false;

// Na ekranie głównym każdy kafel prowadzi do stałego adresu swojego modułu.
document.addEventListener('click',event=>{
  const button=event.target.closest('button[data-action="choose-mode"][data-mode]');
  if(!button)return;
  const mode=button.dataset.mode;
  if(lockedMode===mode)return;
  const folder=MODULE_PATHS[mode];
  if(!folder)return;
  event.preventDefault();
  event.stopPropagation();
  location.href=new URL(`./${folder}/`,document.baseURI).href;
},true);

// Strony modułów używają tej samej powłoki i po załadowaniu od razu otwierają swój tryb.
if(lockedMode){
  const root=document.querySelector('#app');
  const boot=()=>{
    if(booted)return;
    const button=root?.querySelector(`button[data-action="choose-mode"][data-mode="${lockedMode}"]`);
    if(!button)return;
    booted=true;
    button.click();
  };
  new MutationObserver(boot).observe(root,{childList:true,subtree:true});
  boot();
}
