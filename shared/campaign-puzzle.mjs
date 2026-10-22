import {discoverySettings,puzzleCells,puzzleShape,puzzleReveal,puzzleChain,puzzleActivityBudget,puzzleNeighborhood,CAMPAIGN_LIVE_PIECE_LIMIT} from './campaign-discovery.mjs';
import {createCampaignLight} from './campaign-light.mjs';
const controllers=new WeakMap(),generations=new WeakMap();

// Viewport optics use local layout coordinates, never animated client rectangles.
// The photographed map, fog, chain canvases and illumination have separate owners.
export async function mountCampaignPuzzle(root,{index,route,realm,config,fromIndex=index,grid=false}={}){
 const map=root.querySelector('.campaign-map'),screen=map?.closest('.campaign-screen'),image=map?.querySelector(':scope > img'),canvas=map?.querySelector('.campaign-puzzle');if(!canvas||!image)return null;
 const generation=(generations.get(map)||0)+1;generations.set(map,generation);controllers.get(map)?.destroy();await Promise.all([image,screen.querySelector('.campaign-backdrop')].filter(Boolean).map(i=>i.decode().catch(()=>{})));if(!canvas.isConnected||generations.get(map)!==generation)return null;
 const settings=discoverySettings(config),ctx=canvas.getContext('2d'),reduced=matchMedia('(prefers-reduced-motion:reduce)'),source=document.createElement('canvas'),soft=document.createElement('canvas'),mip=document.createElement('canvas');
 const host=document.createElement('div');host.className='campaign-optics';host.dataset.mnDecoration='true';host.setAttribute('aria-hidden','true');map.append(host);host.append(canvas);
 const motion=document.createElement('div');motion.className='campaign-puzzle-motion';host.append(motion);
 let width=720,height=1,cells=[],initial=[],target=[],first=[],budget={chains:0,cellsPerChain:0,fraction:0},frame=0,resizeFrame=0,timer=0,dead=false,visible=true,ready=false,progress=fromIndex===index?1:0,resolve,finished;
 let counter=0,dimensions='';const groups=new Map(),reserved=new Map(),slots=Array.from({length:12},()=>({active:false,due:0,seed:null}));
 const light=createCampaignLight(host,{settings,cells:()=>cells,getReveal:i=>(initial[i]||0)+((target[i]||0)-(initial[i]||0))*progress,paused:()=>dead||!visible||document.hidden||reduced.matches||['scattering','assembling'].includes(screen.dataset.worldPortal)});
 function promise(){resolve?.();finished=new Promise(r=>resolve=r);}promise();
 function trace(context,cell,offsetX=0,offsetY=0){context.beginPath();cell.points.forEach(([x,y],i)=>i?context.lineTo(x*width-offsetX,y*height-offsetY):context.moveTo(x*width-offsetX,y*height-offsetY));context.closePath();}
 function cover(context,img,w,h){const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight);context.drawImage(img,(w-img.naturalWidth*scale)/2,(h-img.naturalHeight*scale)/2,img.naturalWidth*scale,img.naturalHeight*scale);}
 function quiet(){return dead||!visible||document.hidden||reduced.matches||progress<1||screen.hasAttribute('data-travelling')||!settings.enabled;}
 function stats(){return {...budget,active:groups.size,pieces:motion.querySelectorAll('.campaign-live-piece').length};}
 function publish(){Object.assign(map.dataset,{ambientLimit:String(budget.chains),ambientActive:String(groups.size),ambientRemaining:String(Math.round(budget.fraction*100)),ambientState:quiet()?'paused':groups.size?'transforming':'scheduled'});}
 function clearMotion(){for(const group of groups.values()){for(const a of group.animations)a.cancel();group.node.remove();}groups.clear();reserved.clear();for(const slot of slots)slot.active=false;publish();}
 function targets(){initial=cells.map(c=>puzzleReveal({x:c.mapX,y:c.mapY},fromIndex,route,settings));target=cells.map(c=>puzzleReveal({x:c.mapX,y:c.mapY},index,route,settings));first=cells.map(c=>puzzleReveal({x:c.mapX,y:c.mapY},0,route,settings));budget=puzzleActivityBudget(cells,target,first,settings);publish();}
 function prepare(){
  clearMotion();const sw=screen.clientWidth,sh=screen.clientHeight,mw=map.offsetWidth,mh=map.offsetHeight,mx=map.offsetLeft-mw*.5,my=map.offsetTop-mh*.51;
  height=Math.round(width*sh/sw);canvas.width=source.width=soft.width=width;canvas.height=source.height=soft.height=height;
  Object.assign(host.style,{left:-mx+'px',top:-my+'px',width:sw+'px',height:sh+'px'});
  const sc=source.getContext('2d');sc.clearRect(0,0,width,height);const backdrop=screen.querySelector('.campaign-backdrop');if(backdrop)cover(sc,backdrop,width,height);sc.drawImage(image,mx/sw*width,my/sh*height,mw/sw*width,mh/sh*height);
  const bc=soft.getContext('2d');bc.clearRect(0,0,width,height);if(settings.fogEnabled){mip.width=Math.max(1,Math.round(width/7));mip.height=Math.max(1,Math.round(height/7));mip.getContext('2d').drawImage(source,0,0,mip.width,mip.height);bc.imageSmoothingEnabled=true;bc.drawImage(mip,0,0,width,height);}else bc.drawImage(source,0,0);
  cells=puzzleCells(puzzleShape(realm,settings),settings.density).map(c=>({...c,mapX:(c.x*sw-mx)/mw,mapY:(c.y*sh-my)/mh}));targets();light.resize(sw,sh);paint(reduced.matches?1:progress);
 }
 // Painting a temporary glimpse uses the same geography, transform and fog as
 // permanent discovery. Only small prepainted fragment layers are cross-faded;
 // the base fog and saved reveal targets never change during ambient motion.
 function paintCell(context,c,reveal,temporary=false){
  const amount=(1-reveal)*(settings.puzzleEnabled?settings.intensity:0),fog=(1-reveal)*(settings.fogEnabled?settings.fog:0);if(amount<.01&&fog<.01)return false;
  context.save();trace(context,c);context.clip();context.globalAlpha=temporary?1-reveal:Math.min(1,amount*5);context.translate(c.x*width,c.y*height);context.rotate(c.angle*amount);context.scale(1.6,1.6);context.translate(-c.x*width,-c.y*height);context.drawImage(soft,0,0);context.restore();context.save();trace(context,c);context.fillStyle=`rgba(197,213,236,${fog})`;context.fill();context.strokeStyle=`rgba(231,239,250,${amount*.18})`;context.lineWidth=.8;context.stroke();context.restore();return true;
 }
 function paint(t){progress=t;const start=performance.now();ctx.clearRect(0,0,width,height);let hidden=0;
  for(let i=0;i<cells.length;i++)if(paintCell(ctx,cells[i],initial[i]+(target[i]-initial[i])*t))hidden++;
  if(grid){ctx.save();ctx.strokeStyle='#5a318da6';ctx.lineWidth=1.2;for(const c of cells){trace(ctx,c);ctx.stroke();}ctx.restore();}
  Object.assign(map.dataset,{paintMs:(performance.now()-start).toFixed(1),puzzleCells:String(cells.length),puzzlePaints:String(Number(map.dataset.puzzlePaints||0)+1),puzzleHidden:String(hidden),revealIndex:String(index)});
 }
 function startChain(slot,slotIndex){
  const seed=slot.seed||{x:.05+Math.random()*.9,y:.18+Math.random()*.65};slot.seed=null;const blocked=new Set([...groups.values()].flatMap(g=>puzzleNeighborhood(cells,g.core,2).map(n=>n.index))),reveal=target.map((r,i)=>blocked.has(i)?1:r);let chain=puzzleChain(cells,reveal,seed,budget.cellsPerChain),ripples=[];const quota=Math.floor(CAMPAIGN_LIVE_PIECE_LIMIT/Math.max(1,budget.chains));while(chain.length){ripples=puzzleNeighborhood(cells,chain,2).filter(n=>target[n.index]<.5&&!reserved.has(n.index));if(ripples.length<=quota)break;chain.pop();}if(!chain.length){slot.due=performance.now()+250;return;}
  const id=++counter,node=document.createElement('div');node.className='campaign-live-chain';node.dataset.chain=String(id);motion.append(node);const group={id,node,core:chain,animations:[]};groups.set(id,group);slot.active=true;const duration=settings.ambientDuration*(.8+Math.random()*.4),strength=settings.ambientStrength;
  for(const {index:i,ring,order}of ripples){
   reserved.set(i,id);const c=cells[i],xs=c.points.map(p=>p[0]*width),ys=c.points.map(p=>p[1]*height),x=Math.floor(Math.min(...xs)),y=Math.floor(Math.min(...ys)),w=Math.ceil(Math.max(...xs))-x,h=Math.ceil(Math.max(...ys))-y,patch=document.createElement('div');patch.className='campaign-live-piece';patch.dataset.cell=String(i);patch.dataset.reveal=target[i];patch.dataset.chain=String(id);patch.dataset.ring=ring;patch.dataset.order=order;const revealStrength=settings.ambientReveal+(Math.min(settings.ambientReveal,settings.ambientEdgeReveal)-settings.ambientReveal)*ring/2,attenuation=settings.ambientReveal?revealStrength/settings.ambientReveal:0;
   const peek=target[i]+(1-target[i])*revealStrength;patch.dataset.peek=peek;
   Object.assign(patch.style,{left:x/width*100+'%',top:y/height*100+'%',width:w/width*100+'%',height:h/height*100+'%'});
   const layer=className=>{const n=document.createElement('canvas');n.width=w;n.height=h;n.className=className;patch.append(n);return n.getContext('2d');};
   const glow=pc=>{if(!settings.glowEnabled)return;const power=settings.glowIntensity*attenuation,g=pc.createLinearGradient(0,0,w,h);g.addColorStop(0,`rgba(255,245,186,${Math.min(.8,power*.16)})`);g.addColorStop(.5,`rgba(155,234,255,${Math.min(.6,power*.08)})`);g.addColorStop(1,`rgba(235,176,255,${Math.min(.8,power*.16)})`);pc.globalCompositeOperation='screen';pc.fillStyle=g;pc.fillRect(0,0,w,h);trace(pc,c,x,y);pc.strokeStyle=`rgba(255,253,225,${Math.min(1,power)})`;pc.lineWidth=1.5+power;pc.stroke();pc.globalCompositeOperation='source-over';};
   // The permanent fog already supplies the closed state. One local glimpse
   // texture per shard avoids a duplicate moving copy and halves compositor surfaces.
   const glimpse=layer('campaign-piece-glimpse');glimpse.save();trace(glimpse,c,x,y);glimpse.clip();glimpse.drawImage(source,x,y,w,h,0,0,w,h);glimpse.translate(-x,-y);paintCell(glimpse,c,peek,true);glimpse.translate(x,y);glow(glimpse);glimpse.restore();
   const delay=order*190+ring*130+Math.random()*30,sign=(i+slotIndex)%2?1:-1,power=strength*attenuation,tilt=Math.min(42,power*25),turn=power*12,shift=power*9;const before=cells[chain[Math.max(0,order-1)]],after=cells[chain[Math.min(chain.length-1,order+1)]],angle=Math.atan2((after.y-before.y)*height,(after.x-before.x)*width),sx=Math.cos(angle)*shift,sy=Math.sin(angle)*shift;

   node.append(patch);
   group.animations.push(patch.animate([{opacity:0,transform:'perspective(200px) translate(0,0) rotateY(0deg) rotate(0deg)'},{opacity:1,offset:.27,transform:`perspective(200px) translate(${sx}px,${sy-shift*.35}px) rotateY(${sign*tilt}deg) rotate(${sign*turn}deg) scale(${1+power*.04})`},{opacity:.7,offset:.6,transform:`perspective(200px) translate(${-sx*.18}px,${-sy*.18}px) rotateY(${-sign*tilt*.15}deg) rotate(${-sign*turn*.15}deg)`},{opacity:0,transform:'perspective(200px) translate(0,0) rotateY(0deg) rotate(0deg)'}],{duration,delay,easing:'cubic-bezier(.25,.65,.25,1)',fill:'both'}));
  }
  map.dataset.ambientRuns=String(Number(map.dataset.ambientRuns||0)+1);publish();
  Promise.all(group.animations.map(a=>a.finished.catch(()=>{}))).then(()=>{node.remove();if(groups.get(id)!==group)return;groups.delete(id);for(const {index:i}of ripples)if(reserved.get(i)===id)reserved.delete(i);slot.active=false;slot.due=performance.now()+settings.ambientInterval*(.35+Math.random()*.95);publish();});
 }
 function schedule(initialise=false){clearTimeout(timer);if(initialise){const now=performance.now();slots.forEach((slot,i)=>{if(!slot.active)slot.due=now+100+Math.random()*settings.ambientStagger+i*25;});}if(quiet()||!budget.chains){publish();return;}
  const now=performance.now(),available=slots.slice(0,budget.chains).filter(slot=>!slot.active&&slot.due<=now).sort((a,b)=>a.due-b.due);if(groups.size<budget.chains&&available.length)startChain(available[0],slots.indexOf(available[0]));timer=setTimeout(()=>schedule(),90+Math.random()*90);
 }
 function ripple(seed){if(quiet())return;const now=performance.now();slots.slice(0,budget.chains).forEach((slot,i)=>{if(!slot.active){slot.due=now+(i?Math.random()*settings.ambientStagger:0);if(!i&&seed)slot.seed=seed;}});schedule();}
 function visibility(){if(reduced.matches){clearMotion();paint(1);}const paused=quiet();for(const group of groups.values())for(const a of group.animations)paused?a.pause():a.play();if(paused)clearTimeout(timer);else schedule();publish();}
 const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;visibility();});intersection.observe(screen);
 const observer=new MutationObserver(records=>{if(!canvas.isConnected)destroy();else if(records.some(r=>r.type==='attributes'))visibility();});observer.observe(root,{childList:true,subtree:true,attributes:true,attributeFilter:['data-travelling','data-world-portal']});
 const resize=new ResizeObserver(()=>{const next=[screen.clientWidth,screen.clientHeight,map.offsetWidth,map.offsetHeight,map.offsetLeft,map.offsetTop].join();if(next===dimensions)return;dimensions=next;cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(!dead){prepare();schedule();}});});resize.observe(screen);resize.observe(map);
 function destroy(){if(dead)return;dead=true;cancelAnimationFrame(frame);cancelAnimationFrame(resizeFrame);clearTimeout(timer);clearMotion();light.destroy();host.before(canvas);host.remove();resize.disconnect();intersection.disconnect();observer.disconnect();document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',visibility);resolve?.();controllers.delete(map);}
 function setProgress(nextIndex,nextFrom=nextIndex){if(nextIndex===index&&(nextFrom===fromIndex||progress===1&&nextFrom===index)){fromIndex=nextFrom;return;}cancelAnimationFrame(frame);clearTimeout(timer);clearMotion();index=nextIndex;fromIndex=nextFrom;progress=nextFrom===nextIndex?1:0;ready=false;promise();targets();paint(reduced.matches?1:progress);schedule(true);}
 function play(){if(dead||ready)return finished;ready=true;if(reduced.matches||fromIndex===index){paint(1);resolve();schedule(true);return finished;}
  let elapsed=0,last=0,paintAt=0;map.dataset.discovery='animating';clearMotion();clearTimeout(timer);const tick=now=>{if(dead||!canvas.isConnected)return;const delta=last?Math.min(60,now-last):0;last=now;if(!document.hidden)elapsed+=delta;const t=Math.min(1,elapsed/settings.duration);if(now-paintAt>32||t===1){paint(1-(1-t)**3);paintAt=now;}if(t<1)frame=requestAnimationFrame(tick);else{map.dataset.discovery='complete';resolve();schedule(true);}};frame=requestAnimationFrame(tick);return finished;
 }
 document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',visibility);prepare();delete map.dataset.discoveryPending;
 const controller={play,get finished(){return finished;},destroy,ripple,setProgress,stats,reframe:()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(!dead)prepare();});}};controllers.set(map,controller);return controller;
}
