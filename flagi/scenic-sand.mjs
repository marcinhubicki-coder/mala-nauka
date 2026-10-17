import {SCENIC,randomFrom} from './scenic-config.mjs?v=30';
const mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>t*t*(3-2*t);

// Sample each glyph's actual silhouette: fifteen grains per nonspace letter.
// One tiny scratch canvas is reused; the only animated surface is the main one.
function glyphs(answers,origin,rand) {
  const scratch=document.createElement('canvas');scratch.width=64;scratch.height=64;
  const ctx=scratch.getContext('2d',{willReadFrequently:true});
  return [...answers.querySelectorAll('.scenic-answer')].map(button=>{
    const letters=[...button.querySelectorAll('.sand-letter')].filter(s=>s.textContent.trim());
    const points=[],lines=[];
    for(const span of letters){const r=span.getBoundingClientRect();let line=lines.find(l=>Math.abs(l.top-r.top)<2);if(!line){line={top:r.top,left:r.left,right:r.right,bottom:r.bottom};lines.push(line);}line.left=Math.min(line.left,r.left);line.right=Math.max(line.right,r.right);line.bottom=Math.max(line.bottom,r.bottom);}
    for(const span of letters){
      const r=span.getBoundingClientRect(),style=getComputedStyle(span);
      ctx.clearRect(0,0,64,64);ctx.font=`${style.fontWeight} 40px ${style.fontFamily}`;
      ctx.fillStyle='#000';ctx.textBaseline='top';ctx.fillText(span.textContent,0,0);
      const pixels=ctx.getImageData(0,0,64,64).data,ink=[];
      for(let y=0;y<52;y+=2)for(let x=0;x<50;x+=2)if(pixels[(y*64+x)*4+3]>120)ink.push({x,y});
      const maxX=Math.max(1,...ink.map(p=>p.x)),maxY=Math.max(1,...ink.map(p=>p.y));
      for(let i=0;i<SCENIC.grainsPerLetter;i++){
        const p=ink[Math.floor(rand()*ink.length)]||{x:10,y:20};
        const line=lines.find(l=>Math.abs(l.top-r.top)<2);
        points.push({x:r.left-origin.left+(p.x/maxX)*r.width,y:r.top-origin.top+(p.y/maxY)*r.height*.87,baseline:line.bottom-origin.top-2,lineCenter:(line.left+line.right)/2-origin.left,lineWidth:line.right-line.left});
      }
    }
    const r=button.querySelector('.scenic-answer-label').getBoundingClientRect();
    return {points,center:r.left-origin.left+r.width/2,baseline:r.bottom-origin.top-2,width:r.width};
  });
}

export function createSand(canvas,app,answers) {
  const ctx=canvas.getContext('2d',{alpha:true});
  const clear=()=>{canvas.width=canvas.height=1;delete app.dataset.sandPhase;delete app.dataset.sandProgress;delete app.dataset.qaCaptured;delete canvas.dataset.grains;answers.classList.remove('is-sanding','is-growing');answers.style.removeProperty('--ink-opacity');};
  async function transition({timeline,reduced,seed,replace}) {
    clear();if(reduced){replace();return;}
    const dpr=Math.min(devicePixelRatio||1,SCENIC.maxDpr),origin=canvas.getBoundingClientRect(),rand=randomFrom(seed);
    canvas.width=Math.round(origin.width*dpr);canvas.height=Math.round(origin.height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
    const old=glyphs(answers,origin,rand);
    answers.classList.add('is-sanding');replace();
    const next=glyphs(answers,origin,rand),grains=[];
    old.forEach((group,row)=>{
      const target=next[row],count=Math.max(group.points.length,target.points.length);
      for(let i=0;i<count;i++){
        const start=group.points[i%group.points.length],end=target.points[i%target.points.length];
        const dx=(rand()-.5)*Math.min(64,start.lineWidth*.65),pileX=start.lineCenter+dx;
        grains.push({start,end,fromOld:i<group.points.length,toNew:i<target.points.length,
          pile:{x:pileX,y:start.baseline-(1-Math.abs(dx)/40)*(2+rand()*4)},
          size:1.2+rand()*1.1,delay:rand()*.075,spread:(rand()-.5)*17,
          color:['#473b32','#5a4738','#6b503c'][Math.floor(rand()*3)]});
      }
    });
    canvas.dataset.grains=String(grains.length);
    if(app.dataset.qa==='true'){canvas.dataset.upward=String(grains.filter(g=>g.toNew&&g.end.y<g.pile.y).length);canvas.dataset.downward=String(grains.filter(g=>g.toNew&&g.end.y>g.pile.y).length);}
    try{await timeline.tween(SCENIC.sandMs,t=>{
      ctx.clearRect(0,0,origin.width,origin.height);
      if(app.dataset.qa==='true')app.dataset.sandProgress=t.toFixed(3);
      const phase=t<SCENIC.sandFall?'falling':t<SCENIC.sandSettle?'settled':'forming';
      if(app.dataset.sandPhase!==phase)app.dataset.sandPhase=phase;
      // Solid letters take over only after the grains reach their new silhouettes.
      answers.style.setProperty('--ink-opacity',String(Math.max(0,(t-.91)/.09)));
      for(const g of grains){
        let x,y,alpha=g.fromOld?1:0;
        if(t<SCENIC.sandFall){
          const q=Math.max(0,Math.min(1,(t-g.delay)/(SCENIC.sandFall-g.delay)));
          x=mix(g.start.x,g.pile.x,q)+g.spread*Math.sin(q*Math.PI);
          y=mix(g.start.y,g.pile.y,q*q);
          if(q>.82)y-=Math.sin((q-.82)/.18*Math.PI)*3;
        }else if(t<SCENIC.sandSettle){x=g.pile.x;y=g.pile.y;alpha=1;}
        else{
          const q=ease(Math.min(1,(t-SCENIC.sandSettle)/(.92-SCENIC.sandSettle)));
          x=mix(g.pile.x,g.end.x,q);y=mix(g.pile.y,g.end.y,q);
          alpha=g.toNew?1:1-q;alpha*=Math.min(1,(1-t)/.07);
        }
        if(alpha<=0)continue;ctx.globalAlpha=alpha;ctx.fillStyle=g.color;ctx.fillRect(x,y,g.size,g.size);
        // A tiny warm upper edge and shaded lower edge pick up the scene light.
        if(g.size>1.65){ctx.globalAlpha=alpha*.46;ctx.fillStyle='#b58a58';ctx.fillRect(x,y,g.size,.55);ctx.globalAlpha=alpha*.36;ctx.fillStyle='#1d2420';ctx.fillRect(x,y+g.size-.5,g.size,.5);}
      }
      ctx.globalAlpha=1;
      // Capture target is armed before resuming: no screenshot/IPC timing race.
      if(app.dataset.qa==='true'&&app.dataset.qaCaptureAt!==undefined){
        const target=Number(app.dataset.qaCaptureAt);
        if(t>=target){delete app.dataset.qaCaptureAt;app.dataset.qaCaptured=String(target);timeline.setPaused(true);}
      }
    },app.dataset.qa==='true'?{stopAt:()=>app.dataset.qaCaptureAt===undefined?undefined:Number(app.dataset.qaCaptureAt)}:{});}finally{clear();}
  }
  return {transition,clear};
}
