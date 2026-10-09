// Use the same full-bleed canvas on every screen; only the keyboard reduces it.
(() => {
  const style=document.documentElement.style;
  let scheduled=false;
  const studio=new URLSearchParams(location.search).has('studio');
  const mobile=!studio&&((navigator.userAgentData?.mobile===true)||(/iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent))||(/Macintosh|iPad/.test(navigator.userAgent)&&navigator.maxTouchPoints>1));
  document.documentElement.dataset.device=mobile?'phone':'desktop';
  function orientation(portrait){
    const blocked=mobile&&!portrait,changed=document.documentElement.classList.contains('landscape-blocked')!==blocked;document.documentElement.classList.toggle('landscape-blocked',blocked);if(changed)document.dispatchEvent(new CustomEvent('mala-nauka:orientation',{detail:{blocked}}));
    let notice=document.getElementById('portrait-notice');
    if(blocked&&!notice){notice=document.createElement('div');notice.id='portrait-notice';notice.setAttribute('role','status');notice.innerHTML='<span aria-hidden="true">↻</span><strong>Obróć telefon do pionu</strong><p>Mała Nauka działa w pionie.</p>';document.body.append(notice);}
    if(notice)notice.hidden=!blocked;
    const app=document.getElementById('app');if(app){if(blocked){if(app.dataset.orientationInert===undefined)app.dataset.orientationInert=String(app.inert);app.inert=true;}else if(app.dataset.orientationInert!==undefined){app.inert=app.dataset.orientationInert==='true';delete app.dataset.orientationInert;}}
  }
  function syncViewport(){
    scheduled=false;
    const viewport=window.visualViewport;
    const portrait=window.innerWidth<window.innerHeight;
    if(document.body)orientation(portrait);
    const width=portrait?Math.min(screen.width,screen.height):Math.max(screen.width,screen.height);
    const screenHeight=portrait?Math.max(screen.width,screen.height):Math.min(screen.width,screen.height);
    const standalone=navigator.standalone===true&&Math.abs(width-window.innerWidth)<2;
    const editing=document.activeElement?.matches('input:not([type="radio"]):not([type="checkbox"]), textarea, [contenteditable="true"]');
    const baseline=standalone?screenHeight:window.innerHeight;
    const keyboard=Boolean(editing&&viewport&&viewport.height<baseline*.78);
    document.documentElement.classList.toggle('keyboard-open',keyboard);
    if(keyboard){
      style.setProperty('--app-viewport-height',`${viewport.height}px`);
      style.setProperty('--app-viewport-offset',`${viewport.offsetTop}px`);
    }else{
      if(standalone)style.setProperty('--app-viewport-height',`${screenHeight}px`);
      else style.removeProperty('--app-viewport-height');
      style.removeProperty('--app-viewport-offset');
    }
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(syncViewport);}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',syncViewport,{once:true});else syncViewport();
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('pageshow',schedule);
  window.visualViewport?.addEventListener('resize',schedule,{passive:true});
  window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
  document.addEventListener('focusin',schedule);
  document.addEventListener('focusout',schedule);
})();
