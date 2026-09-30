const root=document.querySelector('#app');
const motionTimers=new WeakMap();
const motionAnimations=new WeakMap();

function selectedIndex(container){
  const labels=[...container.querySelectorAll(':scope > label')];
  return Math.max(0,labels.findIndex(label=>label.querySelector('input:checked')));
}

function visualEdges(container,indicator){
  const c=container.getBoundingClientRect();
  const r=indicator.getBoundingClientRect();
  return {left:r.left-c.left,right:r.right-c.left,width:r.width,center:(r.left+r.right)/2-c.left};
}

function genericTarget(container,index){
  const labels=[...container.querySelectorAll(':scope > label')];
  const label=labels[index];
  if(!label)return null;
  const c=container.getBoundingClientRect();
  const r=label.getBoundingClientRect();
  const inset=4;
  const left=r.left-c.left+inset;
  const right=r.right-c.left-inset;
  return {left,right,width:right-left,center:(left+right)/2};
}

function scopeTarget(container,index){
  const width=container.getBoundingClientRect().width;
  const inset=4;
  const half=(width-inset*2)/2;
  const left=inset+index*half;
  return {left,right:left+half,width:half,center:left+half/2};
}

function timing(current,target){
  const distance=Math.abs(target.center-current.center);
  const base=Math.min(1280,Math.max(860,Math.round(860+distance*.72)));
  return {total:Math.round(base*1.62),overshoot:Math.min(26,Math.max(9,Math.round(distance*.105)))};
}

function edgeFrames(current,target,forward,overshoot){
  const back=Math.max(3,overshoot*.28);
  const tiny=Math.max(1.5,overshoot*.08);
  const lerp=(a,b,t)=>a+(b-a)*t;
  if(forward){
    return [
      {offset:0,left:`${current.left}px`,right:`${current.right}px`,easing:'cubic-bezier(.30,.04,.22,1)'},
      {offset:.10,left:`${current.left}px`,right:`${lerp(current.right,target.right,.58)}px`,easing:'cubic-bezier(.18,.78,.22,1)'},
      {offset:.24,left:`${lerp(current.left,target.left,.24)}px`,right:`${lerp(current.right,target.right,.93)}px`,easing:'cubic-bezier(.16,.84,.20,1)'},
      {offset:.333,left:`${target.left+overshoot}px`,right:`${target.right}px`,easing:'cubic-bezier(.14,.80,.18,1)'},
      {offset:.70,left:`${target.left-back}px`,right:`${target.right}px`,easing:'cubic-bezier(.12,.74,.16,1)'},
      {offset:.88,left:`${target.left+tiny}px`,right:`${target.right}px`,easing:'cubic-bezier(.10,.64,.14,1)'},
      {offset:1,left:`${target.left}px`,right:`${target.right}px`}
    ];
  }
  return [
    {offset:0,left:`${current.left}px`,right:`${current.right}px`,easing:'cubic-bezier(.30,.04,.22,1)'},
    {offset:.10,left:`${lerp(current.left,target.left,.58)}px`,right:`${current.right}px`,easing:'cubic-bezier(.18,.78,.22,1)'},
    {offset:.24,left:`${lerp(current.left,target.left,.93)}px`,right:`${lerp(current.right,target.right,.24)}px`,easing:'cubic-bezier(.16,.84,.20,1)'},
    {offset:.333,left:`${target.left}px`,right:`${target.right-overshoot}px`,easing:'cubic-bezier(.14,.80,.18,1)'},
    {offset:.70,left:`${target.left}px`,right:`${target.right+back}px`,easing:'cubic-bezier(.12,.74,.16,1)'},
    {offset:.88,left:`${target.left}px`,right:`${target.right-tiny}px`,easing:'cubic-bezier(.10,.64,.14,1)'},
    {offset:1,left:`${target.left}px`,right:`${target.right}px`}
  ];
}

function scopeFrames(current,target,forward,overshoot){
  const toFrame=(left,right,offset,easing)=>({left:`${left}px`,width:`${Math.max(1,right-left)}px`,offset,easing});
  return edgeFrames(current,target,forward,overshoot).map(frame=>{
    const left=parseFloat(frame.left);
    const right=parseFloat(frame.right);
    return toFrame(left,right,frame.offset,frame.easing);
  });
}

function cancelExisting(container,indicator){
  indicator.getAnimations().forEach(animation=>{try{animation.cancel();}catch{}});
  const own=motionAnimations.get(container);
  if(own){try{own.cancel();}catch{} motionAnimations.delete(container);}
  const timer=motionTimers.get(container);
  if(timer)clearTimeout(timer);
}

function animateControl(container,{scope=false,animate=true}={}){
  if(!container)return;
  const indicator=container.querySelector('.flag-segment-indicator');
  if(!indicator)return;
  const index=selectedIndex(container);
  const target=scope?scopeTarget(container,index):genericTarget(container,index);
  if(!target)return;
  const current=visualEdges(container,indicator);
  const prior=Number(container.dataset.motionV3Index);
  const changed=Number.isFinite(prior)&&prior!==index;
  container.dataset.motionV3Index=String(index);
  cancelExisting(container,indicator);

  if(scope){
    indicator.style.right='auto';
    if(!animate||!changed){indicator.style.left=`${target.left}px`;indicator.style.width=`${target.width}px`;return;}
  }else if(!animate||!changed){
    indicator.style.left=`${target.left}px`;indicator.style.right=`${container.clientWidth-target.right}px`;return;
  }

  const t=timing(current,target);
  const forward=!Number.isFinite(prior)||index>prior;
  container.style.setProperty('--segment-total-ms',`${t.total}ms`);
  container.classList.add('is-segment-moving-v3');
  const frames=scope?scopeFrames(current,target,forward,t.overshoot):edgeFrames(current,target,forward,t.overshoot).map(f=>({...f,right:`${container.clientWidth-parseFloat(f.right)}px`}));
  const animation=indicator.animate(frames,{duration:t.total,easing:'linear',fill:'both'});
  motionAnimations.set(container,animation);
  if(scope){indicator.style.left=`${target.left}px`;indicator.style.width=`${target.width}px`;indicator.style.right='auto';}
  else{indicator.style.left=`${target.left}px`;indicator.style.right=`${container.clientWidth-target.right}px`;}
  const finish=()=>{
    if(motionAnimations.get(container)===animation){
      motionAnimations.delete(container);
      try{animation.cancel();}catch{}
      container.classList.remove('is-segment-moving-v3');
    }
  };
  animation.addEventListener('finish',finish,{once:true});
  motionTimers.set(container,setTimeout(finish,t.total+100));
}

function syncAll(animate=false){
  animateControl(root?.querySelector('[data-segmented="game"]'),{animate});
  animateControl(root?.querySelector('[data-segmented="time"]'),{animate});
  animateControl(root?.querySelector('[data-scope-slider]'),{scope:true,animate});
}

root?.addEventListener('change',event=>{
  const name=event.target?.name;
  if(!['flagGameType','flagScope','duration'].includes(name))return;
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(name==='flagScope')animateControl(root.querySelector('[data-scope-slider]'),{scope:true,animate:true});
    else if(name==='flagGameType')animateControl(root.querySelector('[data-segmented="game"]'),{animate:true});
    else animateControl(root.querySelector('[data-segmented="time"]'),{animate:true});
  }));
});

const observer=new MutationObserver(()=>requestAnimationFrame(()=>syncAll(false)));
if(root){observer.observe(root,{childList:true,subtree:true});requestAnimationFrame(()=>syncAll(false));}
window.addEventListener('resize',()=>requestAnimationFrame(()=>syncAll(false)),{passive:true});
window.addEventListener('orientationchange',()=>setTimeout(()=>syncAll(false),120),{passive:true});
