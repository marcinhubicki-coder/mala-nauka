// One-off particle word transitions; no per-frame canvas or DOM updates.
const W=288,H=70,MAX_DOTS=64;
export const DEFAULT_WORD_TRANSITION={style:'ink',dots:40,interactive:true};
function ensureCss(){
 if(document.querySelector('link[data-mn-word-particles]'))return;
 const link=document.createElement('link');link.rel='stylesheet';
 link.dataset.mnWordParticles='1';
 link.href=new URL('./word-particles.css',import.meta.url).href;document.head.append(link);
}
export function sampleWordPoints(label,dots=40,fontFamily='system-ui'){
 const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return [];
 const text=String(label||'').replaceAll('_','·').slice(0,22);
 if(!text.trim())return [];
 let size=46;
 ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff';
 const setFont=()=>{ctx.font='800 '+size+'px '+fontFamily;};
 setFont();
 while(size>19&&ctx.measureText(text).width>W-18){size-=2;setFont();}
 ctx.fillText(text,W/2,H/2+3);
 const pixels=ctx.getImageData(0,0,W,H).data,all=[];
 for(let y=4;y<H-3;y+=3)for(let x=4;x<W-3;x+=3){
  if(pixels[(y*W+x)*4+3]>112)all.push([x/W,y/H]);
 }
 const count=Math.min(MAX_DOTS,Math.max(12,Math.trunc(dots)||40),all.length);
 if(!count)return [];
 return Array.from({length:count},(_,i)=>all[Math.floor((i+.5)*all.length/count)]);
}
function wordText(node){
 const before=node?.querySelector('.word-before')?.textContent||'';
 const after=node?.querySelector('.word-after')?.textContent||'';
 return before+'·'+after;
}
export function createWordParticles(host,getEffects=()=>null){
 ensureCss();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const webkit=/AppleWebKit/i.test(navigator.userAgent)&&!/Chrome|Chromium|CriOS|Edg/i.test(navigator.userAgent);
 const oldPosition=host.style.position;
 if(getComputedStyle(host).position==='static')host.style.position='relative';
 let destroyed=false,current=null,animations=[],token=0,lastTouch=0;
 const clear=()=>{
  token++;
  for(const a of animations){try{a.cancel()}catch{}}
  animations=[];current?.remove();current=null;
 };
 const enabled=()=>{
  const settings={...DEFAULT_WORD_TRANSITION,...(getEffects()?.wordTransition||{})};
  return settings.style==='particles'&&!reduced.matches&&!document.hidden?settings:null;
 };
 const play=(direction='in',pointer)=>{
  const settings=enabled(),word=host.querySelector('.word');
  if(!settings||!word||destroyed)return Promise.resolve(false);
  clear();
  const own=token,box=word.getBoundingClientRect(),parent=host.getBoundingClientRect();
  if(box.width<10||box.height<10||parent.width<10)return Promise.resolve(false);
  const dots=sampleWordPoints(wordText(word),webkit?Math.min(32,settings.dots):settings.dots,getComputedStyle(word).fontFamily);
  if(!dots.length)return Promise.resolve(false);
  const layer=document.createElement('div');layer.className='mn-word-particles';layer.setAttribute('aria-hidden','true');
  layer.style.left=(box.left-parent.left)+'px';layer.style.top=(box.top-parent.top)+'px';
  layer.style.width=box.width+'px';layer.style.height=box.height+'px';
  current=layer;
  const entering=direction==='in',spread=direction==='repel'?18:14;
  const px=pointer?(pointer.clientX-box.left)/Math.max(1,box.width):.5;
  const py=pointer?(pointer.clientY-box.top)/Math.max(1,box.height):.5;
  const frag=document.createDocumentFragment(),frames=[];
  for(let i=0;i<dots.length;i++){
   const [x,y]=dots[i],dot=document.createElement('i');
   dot.style.left=x*100+'%';dot.style.top=y*100+'%';
   dot.style.background=['#fff0c4','#84cff8','#b8a2ff','#ffb5e0'][i%4];
   frag.append(dot);
   const angle=i*2.39996;
   let dx=Math.cos(angle)*(spread+(i%7)*2),dy=Math.sin(angle)*(spread+(i%5)*2);
   if(direction==='repel'){
    const vx=x-px,vy=y-py,dist=Math.hypot(vx,vy),power=Math.max(0,1-dist/.75);
    dx=power*38*vx/Math.max(.08,dist);
    dy=power*38*vy/Math.max(.08,dist);
   }
   const move='translate3d('+dx+'px,'+dy+'px,0) scale(.52)';
   frames.push({dot,
    from:{opacity:entering?0:.9,transform:entering?move:'translate3d(0,0,0) scale(1)'},
    to:{opacity:entering?.85:0,transform:entering?'translate3d(0,0,0) scale(1)':move}});
  }
  layer.append(frag);host.append(layer);
  const real=frames.map(({dot,from,to})=>dot.animate([from,to],{
   duration:direction==='repel'?220:entering?170:135,
   easing:'cubic-bezier(.16,.72,.25,1)',fill:'both',
  }));
  animations=real;
  return Promise.all(real.map(a=>a.finished.catch(()=>{}))).then(()=>{
   if(!destroyed&&token===own)clear();
   return true;
  });
 };
 const touch=e=>{
  if(!enabled()?.interactive||e.pointerType==='mouse'&&e.button!==0)return;
  if(performance.now()-lastTouch<260)return;
  lastTouch=performance.now();void play('repel',e);
 };
 host.addEventListener('pointerdown',touch,{passive:true});
 return {play,clear,destroy(){
  destroyed=true;clear();host.removeEventListener('pointerdown',touch);
  host.style.position=oldPosition;
 }};
}
