import {effectiveTokens} from '../design-system/model.mjs';
import {jellyTransform} from '../shared/jelly-v4.mjs';

// Completion depends on movement from the handle. A tap anywhere on the rail
// cannot advance, and an interrupted or partial gesture always springs home.
export function dragFraction(start, current, travel) {
  return travel > 0 ? Math.max(0, Math.min(1, (current - start) / travel)) : 0;
}
export function completedDrag(fraction, distance, thresholdValue=effectiveTokens('slider').threshold??96) {
  const threshold=thresholdValue/100;
  return fraction >= threshold && distance >= 24;
}

export function continueMotion(variant='wrong',getTokens=effectiveTokens){
  const defaults={springDuration:405,springOvershoot:3,fillDuration:350,completionDelay:variant==='result'?350:240,glowBlur:9,...(variant==='result'?{doneDuration:300}:{sparkDuration:600})};
  return {...defaults,...getTokens(variant==='result'?'sliderResult':'sliderWrong')};
}

export function sliderJellyTransform(x,amount=0,direction=1,jelly=effectiveTokens('jelly')){
  const offset=Math.round((Number(x)||0)*1000)/1000;
  return `translate3d(${offset}px,0,0) ${jellyTransform(amount,direction,jelly)}`;
}

export function createContinueDrag(rail, { canContinue, onComplete, completionDelay, variant='wrong',getTokens=effectiveTokens }) {
  const handle = rail.querySelector('.continue-handle');
  let settings=continueMotion(variant,getTokens),jelly=getTokens('jelly');
  let gesture = null, animation = null, completed = false, current = 0;
  let completionTimer;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const refresh=()=>{settings=continueMotion(variant,getTokens);jelly=getTokens('jelly');};
  const transform=(x,amount=0,direction=1)=>sliderJellyTransform(x,preference.matches?0:amount,direction,jelly);
  const settleAnimation=(frames,duration)=>{
    animation?.cancel();
    animation=handle.animate(frames,{duration,easing:'linear',fill:'both'});
    const running=animation;
    running.finished.catch(()=>{}).then(()=>{if(animation===running){animation=null;try{running.cancel();}catch{}}});
  };
  const draw = (x,amount=0,direction=1) => {
    current = x;
    handle.style.transform = transform(x,amount,direction);
  };
  const complete=(travel=gesture?.travel??current)=>{
    rail.dispatchEvent(new CustomEvent('mala-nauka:continue-sound',{bubbles:true}));
    const from=handle.style.transform||transform(current),duration=Math.max(120,Math.min(settings.fillDuration,settings.springDuration));
    completed=true;gesture=null;rail.classList.remove('is-dragging');rail.classList.add('is-complete');rail.style.setProperty('--drag-progress',1);rail.setAttribute('aria-valuenow','100');
    current=travel;handle.style.transform=transform(travel);
    if(!preference.matches&&typeof handle.animate==='function')settleAnimation([
      {transform:from,easing:'cubic-bezier(.18,.76,.22,1)'},
      {transform:transform(travel,.95,1),offset:.48,easing:'cubic-bezier(.14,.82,.18,1)'},
      {transform:transform(travel,.34,-1),offset:.78,easing:'cubic-bezier(.16,.72,.18,1)'},
      {transform:transform(travel)}
    ],duration);
    completionTimer=setTimeout(()=>{if(rail.isConnected&&canContinue())onComplete();},completionDelay??settings.completionDelay);
  };
  const reset = (animate = true) => {
    refresh();
    gesture = null;
    animation?.cancel();animation = null;
    rail.classList.remove('is-dragging','is-complete');
    rail.style.setProperty('--drag-progress',0);
    rail.setAttribute('aria-valuenow','0');
    const from = handle.style.transform||transform(current),distance=current;
    draw(0);
    if (animate && distance>0 && !preference.matches && typeof handle.animate==='function') {
      const overshoot=settings.springOvershoot,bounce=Math.max(.5,overshoot*(jelly.bounce??.75)*.28);
      settleAnimation([
        {transform:from,easing:'cubic-bezier(.20,.72,.22,1)'},
        {transform:transform(distance*.28,.88,-1),offset:.34,easing:'cubic-bezier(.16,.80,.18,1)'},
        {transform:transform(-overshoot,.58,-1),offset:.67,easing:'cubic-bezier(.16,.76,.18,1)'},
        {transform:transform(bounce,.24,1),offset:.86,easing:'cubic-bezier(.12,.70,.16,1)'},
        {transform:transform(0)}
      ],settings.springDuration);
    }
  };
  const down = event => {
    if(completed||!canContinue()||event.button!==0||!event.isPrimary||!event.target.closest('.continue-handle'))return;
    event.preventDefault();refresh();animation?.cancel();animation=null;draw(0,.16,1);
    const travel=rail.clientWidth-handle.offsetWidth-2*handle.offsetLeft;
    gesture={id:event.pointerId,start:event.clientX,travel,fraction:0,distance:0,lastX:0,lastTime:performance.now(),direction:1};
    handle.setPointerCapture(event.pointerId);rail.classList.add('is-dragging');rail.focus({preventScroll:true});
  };
  const move = event => {
    if(!gesture||gesture.id!==event.pointerId)return;
    if(!canContinue()){reset();return;}
    gesture.distance=event.clientX-gesture.start;
    gesture.fraction=dragFraction(gesture.start,event.clientX,gesture.travel);
    const x=gesture.fraction*gesture.travel,now=performance.now(),delta=x-gesture.lastX,elapsed=Math.max(1,now-gesture.lastTime);
    gesture.direction=Math.sign(delta)||gesture.direction;
    const speed=Math.min(1,Math.abs(delta)/elapsed*Math.max(1,jelly.inertia??1)),between=Math.sin(Math.PI*gesture.fraction);
    draw(x,Math.min(1,between*.68+speed*.34),gesture.direction);
    gesture.lastX=x;gesture.lastTime=now;
    rail.style.setProperty('--drag-progress',gesture.fraction);
    rail.setAttribute('aria-valuenow',String(Math.round(gesture.fraction*100)));
  };
  const up = event => {
    if(!gesture||gesture.id!==event.pointerId)return;
    move(event);
    const commit=gesture&&canContinue()&&completedDrag(gesture.fraction,gesture.distance,getTokens('slider').threshold??96);
    if(commit)complete(gesture.travel);
    else reset();
  };
  const cancel = () => {if(gesture)reset();};
  const key = event => {
    // Keyboard arrows operate the slider; Enter/Space never act as a button.
    if(!['ArrowRight','ArrowLeft','Home'].includes(event.key)||!canContinue()||completed)return;
    event.preventDefault();
    refresh();
    const travel=rail.clientWidth-handle.offsetWidth-2*handle.offsetLeft;
    const x=event.key==='Home'?0:Math.max(0,Math.min(travel,current+(event.key==='ArrowRight'?1:-1)*travel/10));
    const direction=Math.sign(x-current)||1,from=handle.style.transform||transform(current);draw(x);rail.style.setProperty('--drag-progress',travel?x/travel:0);rail.setAttribute('aria-valuenow',String(Math.round(x/travel*100)));
    if(x>=travel-1)complete(travel);
    else if(!preference.matches&&typeof handle.animate==='function')settleAnimation([{transform:from},{transform:transform(x,.54,direction),offset:.64},{transform:transform(x)}],Math.min(220,settings.springDuration));
  };
  rail.addEventListener('pointerdown',down);
  rail.addEventListener('pointermove',move);
  rail.addEventListener('pointerup',up);
  rail.addEventListener('pointercancel',cancel);
  rail.addEventListener('lostpointercapture',cancel);
  rail.addEventListener('keydown',key);
  return {setProgress:fraction=>{clearTimeout(completionTimer);completed=false;reset(false);const travel=rail.clientWidth-handle.offsetWidth-2*handle.offsetLeft;if(fraction>=1)complete(travel);else{draw(Math.max(0,Math.min(1,fraction))*travel);rail.style.setProperty('--drag-progress',fraction);rail.setAttribute('aria-valuenow',String(Math.round(fraction*100)));}},reset:()=>{clearTimeout(completionTimer);completed=false;rail.style.removeProperty('--drag-progress');reset(false);},destroy:()=>{
    clearTimeout(completionTimer);animation?.cancel();
    rail.removeEventListener('pointerdown',down);rail.removeEventListener('pointermove',move);
    rail.removeEventListener('pointerup',up);rail.removeEventListener('pointercancel',cancel);
    rail.removeEventListener('lostpointercapture',cancel);rail.removeEventListener('keydown',key);
  }};
}
