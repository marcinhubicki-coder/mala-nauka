// One finite timeline shared by the boot screen and Studio. No external player.
export const DEFAULT_LOGO_TRANSITION={enabled:true,turns:2,turnDuration:2000,orbitRadius:70,shapeSize:32,morph:.8,splashDuration:1000,overlap:.1,randomness:.55,whiteDuration:1400,whiteWobble:.09,revealAt:.52,revealDuration:1000,seed:17,colors:['#0490fb','#fc237a','#ffbd1e','#57bf45','#fe7b06']};
export const LOGO_FIELDS={turns:[1,4,1,'Obroty'],turnDuration:[600,4000,50,'Czas jednego obrotu (ms)'],orbitRadius:[30,130,1,'Promień orbity (px)'],shapeSize:[12,64,1,'Wielkość kształtu (px)'],morph:[0,1,.05,'Zmiana koło / kwadrat / romb'],splashDuration:[400,2200,50,'Wypełnienie kolorami (ms)'],overlap:[.05,.25,.01,'Nachodzenie sektorów'],randomness:[0,1,.05,'Nieregularność kolorowych blobów'],whiteDuration:[600,2600,50,'Wzrost białego bloba (ms)'],whiteWobble:[0,.2,.01,'Falowanie białego bloba'],revealAt:[.5,.85,.01,'Odsłanianie od części powierzchni'],revealDuration:[400,2200,50,'Wejście ekranu (ms)'],seed:[1,9999,1,'Ziarno układu']};
export function logoConfig(value={}){return {...DEFAULT_LOGO_TRANSITION,...value,colors:value.colors||DEFAULT_LOGO_TRANSITION.colors};}
export function validateLogoTransition(value){const c=logoConfig(value);if(typeof c.enabled!=='boolean'||!Array.isArray(c.colors)||c.colors.length!==5||c.colors.some(color=>!/^#[0-9a-f]{6}$/i.test(color)))throw Error('Sprawdź pięć kolorów animacji logo.');for(const [key,[min,max]]of Object.entries(LOGO_FIELDS))if(!Number.isFinite(c[key])||c[key]<min||c[key]>max)throw Error('Nieprawidłowy parametr animacji logo: '+key);if(!Number.isInteger(c.turns)||!Number.isInteger(c.seed))throw Error('Obroty i ziarno muszą być całkowite.');return c;}
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);},mix=(a,b,t)=>a+(b-a)*t;
const TAU=Math.PI*2,N=60;
function random(seed){return ()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
function smoothPath(points){const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2],start=mid(points.at(-1),points[0]);let d=`M${start.map(x=>x.toFixed(2)).join(',')}`;for(let i=0;i<points.length;i++){const m=mid(points[i],points[(i+1)%points.length]);d+=`Q${points[i].map(x=>x.toFixed(2)).join(',')} ${m.map(x=>x.toFixed(2)).join(',')}`;}return d+'Z';}
function blob(cx,cy,r,time,wobble,phase=0){return Array.from({length:N},(_,i)=>{const a=i/N*TAU,k=1+wobble*(Math.sin(a*3+time+phase)*.6+Math.sin(a*5-time*.7+phase)*.4);return [cx+Math.cos(a)*r*k,cy+Math.sin(a)*r*k];});}
const areaRadiusCache=new Map();
export function logoTiming(value,width=390,height=844){
 const c=logoConfig(value),orbit=c.turns*c.turnDuration,white=orbit+c.splashDuration,far=Math.hypot(width/2,height/2);let low=0,high=far;const key=[width,height,c.revealAt].join(':');
 if(areaRadiusCache.has(key))high=areaRadiusCache.get(key);else{
 // Find the radius covering the requested screen area, including clipped edges.
 for(let step=0;step<14;step++){const r=(low+high)/2;let inside=0;for(let y=0;y<24;y++)for(let x=0;x<24;x++)if(Math.hypot((x+.5)/24*width-width/2,(y+.5)/24*height-height/2)<r)inside++;if(inside/576<c.revealAt)low=r;else high=r;}
 if(areaRadiusCache.size>32)areaRadiusCache.clear();areaRadiusCache.set(key,high);}
 const reveal=white+c.whiteDuration*high/(far*1.35);return {orbit,white,reveal,total:Math.max(white+c.whiteDuration,reveal+c.revealDuration)};
}
// Geometry remains bounded by the viewport. Each wedge exceeds 72° and its
// radius exceeds the farthest corner even at the deepest wave trough.
export function logoFrame(value,width,height,ms){
 const c=logoConfig(value),t=logoTiming(c,width,height),cx=width/2,cy=height/2,far=Math.hypot(cx,cy),unit=Math.min(width,height)/390,orbitAngle=Math.min(ms/t.orbit,1)*TAU*c.turns,splash=ease((ms-t.orbit)/c.splashDuration),rnd=random(c.seed),baseRadius=c.orbitRadius*unit*(1+.12*Math.sin(ms/c.turnDuration*TAU)),size=c.shapeSize*unit;
 const shapes=c.colors.map((color,i)=>{const a=-Math.PI/2+i*TAU/5,position=a+orbitAngle,x=cx+Math.cos(position)*baseRadius,y=cy+Math.sin(position)*baseRadius,phase=rnd()*TAU,sector=TAU/5*(1+c.overlap),begin=a-sector/2,end=a+sector/2;
  const points=Array.from({length:N},(_,j)=>{const angle=j/N*TAU,shapeCycle=(ms/c.turnDuration*3)%3,roundedSquare=1/Math.pow(Math.pow(Math.abs(Math.cos(angle)),4)+Math.pow(Math.abs(Math.sin(angle)),4),.25),m=c.morph*Math.pow(Math.sin(Math.PI*shapeCycle/3),2),r=size/2*mix(1,roundedSquare,m),spin=ms/c.turnDuration*Math.PI;
   const small=[x+Math.cos(angle+spin)*r,y+Math.sin(angle+spin)*r];let target;
   if(j<16||j>43){const q=j<16?j/15:(59-j)/15,edge=j<16?begin:end,wiggle=Math.sin(q*9+phase+ms/900)*c.overlap*.65*c.randomness,b=edge+wiggle,reach=far*1.8*(q-.025);target=[cx+Math.cos(b)*reach,cy+Math.sin(b)*reach];}
   else{const b=mix(begin,end,(j-16)/27),wave=Math.sin(b*4+phase+ms/800)*.09*c.randomness,reach=far*1.8*(1+wave);target=[cx+Math.cos(b)*reach,cy+Math.sin(b)*reach];}
   return [mix(small[0],target[0],splash),mix(small[1],target[1],splash)];});return {color,d:smoothPath(points)};
 });
 const whiteProgress=clamp((ms-t.white)/c.whiteDuration),whiteRadius=far*1.35*whiteProgress,whiteD=smoothPath(blob(cx,cy,whiteRadius,ms/500,c.whiteWobble)),reveal=ease((ms-t.reveal)/c.revealDuration);
 return {shapes,whiteD,reveal,radius:far*1.35*reveal,covered:splash===1,stage:ms<t.orbit?'Obrót':ms<t.white?'Kolorowe bloby':ms<t.reveal?'Biały blob':ms<t.total?'Wejście ekranu':'Gotowe',time:Math.min(ms,t.total),total:t.total};
}
export class LogoTransition {
 constructor({overlay,app,config,onFrame=()=>{},onFinish=()=>{}}){this.overlay=overlay;this.app=app;this.config=logoConfig(config);this.onFrame=onFrame;this.onFinish=onFinish;this.time=0;this.running=false;this.animations=[];this.savedStyle=app.getAttribute('style');this.savedInert=app.inert;app.inert=true;overlay.innerHTML='<svg class="mn-logo-svg" aria-hidden="true" preserveAspectRatio="none">'+this.config.colors.map(color=>`<path fill="${color}"/>`).join('')+'<path fill="#fff"/></svg>';this.svg=overlay.firstElementChild;this.paths=[...this.svg.children];this.visibility=()=>{if(document.hidden&&this.running){this.resumeOnVisible=true;this.pause();}else if(!document.hidden&&this.resumeOnVisible){this.resumeOnVisible=false;this.play();}};document.addEventListener('visibilitychange',this.visibility);this.seek(0);}
 seek(ms){const r=this.overlay.getBoundingClientRect(),w=r.width||innerWidth,h=r.height||innerHeight;this.total=logoTiming(this.config,w,h).total;this.time=Math.max(0,Math.min(this.total,ms));const frame=logoFrame(this.config,w,h,this.time);this.svg.setAttribute('viewBox',`0 0 ${w} ${h}`);frame.shapes.forEach((s,i)=>this.paths[i].setAttribute('d',s.d));this.paths[5].setAttribute('d',frame.whiteD);this.overlay.style.backgroundColor=frame.covered?this.config.colors[0]:'#fff';Object.assign(this.app.style,{position:'relative',zIndex:'2001',opacity:frame.reveal>0?'1':'0',clipPath:`circle(${frame.radius}px at 50% 50%)`,pointerEvents:'none'});this.overlay.dataset.stage=frame.stage;this.onFrame(frame);return frame;}
 play(){if(this.running)return;this.running=true;this.start=performance.now()-this.time;let painted=-Infinity;const tick=now=>{if(!this.running)return;const ms=now-this.start;if(now-painted>=1000/30){this.seek(ms);painted=now;}if(ms>=this.total){this.seek(this.total);this.pause();this.onFinish();return;}this.raf=requestAnimationFrame(tick);};this.raf=requestAnimationFrame(tick);}
 pause(){this.running=false;cancelAnimationFrame(this.raf);}
 destroy(){this.pause();document.removeEventListener('visibilitychange',this.visibility);if(this.savedStyle===null)this.app.removeAttribute('style');else this.app.setAttribute('style',this.savedStyle);this.app.inert=this.savedInert;this.overlay.remove();}
}
