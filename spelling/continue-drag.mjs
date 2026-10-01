import { JELLY_V4_DEFAULTS } from '../shared/jelly-v4.mjs?v=2';

// Completion depends on movement from the handle. A tap anywhere on the rail
// cannot advance, and an interrupted or partial gesture always springs home.
export function dragFraction(start, current, travel) {
  return travel > 0 ? Math.max(0, Math.min(1, (current - start) / travel)) : 0;
}
export function completedDrag(fraction, distance) {
  return fraction >= .96 && distance >= 24;
}

export function createContinueDrag(rail, { canContinue, onComplete }) {
  const handle = rail.querySelector('.continue-handle');
  const params = JELLY_V4_DEFAULTS;
  let gesture = null, animation = null, completed = false, current = 0;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const draw = (x, squish = 0) => {
    current = x;
    handle.style.transform = `translateX(${x}px) scale(${1+squish*.07},${1-squish*.15}) rotate(${squish*params.shape.tilt}deg)`;
  };
  const reset = (animate = true) => {
    gesture = null;
    animation?.cancel();animation = null;
    rail.classList.remove('is-dragging');
    rail.setAttribute('aria-valuenow','0');
    const from = handle.style.transform;
    draw(0);
    if (animate && current !== null && !preference.matches) {
      animation = handle.animate([
        {transform:from},
        {transform:'translateX(-3px) scale(.96,1.03)',offset:.72},
        {transform:'translateX(0) scale(1,1)'}
      ],{duration:Math.round(450*params.motion.duration),easing:'cubic-bezier(.16,.78,.22,1)'});
    }
  };
  const down = event => {
    if(completed||!canContinue()||event.button!==0||!event.isPrimary||!event.target.closest('.continue-handle'))return;
    event.preventDefault();animation?.cancel();animation=null;draw(0);
    const travel=rail.clientWidth-handle.offsetWidth-8;
    gesture={id:event.pointerId,start:event.clientX,travel,fraction:0,distance:0};
    handle.setPointerCapture(event.pointerId);rail.classList.add('is-dragging');rail.focus({preventScroll:true});
  };
  const move = event => {
    if(!gesture||gesture.id!==event.pointerId)return;
    if(!canContinue()){reset();return;}
    gesture.distance=event.clientX-gesture.start;
    gesture.fraction=dragFraction(gesture.start,event.clientX,gesture.travel);
    draw(gesture.fraction*gesture.travel,Math.sin(gesture.fraction*Math.PI)*params.motion.stretch);
    rail.style.setProperty('--drag-progress',gesture.fraction);
    rail.setAttribute('aria-valuenow',String(Math.round(gesture.fraction*100)));
  };
  const up = event => {
    if(!gesture||gesture.id!==event.pointerId)return;
    move(event);
    const commit=gesture&&canContinue()&&completedDrag(gesture.fraction,gesture.distance);
    if(commit){completed=true;gesture=null;rail.classList.remove('is-dragging');onComplete();}
    else reset();
  };
  const cancel = () => {if(gesture)reset();};
  const key = event => {
    // Keyboard arrows operate the slider; Enter/Space never act as a button.
    if(!['ArrowRight','ArrowLeft','Home'].includes(event.key)||!canContinue()||completed)return;
    event.preventDefault();
    const travel=rail.clientWidth-handle.offsetWidth-8;
    const x=event.key==='Home'?0:Math.max(0,Math.min(travel,current+(event.key==='ArrowRight'?1:-1)*travel/10));
    draw(x);rail.setAttribute('aria-valuenow',String(Math.round(x/travel*100)));
    if(x>=travel-1){completed=true;onComplete();}
  };
  rail.addEventListener('pointerdown',down);
  rail.addEventListener('pointermove',move);
  rail.addEventListener('pointerup',up);
  rail.addEventListener('pointercancel',cancel);
  rail.addEventListener('lostpointercapture',cancel);
  rail.addEventListener('keydown',key);
  return {reset:()=>{completed=false;rail.style.removeProperty('--drag-progress');reset(false);},destroy:()=>{
    animation?.cancel();
    rail.removeEventListener('pointerdown',down);rail.removeEventListener('pointermove',move);
    rail.removeEventListener('pointerup',up);rail.removeEventListener('pointercancel',cancel);
    rail.removeEventListener('lostpointercapture',cancel);rail.removeEventListener('keydown',key);
  }};
}
