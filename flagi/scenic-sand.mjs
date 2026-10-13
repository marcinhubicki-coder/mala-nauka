import {SCENIC,randomFrom} from './scenic-config.mjs';
const mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>t*t*(3-2*t);

// Sample each glyph's actual silhouette: fifteen grains per nonspace letter.
// One tiny scratch canvas is reused; the only animated surface is the main one.
function glyphs(answers,origin,rand) {
  const scratch=document.createElement('canvas');scratch.width=64;scratch.height=64;
  const ctx=scratch.getContext('2d',{willReadFrequently:true});
  return [...answers.querySelectorAll('.scenic-answer')].map(button=>{
    const letters=[...button.querySelectorAll('.sand-letter')].filter(s=>s.textContent.trim());
    const points=[];
    for(const span of letters){
      const r=span.getBoundingClientRect(),style=getComputedStyle(span);
      ctx.clearRect(0,0,64,64);ctx.font=`${style.fontWeight} 40px ${style.fontFamily}`;
      ctx.fillStyle='#000';ctx.textBaseline='top';ctx.fillText(span.textContent,0,0);
      const pixels=ctx.getImageData(0,0,64,64).data,ink=[];
      for(let y=0;y<52;y+=2)for(let x=0;x<50;x+=2)if(pixels[(y*64+x)*4+3]>120)ink.push({x,y});
      const maxX=Math.max(1,...ink.map(p=>p.x)),maxY=Math.max(1,...ink.map(p=>p.y));
      for(let i=0;i<SCENIC.grainsPerLetter;i++){
        const p=ink[Math.floor(rand()*ink.length)]||{x:10,y:20};
        points.push({x:r.left-origin.left+(p.x/maxX)*r.width,y:r.top-origin.top+(p.y/maxY)*r.height*.87});
      }
    }
    const r=button.querySelector('.scenic-answer-label').getBoundingClientRect();
    return {points,center:r.left-origin.left+r.width/2,baseline:r.bottom-origin.top-2,width:r.width};
  });
}

export function createSand(canvas,app,answers) {
  const ctx=canvas.getContext('2d',{alpha:true});
  const clear=()=>{ctx.clearRect(0,0,canvas.width,canvas.height);delete app.dataset.sandPhase;delete app.dataset.sandProgress;delete canvas.dataset.grains;answers.classList.remove('is-sanding','is-growing');answers.style.removeProperty('--ink-opacity');};
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
        const dx=(rand()-.5)*Math.min(64,group.width*.65),pileX=group.center+dx;
        grains.push({start,end,fromOld:i<group.points.length,toNew:i<target.points.length,
          pile:{x:pileX,y:group.baseline-(1-Math.abs(dx)/40)*(2+rand()*4)},
          size:1.2+rand()*1.1,delay:rand()*.075,spread:(rand()-.5)*17,
          color:['#473b32','#5a4738','#6b503c'][Math.floor(rand()*3)]});
      }
    });
    canvas.dataset.grains=String(grains.length);
    try{await timeline.tween(SCENIC.sandMs,t=>{
      ctx.clearRect(0,0,origin.width,origin.height);
      app.dataset.sandProgress=t.toFixed(3);
      app.dataset.sandPhase=t<SCENIC.sandFall?'falling':t<SCENIC.sandSettle?'settled':'forming';
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
      }
      ctx.globalAlpha=1;
    });}finally{clear();}
  }
  return {transition,clear};
}
