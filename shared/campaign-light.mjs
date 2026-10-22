// Independent viewport illumination. No photo or fog pixels are resampled per frame.
export function createCampaignLight(host,{settings,cells,getReveal,paused}){
 const canvas=document.createElement('canvas');canvas.className='campaign-light-field';canvas.setAttribute('aria-hidden','true');canvas.dataset.mnDecoration='true';host.append(canvas);
 const ctx=canvas.getContext('2d'),sprite=document.createElement('canvas');sprite.width=sprite.height=160;
 const sc=sprite.getContext('2d'),gradient=sc.createRadialGradient(80,80,0,80,80,80);gradient.addColorStop(0,'#fff8dbe8');gradient.addColorStop(.35,'#e6daff90');gradient.addColorStop(1,'#a4edff00');sc.fillStyle=gradient;sc.fillRect(0,0,160,160);
 let width=0,height=0,frame=0,last=0,time=0,painted=0,dead=false,pointer=null;
 function resize(w,h){width=560;height=Math.round(width*h/w);canvas.width=width;canvas.height=height;}
 function trace(cell){ctx.beginPath();cell.points.forEach(([x,y],i)=>i?ctx.lineTo(x*width,y*height):ctx.moveTo(x*width,y*height));ctx.closePath();}
 function tick(now){if(dead)return;frame=requestAnimationFrame(tick);if(!last)last=now;const delta=Math.min(50,now-last);last=now;if(paused()||!settings.globalGlowEnabled||!settings.globalGlowIntensity){if(painted){ctx.clearRect(0,0,width,height);painted=0;}return;}time+=delta*settings.globalGlowSpeed;if(now-(canvas.mnPaintAt||0)<40)return;canvas.mnPaintAt=now;ctx.clearRect(0,0,width,height);const t=time/1000,strength=settings.globalGlowIntensity,spots=Array.from({length:settings.globalGlowCount},(_,i)=>({x:.5+Math.sin(t*(.18+i*.013)+i*2.1)*.48,y:.5+Math.cos(t*(.14+i*.017)+i*1.7)*.48}));if(pointer)spots[0]=pointer;
  ctx.globalCompositeOperation='screen';for(const [i,p]of spots.entries()){const radius=width*(.2+Math.min(2,strength)*.08);ctx.globalAlpha=Math.min(.85,.16+strength*.16)*(.75+Math.sin(t*.8+i)*.25);ctx.drawImage(sprite,p.x*width-radius,p.y*height-radius,radius*2,radius*2);}
  // Shimmer the actual glass polygons beneath the independently travelling lights.
  const lit=cells().map((c,i)=>({c,i,d:Math.min(...spots.map(p=>Math.hypot(c.x-p.x,(c.y-p.y)*height/width)))})).filter(r=>r.d<.32).sort((a,b)=>a.d-b.d).slice(0,72);
  for(const {c,i,d}of lit){const pulse=(.5+.5*Math.sin(t*1.5+i*1.73))**3,hidden=1-getReveal(i),alpha=Math.min(.85,strength*(.32-d)*1.8)*pulse*(.25+hidden*.75);if(alpha<.015)continue;trace(c);ctx.globalAlpha=alpha;ctx.fillStyle=i%3?'#d0eeff':'#fff2b6';ctx.fill();ctx.globalAlpha=Math.min(1,alpha*2);ctx.strokeStyle='#fff8df';ctx.lineWidth=1.4;ctx.stroke();}
  ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';painted++;canvas.dataset.lightPaints=String(Number(canvas.dataset.lightPaints||0)+1);canvas.dataset.lightTime=String(Math.round(time));
 }
 function hover(e){if(e.pointerType!=='mouse')return;const rect=host.getBoundingClientRect();pointer={x:(e.clientX-rect.left)/rect.width,y:(e.clientY-rect.top)/rect.height};}
 const screen=host.closest('.campaign-screen');screen.addEventListener('pointermove',hover,{passive:true});const leave=()=>pointer=null;screen.addEventListener('pointerleave',leave);frame=requestAnimationFrame(tick);
 return {resize,destroy(){dead=true;cancelAnimationFrame(frame);screen.removeEventListener('pointermove',hover);screen.removeEventListener('pointerleave',leave);canvas.remove();}};
}
