// Use the same full-bleed canvas on every screen; only the keyboard reduces it.
(() => {
  const style=document.documentElement.style;
  let scheduled=false;
  function syncViewport(){
    scheduled=false;
    const viewport=window.visualViewport;
    const portrait=window.innerWidth<window.innerHeight;
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
  syncViewport();
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('pageshow',schedule);
  window.visualViewport?.addEventListener('resize',schedule,{passive:true});
  window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
  document.addEventListener('focusin',schedule);
  document.addEventListener('focusout',schedule);
})();
