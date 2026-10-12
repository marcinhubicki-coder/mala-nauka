export const STUDIO_URL='https://mala-nauka-pwa-git-design-system-v1-nzckzxw2x6-4792s-projects.vercel.app/design-system/';
const tag=document.querySelector('.branch-tag');
if(tag){
 const link=document.createElement('a');link.href=STUDIO_URL;link.textContent='Stały link do Studio';link.className='studio-permanent-link';tag.insertAdjacentElement('afterend',link);
 const version=document.createElement('small');version.className='studio-build-version';version.setAttribute('aria-label','Wersja Studio');link.insertAdjacentElement('afterend',version);
 fetch(new URL('deployment.json',import.meta.url),{cache:'no-store'}).then(r=>r.ok?r.json():null).then(data=>{
  if(!data?.sha)return;const time=data.builtAt?new Intl.DateTimeFormat('pl-PL',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Warsaw'}).format(new Date(data.builtAt)):'';
  version.textContent=`Wersja ${data.sha.slice(0,7)}${time?' · '+time:''}`;version.title='Kod gry i Design Studio z tej samej wersji '+data.sha;
 }).catch(()=>{});
}
