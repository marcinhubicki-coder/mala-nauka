export const STUDIO_URL='https://mala-nauka-v2.vercel.app/design-system/';
const tag=document.querySelector('.branch-tag');
if(tag){
 const link=document.createElement('a');link.href=STUDIO_URL;link.textContent='Stały link do Studio V2';link.className='studio-permanent-link';tag.insertAdjacentElement('afterend',link);
 const version=document.createElement('small');version.className='studio-build-version';version.setAttribute('aria-label','Wersja Studio');link.insertAdjacentElement('afterend',version);
 fetch(new URL('deployment.json',import.meta.url),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{
  if(!data)return;
  const isV2=data.branch?.startsWith('refactor/v2-')||data.branch==='design/system-v2';
  if(isV2){
   tag.innerHTML='<span></span>V2 · '+data.branch.replaceAll('<','&lt;')+' · PREVIEW';
   const brand=document.querySelector('.studio-brand small');if(brand)brand.textContent='Design Studio V2';
   const breadcrumb=document.querySelector('.breadcrumb');if(breadcrumb)breadcrumb.textContent='Design Studio V2 · Preview';
   document.title='Mała Nauka · Design Studio V2 (Preview)';
   const github=document.querySelector('.sidebar-bottom a[href*="github.com"]');if(github)github.href='https://github.com/marcinhubicki-coder/mala-nauka/tree/'+data.branch;
   // The HTML build injects the verified branch before Studio scripts load.
   if(window.__DS_STUDIO_BRANCH__!==data.branch){
    const save=document.getElementById('save-git');if(save)save.disabled=true;
    const connect=document.getElementById('connect-git');if(connect)connect.disabled=true;
    version.textContent='Błąd wersji gałęzi — zapis zablokowany';
    return;
   }
  }else{link.href='https://mala-nauka-pwa-git-design-system-v1-nzckzxw2x6-4792s-projects.vercel.app/design-system/';link.textContent='Stały link do Studio';}
  if(!data.sha)return;
  const time=data.builtAt?new Intl.DateTimeFormat('pl-PL',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Warsaw'}).format(new Date(data.builtAt)):'';
  version.textContent=(isV2?'V2 · ':'Wersja ')+data.sha.slice(0,7)+(time?' · '+time:'');
  version.title='Kod gry i Design Studio z tej samej wersji '+data.sha;
 }).catch(()=>{});
}
