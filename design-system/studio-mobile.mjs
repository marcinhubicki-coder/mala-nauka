// This adapter changes presentation only. Existing editor handlers own every edit.
const mobile=matchMedia('(max-width: 690px)'),workspace=document.getElementById('workspace');
const menu=document.getElementById('mobile-navigation'),dock=document.getElementById('mobile-editor-dock');
const topbar=document.querySelector('.studio-topbar'),root=document.documentElement;
const modal=document.getElementById('studio-modal');
let pane='choose',editor='',navigationSignature='',scheduled=false;

function dimensions(){
  if(!mobile.matches)return;
  root.style.setProperty('--mobile-header-height',topbar.getBoundingClientRect().height+'px');
  root.style.setProperty('--mobile-dock-height',dock.hidden?'0px':dock.getBoundingClientRect().height+'px');
}
function setPane(next){
  pane=next;document.body.dataset.mobilePane=pane;
  for(const button of dock.querySelectorAll('[data-mobile-pane]'))button.setAttribute('aria-pressed',String(button.dataset.mobilePane===pane));
  dimensions();
  if(mobile.matches)window.scrollTo({top:0,behavior:'instant'});
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
function sync(){
  scheduled=false;
  const buttons=[...document.querySelectorAll('#navigation [data-page]')];
  const signature=buttons.map(button=>button.dataset.page+button.className).join('|');
  if(signature!==navigationSignature){
    navigationSignature=signature;
    document.getElementById('mobile-navigation-list').replaceChildren(...buttons.map(button=>{
      const copy=button.cloneNode(true);copy.removeAttribute('title');copy.setAttribute('aria-current',button.classList.contains('active')?'page':'false');return copy;
    }));
  }
  const next=workspace.querySelector('.component-layout')?'components':workspace.querySelector('.motion-workspace')?'motion':'';
  if(editor!==next){editor=next;setPane('choose');}
  dock.hidden=!mobile.matches||!editor;
  document.body.classList.toggle('mobile-editor',mobile.matches&&Boolean(editor));
  const context=editor==='components'?workspace.querySelector('#inspector h2')?.textContent:editor==='motion'?'Przejścia między ekranami':'';
  const label=document.getElementById('mobile-editor-context');if(label.textContent!==context)label.textContent=context||'';
  const connection=document.getElementById('connect-git').textContent;
  if(document.getElementById('mobile-connect-git').textContent!==connection)document.getElementById('mobile-connect-git').textContent=connection;
  if(!mobile.matches&&menu.open)menu.close();
  touchControls();touchDialog();
  dimensions();
}
function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(sync);}}
document.getElementById('mobile-menu-open').onclick=()=>menu.showModal();
document.getElementById('mobile-menu-close').onclick=()=>menu.close();
menu.addEventListener('click',event=>{
  const button=event.target.closest('[data-page]');if(!button)return;
  menu.close();document.querySelector(`#navigation [data-page="${button.dataset.page}"]`)?.click();
});
document.getElementById('mobile-connect-git').onclick=()=>{menu.close();document.getElementById('connect-git').click();};
dock.addEventListener('click',event=>{const button=event.target.closest('[data-mobile-pane]');if(button)setPane(button.dataset.mobilePane);});
window.addEventListener('message',event=>{
  if(!mobile.matches||event.origin!==location.origin||event.data?.channel!=='mala-nauka-studio'||event.data.type!=='select')return;
  if([...workspace.querySelectorAll('iframe')].some(frame=>frame.contentWindow===event.source))setPane('edit');
});
new MutationObserver(schedule).observe(workspace,{childList:true,subtree:true});
new MutationObserver(schedule).observe(document.getElementById('navigation'),{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
new MutationObserver(schedule).observe(document.querySelector('.top-actions'),{childList:true,subtree:true});
new MutationObserver(schedule).observe(modal,{childList:true,attributes:true,attributeFilter:['open']});
const sizeObserver=new ResizeObserver(dimensions);sizeObserver.observe(topbar);sizeObserver.observe(dock);
mobile.addEventListener('change',schedule);window.addEventListener('resize',dimensions);
setPane(pane);sync();
