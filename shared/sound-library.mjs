// Mała Nauka · independent, original procedural audio. No copyrighted samples.
export const SOUND_CUES=[
 ['tap','Delikatne kliknięcie','Dotknięcie kafla'],['toggle','Jelly','Zmiana ustawienia'],
 ['correct','Dobra odpowiedź','Spokojna dwudźwiękowa zachęta'],['incorrect','Spróbuj jeszcze','Neutralny, łagodny sygnał'],
 ['hint','Podpowiedź','Subtelna wskazówka'],['next','Dalej','Przesunięcie do następnego zadania'],
 ['star','Gwiazdka','Mały sukces'],['trophy','Trofeum','Większe osiągnięcie'],
 ['roundStart','Początek rundy','Gotowość do nauki'],['roundEnd','Koniec rundy','Spokojne zakończenie'],
 ['progress','Postęp','Mały krok naprzód'],['bubble','Bańka','Miękkie pęknięcie']
];
export const SOUND_LAYERS=[
 ['rain','Deszcz','Spokojny deszcz na szybie'],['stream','Strumień','Płynąca woda'],
 ['wind','Wiatr','Łagodny powiew'],['leaves','Liście','Miękki szelest'],
 ['birds','Ptaki','Rzadkie śpiewy'],['waves','Fale','Oddech morza'],
 ['crickets','Świerszcze','Cichy wieczór'],['warmNoise','Ciepły szum','Jednolita otulina'],
 ['chimes','Dzwonki','Rzadkie, delikatne tony'],['pad','Miękki ambient','Łagodne akordy']
];
export const SOUND_PRESETS={
 focus:{label:'Skupienie',mix:[18,0,0,0,0,0,0,24,0,10]},
 forest:{label:'Spokojny las',mix:[0,14,16,18,16,0,0,9,0,0]},
 rain:{label:'Deszcz za oknem',mix:[35,0,10,0,0,0,0,16,0,0]},
 sea:{label:'Nad morzem',mix:[0,0,14,0,0,39,0,10,0,0]},
 night:{label:'Wieczorny ogród',mix:[0,0,14,12,0,0,20,12,0,6]},
 dream:{label:'Miękki kosmos',mix:[0,0,0,0,0,0,0,15,16,28]},
 silence:{label:'Cisza',mix:[0,0,0,0,0,0,0,0,0,0]}
};
export const DEFAULT_SOUND_SETTINGS={
 enabled:false,volume:35,cueVolume:55,ambientVolume:35,ambientEnabled:false,
 quietMode:true,ambientPreset:'focus',mix:[...SOUND_PRESETS.focus.mix]
};
const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
export function normalizeSoundSettings(input={}){
 const s={...DEFAULT_SOUND_SETTINGS,...(input&&typeof input==='object'?input:{})};
 for(const k of ['volume','cueVolume','ambientVolume'])s[k]=Math.round(clamp(s[k],0,100));
 for(const k of ['enabled','ambientEnabled','quietMode'])s[k]=s[k]===true;
 if(!Object.hasOwn(SOUND_PRESETS,s.ambientPreset)&&s.ambientPreset!=='custom')s.ambientPreset='focus';
 s.mix=Array.from({length:10},(_,i)=>Math.round(clamp(s.mix?.[i],0,100)));
 return s;
}
export function validateSoundSettings(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Niepoprawne ustawienia dźwięków.');
 const keys=Object.keys(DEFAULT_SOUND_SETTINGS);if(Object.keys(input).some(k=>!keys.includes(k)))throw Error('Nieznany parametr dźwięku.');
 for(const k of ['enabled','ambientEnabled','quietMode'])if(typeof input[k]!=='boolean')throw Error('Niepoprawny przełącznik dźwięku.');
 for(const k of ['volume','cueVolume','ambientVolume'])if(!Number.isInteger(input[k])||input[k]<0||input[k]>100)throw Error('Niepoprawna głośność.');
 if(!Object.hasOwn(SOUND_PRESETS,input.ambientPreset)&&input.ambientPreset!=='custom')throw Error('Nieznany preset dźwięku.');
 if(!Array.isArray(input.mix)||input.mix.length!==10||input.mix.some(v=>!Number.isInteger(v)||v<0||v>100))throw Error('Mikser wymaga 10 suwaków (0–100).');
 return input;
}
function random(seed){let x=seed>>>0;return ()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296;};}
const TAU=Math.PI*2;
const CUE_NOTES={
 tap:[[660,0,.075,.22]],toggle:[[523,0,.095,.21],[659,.065,.10,.16]],
 correct:[[523,0,.20,.20],[784,.16,.31,.19]],incorrect:[[440,0,.20,.15],[392,.18,.24,.12]],
 hint:[[587,0,.18,.16],[698,.24,.20,.12]],next:[[587,0,.13,.13],[740,.11,.16,.11]],
 star:[[659,0,.18,.16],[880,.14,.25,.16],[1047,.32,.30,.10]],
 trophy:[[523,0,.22,.13],[659,.16,.26,.14],[784,.36,.29,.14],[1047,.54,.42,.13]],
 roundStart:[[392,0,.22,.16],[523,.20,.23,.16]],roundEnd:[[784,0,.25,.11],[587,.19,.30,.12],[523,.40,.37,.12]],
 progress:[[659,0,.20,.14]],bubble:[[620,0,.15,.13],[820,.07,.15,.08]]
};
export function generateCue(id,rate=16000){
 const notes=CUE_NOTES[id]||CUE_NOTES.tap;
 const length=Math.min(1.5,Math.max(...notes.map(n=>n[1]+n[2]))+.12);
 const out=new Float32Array(Math.ceil(length*rate));const rng=random(711);
 for(let i=0;i<out.length;i++){
  const t=i/rate;let v=0;
  for(const [freq,start,duration,level] of notes){
   const x=t-start;if(x<0||x>duration)continue;
   const fade=Math.min(1,x/.018,Math.pow(Math.max(0,1-x/duration),1.5));
   // Soft mallet timbre with short overtone and no harsh transient.
   v+=level*fade*(Math.sin(TAU*freq*x)+.15*Math.sin(TAU*freq*2*x)*Math.exp(-x*15));
  }
  if(id==='bubble'){const x=t/.18;v+=.065*(1-x)*Math.sin(TAU*(900*t-1000*t*t))*(x>=0&&x<1?1:0);}
  if(id==='tap')v+=((rng()-.5)*.026)*Math.exp(-t*75);
  out[i]=clamp(v,-.65,.65);
 }
 return out;
}
export function generateLayer(id,seconds=6,rate=16000){
 const n=Math.round(seconds*rate),out=new Float32Array(n),rng=random(73+SOUND_LAYERS.findIndex(x=>x[0]===id)*23);
 let lp=0,fast=0;const tone=(f,t)=>Math.sin(TAU*f*t), smooth=(v,t,a)=>v*(.5+.5*Math.sin(TAU*t/a));
 for(let i=0;i<n;i++){
  const t=i/rate,phase=t/seconds,noise=rng()*2-1;
  lp=lp*.986+noise*.014;fast=fast*.72+noise*.28;
  let v=0;
  switch(id){
   case 'rain':v=fast*.45+lp*.35;break;
   case 'stream':v=fast*.24+lp*.56+.07*tone(112,t);break;
   case 'wind':v=lp*1.85*(.65+.35*Math.sin(TAU*phase));break;
   case 'leaves':v=(fast*.25+lp*.65)*(.5+.5*Math.sin(TAU*phase*3));break;
   case 'birds':{const beat=(t%2);v=beat<.27?.12*tone(690+125*Math.sin(TAU*beat*5),t)*Math.sin(Math.PI*beat/.27)**2:0;break;}
   case 'waves':v=(fast*.18+lp*.8)*(.35+.65*Math.sin(Math.PI*t/seconds)**2);break;
   case 'crickets':v=.065*tone(2500,t)*(Math.sin(TAU*t*5)>0?1:0)*(.5+.5*Math.sin(TAU*phase));break;
   case 'warmNoise':v=lp*1.3+fast*.12;break;
   case 'chimes':{const p=t%3;v=p<1.7?.07*Math.exp(-p*3)*(tone(659,t)+.35*tone(988,t)):0;break;}
   case 'pad':v=.095*(tone(261.63,t)+tone(329.63,t)+tone(392,t))*(.75+.25*Math.sin(TAU*phase));break;
   default:v=0;
  }
  // Wrap every 6-second source without sharp clicks.
  const seam=Math.min(1,t/.2,(seconds-t)/.2);
  out[i]=clamp(v*seam,-.65,.65);
 }
 return out;
}
export function mixAmbience(mix,seconds=6,rate=16000){
 const out=new Float32Array(Math.round(seconds*rate));
 SOUND_LAYERS.forEach(([id],i)=>{
  const amount=Math.pow(clamp(mix?.[i],0,100)/100,1.5)*.3;
  if(amount<.0001)return;
  const layer=generateLayer(id,seconds,rate);
  for(let j=0;j<out.length;j++)out[j]+=layer[j]*amount;
 });
 // bounded mixture, intended for quiet background listening
 for(let i=0;i<out.length;i++)out[i]=Math.tanh(out[i]*.8);
 return out;
}
export function wavBlob(samples,rate=16000){
 const buffer=new ArrayBuffer(44+samples.length*2),view=new DataView(buffer);
 const str=(offset,text)=>{for(let i=0;i<text.length;i++)view.setUint8(offset+i,text.charCodeAt(i));};
 str(0,'RIFF');view.setUint32(4,36+samples.length*2,true);str(8,'WAVE');str(12,'fmt ');view.setUint32(16,16,true);
 view.setUint16(20,1,true);view.setUint16(22,1,true);view.setUint32(24,rate,true);view.setUint32(28,rate*2,true);
 view.setUint16(32,2,true);view.setUint16(34,16,true);str(36,'data');view.setUint32(40,samples.length*2,true);
 for(let i=0;i<samples.length;i++)view.setInt16(44+i*2,Math.round(clamp(samples[i],-1,1)*32767),true);
 return new Blob([buffer],{type:'audio/wav'});
}
// Simple uncompressed ZIP, for offline archiving. No external dependencies.
export function zipBlob(items){
 const encoder=new TextEncoder(),blocks=[],entries=[];let offset=0;
 const table=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0;}
 const crc32=data=>{let c=0xffffffff;for(const b of data)c=table[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;};
 const header=(len)=>{const b=new Uint8Array(len);return {b,d:new DataView(b.buffer)};};
 for(const [name,data] of items){
  const nameBytes=encoder.encode(name),payload=data instanceof Uint8Array?data:new Uint8Array(data),crc=crc32(payload);
  const h=header(30+nameBytes.length);h.d.setUint32(0,0x04034b50,true);h.d.setUint16(4,20,true);h.d.setUint32(14,crc,true);h.d.setUint32(18,payload.length,true);h.d.setUint32(22,payload.length,true);h.d.setUint16(26,nameBytes.length,true);h.b.set(nameBytes,30);
  blocks.push(h.b,payload);entries.push({nameBytes,payload,crc,offset});offset+=h.b.length+payload.length;
 }
 const centralStart=offset;
 for(const e of entries){
  const h=header(46+e.nameBytes.length);h.d.setUint32(0,0x02014b50,true);h.d.setUint16(4,20,true);h.d.setUint16(6,20,true);h.d.setUint32(16,e.crc,true);h.d.setUint32(20,e.payload.length,true);h.d.setUint32(24,e.payload.length,true);h.d.setUint16(28,e.nameBytes.length,true);h.d.setUint32(42,e.offset,true);h.b.set(e.nameBytes,46);
  blocks.push(h.b);offset+=h.b.length;
 }
 const end=header(22);end.d.setUint32(0,0x06054b50,true);end.d.setUint16(8,entries.length,true);end.d.setUint16(10,entries.length,true);end.d.setUint32(12,offset-centralStart,true);end.d.setUint32(16,centralStart,true);blocks.push(end.b);
 return new Blob(blocks,{type:'application/zip'});
}
export class SoundPreviewEngine{
 constructor(){this.ctx=null;this.channels=[];this.master=null;this.playing=false;}
 async ready(){
  if(!this.ctx){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw Error('Przeglądarka nie obsługuje Web Audio.');
   this.ctx=new Context();this.master=this.ctx.createGain();this.master.gain.value=.5;this.master.connect(this.ctx.destination);
  }
  if(this.ctx.state==='suspended')await this.ctx.resume();
  return this.ctx;
 }
 async cue(id,settings){
  const ctx=await this.ready(),src=ctx.createBufferSource(),wave=generateCue(id,ctx.sampleRate);
  const buffer=ctx.createBuffer(1,wave.length,ctx.sampleRate);buffer.copyToChannel(wave,0);src.buffer=buffer;
  const gain=ctx.createGain(),s=normalizeSoundSettings(settings);
  gain.gain.value=(s.volume/100)*(s.cueVolume/100)*(.8);
  src.connect(gain).connect(this.master);src.start();src.onended=()=>{src.disconnect();gain.disconnect();};
 }
 async start(settings){
  await this.ready();this.stop();const ctx=this.ctx,s=normalizeSoundSettings(settings);
  for(let i=0;i<SOUND_LAYERS.length;i++){
   const data=generateLayer(SOUND_LAYERS[i][0],6,ctx.sampleRate),buf=ctx.createBuffer(1,data.length,ctx.sampleRate);buf.copyToChannel(data,0);
   const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buf;source.loop=true;
   source.connect(gain).connect(this.master);source.start();this.channels.push({source,gain});
  }
  this.playing=true;this.adjust(s);
 }
 adjust(settings){
  if(!this.playing||!this.ctx)return;const s=normalizeSoundSettings(settings);
  this.channels.forEach(({gain},i)=>{const level=Math.pow(s.mix[i]/100,1.5)*(s.ambientVolume/100)*(s.volume/100)*.4;gain.gain.setTargetAtTime(level,this.ctx.currentTime,.07);});
 }
 stop(){
  for(const {source,gain}of this.channels){try{source.stop();source.disconnect();gain.disconnect();}catch{}}
  this.channels=[];this.playing=false;
 }
 async close(){this.stop();if(this.ctx){await this.ctx.close();this.ctx=null;this.master=null;}}
}
