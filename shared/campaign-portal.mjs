// A finite 300-particle canvas, sampled from the actual transparent traveller.
// There are no per-particle DOM nodes, filters or permanent rendering loops.
const samples=new Map(),veils=new WeakMap(),active=new WeakMap();
async function sampleTraveller(image){
 const key=image.currentSrc||image.src;if(samples.has(key))return samples.get(key);
 const promise=(async()=>{await image.decode();let source=image;
  if(new URL(key,location.href).origin!==location.origin){source=new Image();source.crossOrigin='anonymous';source.src=key;await source.decode();}
  const canvas=document.createElement('canvas');canvas.width=canvas.height=96;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(source,0,0,96,96);
  const data=ctx.getImageData(0,0,96,96).data,pixels=[];
  for(let y=0;y<96;y++)for(let x=0;x<96;x++){const i=(y*96+x)*4;if(data[i+3]>160)pixels.push({x:x/96,y:y/96,color:`rgb(${data[i]},${data[i+1]},${data[i+2]})`});}
  if(!pixels.length)throw Error('Brak widocznych pikseli postaci.');return Array.from({length:300},()=>({...pixels[Math.floor(Math.random()*pixels.length)]}));
 })();samples.set(key,promise);promise.catch(()=>samples.delete(key));return promise;
}
function bezier(a,b,c,d,t){const u=1-t;return u*u*u*a+3*u*u*t*b+3*u*t*t*c+t*t*t*d;}
function clearVeil(root){const row=veils.get(root);if(!row)return;row.observer.disconnect();row.node.remove();veils.delete(root);}
export function clearWorldPortal(root){active.get(root)?.(false);clearVeil(root);const screen=root.querySelector('.campaign-screen');if(screen){delete screen.dataset.travelling;delete screen.dataset.worldPortal;const image=screen.querySelector('.campaign-token img');if(image)image.style.opacity='';}}
async function coverWorld(root){
 clearVeil(root);const screen=root.querySelector('.campaign-screen'),rect=screen.getBoundingClientRect(),node=document.createElement('div');node.className='campaign-world-veil';node.setAttribute('aria-hidden','true');
 Object.assign(node.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});
 node.innerHTML='<i class="campaign-galaxy-orbit"></i><span>Nowy świat czeka…</span>';document.body.append(node);
 const observer=new MutationObserver(()=>{if(root.dataset.view!=='campaign')clearWorldPortal(root);});observer.observe(root,{attributes:true,attributeFilter:['data-view']});veils.set(root,{node,observer});
 if(!matchMedia('(prefers-reduced-motion:reduce)').matches)await node.animate([{opacity:0},{opacity:1}],{duration:450,easing:'ease-in-out',fill:'forwards'}).finished.catch(()=>{});
 return node;
}
async function travellerParticles(root,{arriving=false}={}){
 const screen=root.querySelector('.campaign-screen'),map=screen?.querySelector('.campaign-map'),token=map?.querySelector('.campaign-token'),image=token?.querySelector('img');if(!image)return false;
 active.get(root)?.(false);const run=screen.mnCampaignRun;screen.dataset.travelling='true';screen.dataset.worldPortal=arriving?'assembling':'scattering';map.dataset.teleport=arriving?'arriving':'departing';
 if(matchMedia('(prefers-reduced-motion:reduce)').matches){image.style.opacity=arriving?'1':'0';delete screen.dataset.travelling;return true;}
 let points;try{points=await sampleTraveller(image);}catch(error){delete screen.dataset.travelling;delete screen.dataset.worldPortal;image.style.opacity='1';throw error;}if(!screen.isConnected)return false;
 const rect=screen.getBoundingClientRect(),portrait=image.getBoundingClientRect(),portal=map.querySelector('.campaign-portal').getBoundingClientRect(),w=rect.width,h=rect.height;
 const canvas=document.createElement('canvas');canvas.className='campaign-world-particles';canvas.setAttribute('aria-hidden','true');canvas.dataset.mnDecoration='true';const dpr=Math.min(1.5,devicePixelRatio||1);canvas.width=Math.ceil(w*dpr);canvas.height=Math.ceil(h*dpr);const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);screen.append(canvas);
 const mirrored=token.dataset.facing==='left',destination={x:portal.left+portal.width/2-rect.left,y:portal.top+portal.height*.42-rect.top};
 const particles=points.map((point,i)=>{const home={x:portrait.left-rect.left+(mirrored?1-point.x:point.x)*portrait.width,y:portrait.top-rect.top+point.y*portrait.height},side=i%2?-30:w+30;
  const start=arriving?{x:side,y:h*(.16+Math.random()*.72)}:home,end=arriving?home:destination;
  return {...point,start,end,c1:{x:arriving?w*(.1+Math.random()*.8):home.x+(Math.random()-.5)*w*1.2,y:arriving?h*Math.random():home.y-(.1+Math.random()*.4)*h},c2:{x:arriving?home.x+(Math.random()-.5)*w*.7:destination.x+(Math.random()-.5)*w*.85,y:arriving?home.y+(Math.random()-.5)*h*.45:destination.y+h*(.1+Math.random()*.4)},delay:Math.random()*.13,size:.8+Math.random()*1.1,phase:Math.random()*Math.PI*2};
 });
 Object.assign(screen.dataset,{portalParticles:'300',portalColors:String(new Set(points.map(p=>p.color)).size),portalFrames:'0'});
 let frame=0,dead=false,elapsed=0,last=0,paintAt=0,finish;const duration=arriving?2500:2300;
 const finished=new Promise(resolve=>finish=resolve),observer=new MutationObserver(()=>{if(!screen.isConnected)stop(false);});observer.observe(root,{childList:true,subtree:true});
 function stop(success){if(dead)return;dead=true;if(active.get(root)===stop)active.delete(root);cancelAnimationFrame(frame);observer.disconnect();canvas.remove();if(screen.isConnected){image.style.opacity=success&&!arriving?'0':'1';if(!success)delete screen.dataset.travelling;screen.dataset.worldPortal=success?(arriving?'complete':'departed'):'cancelled';}finish(success);}
 const tick=now=>{
  if(dead)return;if(!screen.isConnected||screen.mnCampaignRun!==run){stop(false);return;}if(!last)last=now;const delta=Math.min(60,now-last);last=now;
  if(!document.hidden)elapsed+=delta;else {frame=requestAnimationFrame(tick);return;}
  const progress=Math.min(1,elapsed/duration);image.style.opacity=String(arriving?Math.max(0,(progress-.78)/.22):Math.max(0,1-progress/.17));
  if(now-paintAt>=32||progress===1){paintAt=now;ctx.clearRect(0,0,w,h);
   if(!arriving){const glow=Math.sin(progress*Math.PI)*.65,r=20+progress*45;ctx.save();ctx.translate(destination.x,destination.y);ctx.scale(1,.58);const halo=ctx.createRadialGradient(0,0,3,0,0,r);halo.addColorStop(0,'#fff7db');halo.addColorStop(.4,'#dbb5ff');halo.addColorStop(1,'#a6dfff00');ctx.globalAlpha=glow;ctx.fillStyle=halo;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=glow*.8;ctx.strokeStyle='#fff4de';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,r*.55,0,Math.PI*2);ctx.stroke();ctx.restore();}
   ctx.globalCompositeOperation='lighter';
   for(const p of particles){const t=Math.max(0,Math.min(1,(progress-p.delay)/(1-p.delay))),ease=t*t*(3-2*t),jitter=Math.sin(t*Math.PI)*Math.sin(t*10+p.phase)*8;
    const x=bezier(p.start.x,p.c1.x,p.c2.x,p.end.x,ease)+jitter,y=bezier(p.start.y,p.c1.y,p.c2.y,p.end.y,ease)+Math.cos(p.phase+t*12)*Math.sin(t*Math.PI)*9;
    const alpha=arriving?Math.min(1,t*6)*Math.min(1,(1-progress)*7):Math.min(1,progress*9)*Math.min(1,(1-t)*8);
    ctx.fillStyle=p.color;ctx.globalAlpha=alpha*.2;ctx.beginPath();ctx.arc(x,y,p.size*3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=alpha;ctx.beginPath();ctx.arc(x,y,p.size,0,Math.PI*2);ctx.fill();
   }ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';screen.dataset.portalFrames=String(Number(screen.dataset.portalFrames)+1);
  }
  if(progress<1)frame=requestAnimationFrame(tick);else stop(true);
 };active.set(root,stop);frame=requestAnimationFrame(tick);return finished;
}
export async function departCampaignWorld(root){
 const screen=root.querySelector('.campaign-screen');if(!screen||['scattering','departed'].includes(screen.dataset.worldPortal))return false;
 try{const success=await travellerParticles(root);if(!success||!screen.isConnected)return false;await coverWorld(root);return true;}catch(error){clearWorldPortal(root);if(screen.isConnected){delete screen.dataset.travelling;delete screen.dataset.worldPortal;screen.querySelector('.campaign-token img').style.opacity='1';}throw error;}
}
export async function arriveCampaignWorld(root,controller){
 const screen=root.querySelector('.campaign-screen'),image=screen?.querySelector('.campaign-token img');if(!image){clearWorldPortal(root);return;}
 image.style.opacity='0';const row=veils.get(root);if(row){await row.node.animate([{opacity:1},{opacity:0}],{duration:500,fill:'forwards',easing:'ease-out'}).finished.catch(()=>{});clearWorldPortal(root);}
 if(!screen.isConnected)return;try{await travellerParticles(root,{arriving:true});}finally{if(screen.isConnected){image.style.opacity='1';void controller?.play();delete screen.dataset.travelling;}}
}
