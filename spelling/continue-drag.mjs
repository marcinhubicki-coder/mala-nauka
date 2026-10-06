import {effectiveTokens} from '../design-system/model.mjs';

// Completion depends on movement from the handle. A tap anywhere on the rail
// cannot advance, and an interrupted or partial gesture always springs home.
export function dragFraction(start, current, travel) {
  return travel > 0 ? Math.max(0, Math.min(1, (current - start) / travel)) : 0;
}
export function completedDrag(fraction, distance) {
  const threshold=(effectiveTokens('slider').threshold??96)/100;
  return fraction >= threshold && distance >= 24;
}

export function continueMotion(variant='wrong'){
  const defaults={springDuration:405,springOvershoot:3,fillDuration:350,completionDelay:variant==='result'?350:240,glowBlur:9,...(variant==='result'?{doneDuration:300}:{sparkDuration:600})};
  return {...defaults,...effectiveTokens(variant==='result'?'sliderResult':'sliderWrong')};
}

export function createContinueDrag(rail, { canContinue, onComplete, completionDelay, variant='wrong' }) {
  const handle = rail.querySelector('.continue-handle');
  const settings=continueMotion(variant);
  let gesture = null, animation = null, completed = false, current = 0;
  let completionTimer;
  const complete=()=>{completed=true;gesture=null;rail.classList.remove('is-dragging');rail.classList.add('is-complete');rail.style.setProperty('--drag-progress',1);rail.setAttribute('aria-valuenow','100');completionTimer=setTimeout(()=>{if(rail.isConnected&&canContinue())onComplete();},completionDelay??settings.completionDelay);};
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const draw = x => {
    current = x;
    handle.style.transform = `translateX(${x}px)`;
  };
  const reset = (animate = true) => {
    gesture = null;
    animation?.cancel();animation = null;
    rail.classList.remove('is-dragging','is-complete');
    rail.style.setProperty('--drag-progress',0);
    rail.setAttribute('aria-valuenow','0');
    const from = handle.style.transform;
    draw(0);
    if (animate && current !== null && !preference.matches) {
      animation = handle.animate([
        {transform:from},
        {transform:`translateX(-${settings.springOvershoot}px)`,offset:.72},
        {transform:'translateX(0)'}
      ],{duration:settings.springDuration,easing:'cubic-bezier(.16,.78,.22,1)'});
    }
  };
  const down = event => {
    if(completed||!canContinue()||event.button!==0||!event.isPrimary||!event.target.closest('.continue-handle'))return;
    event.preventDefault();animation?.cancel();animation=null;draw(0);
    const travel=rail.clientWidth-handle.offsetWidth-2*handle.offsetLeft;
    gesture={id:event.pointerId,start:event.clientX,travel,fraction:0,distance:0};
    handle.setPointerCapture(event.pointerId);rail.classList.add('is-dragging');rail.focus({preventScroll:true});
  };
  const move = event => {
    if(!gesture||gesture.id!==event.pointerId)return;
    if(!canContinue()){reset();return;}
    gesture.distance=event.clientX-gesture.start;
    gesture.fraction=dragFraction(gesture.start,event.clientX,gesture.travel);
    draw(gesture.fraction*gesture.travel);
    rail.style.setProperty('--drag-progress',gesture.fraction);
    rail.setAttribute('aria-valuenow',String(Math.round(gesture.fraction*100)));
  };
  const up = event => {
    if(!gesture||gesture.id!==event.pointerId)return;
    move(event);
    const commit=gesture&&canContinue()&&completedDrag(gesture.fraction,gesture.distance);
    if(commit)complete();
    else reset();
  };
  const cancel = () => {if(gesture)reset();};
  const key = event => {
    // Keyboard arrows operate the slider; Enter/Space never act as a button.
    if(!['ArrowRight','ArrowLeft','Home'].includes(event.key)||!canContinue()||completed)return;
    event.preventDefault();
    const travel=rail.clientWidth-handle.offsetWidth-2*handle.offsetLeft;
    const x=event.key==='Home'?0:Math.max(0,Math.min(travel,current+(event.key==='ArrowRight'?1:-1)*travel/10));
    draw(x);rail.style.setProperty('--drag-progress',travel?x/travel:0);rail.setAttribute('aria-valuenow',String(Math.round(x/travel*100)));
    if(x>=travel-1)complete();
  };
  rail.addEventListener('pointerdown',down);
  rail.addEventListener('pointermove',move);
  rail.addEventListener('pointerup',up);
  rail.addEventListener('pointercancel',cancel);
  rail.addEventListener('lostpointercapture',cancel);
  rail.addEventListener('keydown',key);
  return {reset:()=>{clearTimeout(completionTimer);completed=false;rail.style.removeProperty('--drag-progress');reset(false);},destroy:()=>{
    clearTimeout(completionTimer);animation?.cancel();
    rail.removeEventListener('pointerdown',down);rail.removeEventListener('pointermove',move);
    rail.removeEventListener('pointerup',up);rail.removeEventListener('pointercancel',cancel);
    rail.removeEventListener('lostpointercapture',cancel);rail.removeEventListener('keydown',key);
  }};
}
