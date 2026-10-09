// This adapter changes presentation only. Existing editor handlers own every edit.
import {previewScale} from './studio-ui.mjs';
const mobile=matchMedia('(max-width: 690px)'),workspace=document.getElementById('workspace');
const menu=document.getElementById('mobile-navigation'),dock=document.getElementById('mobile-editor-dock');
const topbar=document.querySelector('.studio-topbar'),root=document.documentElement;
const modal=document.getElementById('studio-modal');
let pane='choose',editor='',navigationSignature='',scheduled=false,observedGallery;
const galleryObserver=new ResizeObserver(dimensions);

function dimensions(){
  if(!mobile.matches)return;
  root.style.setProperty('--mobile-header-height',topbar.getBoundingClientRect().height+'px');
  root.style.setProperty('--mobile-dock-height',dock.hidden?'0px':dock.getBoundingClientRect().height+'px');
  const gallery=workspace.querySelector('.preview-gallery.comparison');
  if(gallery?.clientWidth&&gallery.clientHeight){
    const scale=previewScale(gallery.clientWidth,gallery.clientHeight,{paddingX:20,paddingY:100});
    gallery.style.setProperty('--mobile-preview-scale',String(scale));
  }
}
function setPane(next){
  if(mobile.matches&&next!=='preview'){
    workspace.querySelector('#effect-stop')?.click();
    const play=workspace.querySelector('#motion-play');
    if(play?.textContent.includes('Zatrzymaj'))play.click();
  }
  pane=next;document.body.dataset.mobilePane=pane;
  document.dispatchEvent(new CustomEvent('mala-nauka:studio-pane',{detail:{pane}}));
  for(const button of dock.querySelectorAll('[data-mobile-pane]'))button.setAttribute('aria-pressed',String(button.dataset.mobilePane===pane));
  paneAccess();
  dimensions();
  if(mobile.matches)window.scrollTo({top:0,behavior:'instant'});
}
function paneAccess(){
  const preview=workspace.querySelector('.preview-column,.motion-preview');
  if(preview)preview.inert=mobile.matches&&pane==='edit';
  const gallery=workspace.querySelector('#preview-gallery,.motion-stage');
  if(gallery)gallery.inert=mobile.matches&&pane!=='preview';
}
function touchControls(){
  if(!mobile.matches)return;
  for(const input of workspace.querySelectorAll('.control-value input[type=number]')){
    input.inputMode=Number(input.step)<1?'decimal':'numeric';
    if(input.parentElement.querySelector('[data-mobile-step]'))continue;
    const label=input.getAttribute('aria-label')||'Wartość';
    for(const [direction,symbol,verb] of [[-1,'−','Zmniejsz'],[1,'+','Zwiększ']]){
      const button=document.createElement('button');button.type='button';button.className='mobile-only mobile-step';
      button.dataset.mobileStep=direction;button.textContent=symbol;button.setAttribute('aria-label',verb+': '+label);
      button.addEventListener('click',event=>{
        event.preventDefault();event.stopPropagation();
        direction<0?input.stepDown():input.stepUp();
        input.dispatchEvent(new Event('input',{bubbles:true}));
        input.dispatchEvent(new Event('change',{bubbles:true}));
      });
      direction<0?input.before(button):input.after(button);
    }
  }
}
function touchDialog(){
  if(!mobile.matches||!modal.open||modal.querySelector('.mobile-dialog-close'))return;
  const close=document.createElement('button');close.type='button';close.className='mobile-only mobile-dialog-close icon-button';
  close.textContent='×';close.setAttribute('aria-label','Zamknij okno');close.onclick=()=>modal.close();modal.prepend(close);
}
function touchPreview(){
  if(mobile.matches)for(const frame of workspace.querySelectorAll('.device-frame'))frame.loading='eager';
  const gallery=workspace.querySelector('#preview-gallery');
  if(gallery!==observedGallery){galleryObserver.disconnect();observedGallery=gallery;if(gallery)galleryObserver.observe(gallery);}
  const choices=workspace.querySelector('.compare-choices');
  if(choices&&!choices.querySelector('.mobile-comparison-hint')){
    const hint=document.createElement('p');hint.className='mobile-only mobile-comparison-hint';
    hint.textContent='Na telefonie przesuwaj ekrany palcem. Każdy zachowuje widok 390 × 844, a jego podgląd dopasowuje się do miejsca.';choices.append(hint);
  }
}
function sync(){
  scheduled=false;
  const buttons=[...document.querySelectorAll('#navigation [data-page]')];
  const signature=buttons.map(button=>button.dataset.page+button.className+button.hidden).join('|');
  if(signature!==navigationSignature){
    navigationSignature=signature;
    document.getElementById('mobile-navigation-list').replaceChildren(...[...document.querySelectorAll('#navigation [data-nav-group]')].map(group=>{const section=group.cloneNode(true);section.hidden=false;for(const copy of section.querySelectorAll('[data-page]')){copy.removeAttribute('title');copy.setAttribute('aria-current',copy.classList.contains('active')?'page':'false');}section.hidden=![...section.querySelectorAll('[data-page]')].some(b=>!b.hidden);return section;}));
  }
  const next=workspace.querySelector('.component-layout')?'components':workspace.querySelector('.effect-workspace')?'effects':workspace.querySelector('.motion-workspace')?'motion':'';
  if(editor!==next){editor=next;setPane('choose');}
  dock.hidden=!mobile.matches||!editor;
  document.body.classList.toggle('mobile-editor',mobile.matches&&Boolean(editor));
  const name=workspace.querySelector('#inspector h2')?.textContent;
  const view=workspace.querySelector('#view-select')?.selectedOptions[0]?.textContent;
  const comparing=workspace.querySelector('.preview-gallery.comparison');
 const context=editor==='components'?[name,comparing?'przesuń ekrany palcem':view].filter(Boolean).join(' · '):editor==='motion'?(workspace.querySelector('[data-motion-section][aria-pressed=true]')?.textContent||'Animacje'):editor==='effects'?['Efekty',workspace.querySelector('#play-inspector h2')?.textContent].filter(Boolean).join(' · '):'';
  const label=document.getElementById('mobile-editor-context');if(label.textContent!==context)label.textContent=context||'';
  const connection=document.getElementById('connect-git').textContent;
  if(document.getElementById('mobile-connect-git').textContent!==connection)document.getElementById('mobile-connect-git').textContent=connection;
  if(!mobile.matches&&menu.open)menu.close();
  touchControls();touchDialog();touchPreview();paneAccess();
  dimensions();
}
function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(sync);}}
document.getElementById('mobile-menu-open').onclick=()=>{document.getElementById('mobile-tool-search').value=document.getElementById('studio-nav-search').value;menu.showModal();};
document.getElementById('mobile-tool-search').addEventListener('input',event=>{const input=document.getElementById('studio-nav-search');input.value=event.target.value;input.dispatchEvent(new Event('input',{bubbles:true}));});
document.getElementById('mobile-menu-close').onclick=()=>menu.close();
menu.addEventListener('click',event=>{
  const button=event.target.closest('[data-page]');if(!button)return;
  menu.close();document.querySelector(`#navigation [data-page="${button.dataset.page}"]`)?.click();
});
document.getElementById('mobile-connect-git').onclick=()=>{menu.close();document.getElementById('connect-git').click();};
dock.addEventListener('click',event=>{const button=event.target.closest('[data-mobile-pane]');if(button)setPane(button.dataset.mobilePane);});
workspace.addEventListener('click',event=>{
  if(!mobile.matches)return;
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.mobilePaneTarget){requestAnimationFrame(()=>setPane(button.dataset.mobilePaneTarget));return;}
  if(button.dataset.controlGroup!==undefined){const index=Number(button.dataset.controlGroup);requestAnimationFrame(()=>{setPane('edit');requestAnimationFrame(()=>workspace.querySelector(`[data-motion-group="${index}"]`)?.scrollIntoView({block:'start'}));});return;}
  if(button.matches('[data-tree-select],[data-component],[data-open-view],[data-preview-action],[data-layer-select],#start-compare,[data-effect-id]'))requestAnimationFrame(()=>setPane('preview'));
  if(button.matches('[data-control-preview]')&&(!button.closest('.control-preview-tabs')||pane!=='choose'))requestAnimationFrame(()=>setPane('preview'));
  if(button.matches('[data-active-view]'))requestAnimationFrame(()=>setPane('edit'));
},true);
window.addEventListener('message',event=>{
  if(!mobile.matches||event.origin!==location.origin||event.data?.channel!=='mala-nauka-studio'||event.data.type!=='select')return;
  if([...workspace.querySelectorAll('iframe')].some(frame=>frame.contentWindow===event.source))setPane('edit');
});
new MutationObserver(schedule).observe(workspace,{childList:true,subtree:true});
new MutationObserver(schedule).observe(document.getElementById('navigation'),{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
new MutationObserver(schedule).observe(document.querySelector('.top-actions'),{childList:true,subtree:true});
new MutationObserver(schedule).observe(modal,{childList:true,attributes:true,attributeFilter:['open']});
const sizeObserver=new ResizeObserver(dimensions);sizeObserver.observe(topbar);sizeObserver.observe(dock);
mobile.addEventListener('change',schedule);window.addEventListener('resize',dimensions);
setPane(pane);sync();
