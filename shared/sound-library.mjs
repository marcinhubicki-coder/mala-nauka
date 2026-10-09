// Original, procedural learning sounds. The same renderer powers Lab, WAV and PWA.
export const SOUND_CUES=[
 ['tap','Kliknięcie','Miękki drewniany ton'],['toggle','Jelly','Wesołe odbicie'],
 ['correct','Dobra odpowiedź','Krótka, pogodna zachęta'],['incorrect','Spróbuj jeszcze','Ciepły sygnał bez alarmu'],
 ['hint','Podpowiedź','Małe odkrycie'],['next','Dalej','Lekki krok do przodu'],
 ['star','Gwiazdka / combo','Rosnąca radość'],['trophy','Trofeum','Mała fanfara'],
 ['roundStart','Początek rundy','Zaczynamy przygodę'],['roundEnd','Koniec rundy','Pogodne domknięcie'],
 ['progress','Postęp','Kolejny mały sukces'],['bubble','Bańka','Sprężyste, miękkie pęknięcie']
];
export const SOUND_LAYERS=[
 ['rain','Deszcz','Krople i miękkie tło'],['stream','Strumień','Pluski płynącej wody'],
 ['wind','Wiatr','Długie, łagodne podmuchy'],['leaves','Liście','Nieregularne szelesty'],
 ['birds','Ptaki','Różne krótkie nawoływania'],['waves','Fale','Przypływ i spokojny odpływ'],
 ['crickets','Świerszcze','Miękkie, odległe cykanie'],['warmNoise','Ciepła otulina','Niski, aksamitny szum'],
 ['chimes','Melodia zabawy','Pogodne drewniane dzwonki'],['pad','Ciepłe akordy','Miękki muzyczny oddech']
];
export const SOUND_PRESETS={
 adventure:{label:'Wesoła nauka',mix:[0,13,8,8,16,0,0,8,45,28]},
 focus:{label:'Skupienie',mix:[12,0,0,0,0,0,0,18,12,18]},
 forest:{label:'Leśna przygoda',mix:[0,32,18,27,42,0,0,6,21,12]},
 rain:{label:'Deszcz za oknem',mix:[46,0,16,0,6,0,0,18,14,20]},
 sea:{label:'Nad morzem',mix:[0,0,20,0,13,52,0,8,22,18]},
 night:{label:'Wieczorny ogród',mix:[0,0,12,14,0,0,26,10,16,24]},
 dream:{label:'Miękki kosmos',mix:[0,0,0,0,0,0,0,12,36,42]},
 silence:{label:'Cisza',mix:Array(10).fill(0)}
};
export const SOUND_FIELDS={volume:[0,100],cueVolume:[0,100],ambientVolume:[0,100],energy:[0,100],tempo:[60,120],variation:[0,100],warmth:[0,100],ducking:[0,100],logoVolume:[0,100]};
export const DEFAULT_SOUND_SETTINGS={enabled:true,volume:48,cueVolume:68,ambientVolume:45,ambientEnabled:true,quietMode:false,ambientPreset:'adventure',mix:[...SOUND_PRESETS.adventure.mix],energy:65,tempo:84,variation:70,warmth:65,ducking:60,logoEnabled:true,logoVolume:72};
const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
export function normalizeSoundSettings(input={}){
 const s={...DEFAULT_SOUND_SETTINGS,...(input&&typeof input==='object'&&!Array.isArray(input)?input:{})};
 for(const [key,[min,max]]of Object.entries(SOUND_FIELDS))s[key]=Math.round(clamp(s[key],min,max));
 for(const key of ['enabled','ambientEnabled','quietMode','logoEnabled'])s[key]=s[key]===true;
 if(!Object.hasOwn(SOUND_PRESETS,s.ambientPreset)&&s.ambientPreset!=='custom')s.ambientPreset='adventure';
 s.mix=Array.from({length:10},(_,i)=>Math.round(clamp(s.mix?.[i],0,100)));
 return Object.fromEntries(Object.keys(DEFAULT_SOUND_SETTINGS).map(key=>[key,s[key]]));
}
export function validateSoundSettings(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Niepoprawne ustawienia dźwięków.');
 if(Object.keys(input).some(key=>!Object.hasOwn(DEFAULT_SOUND_SETTINGS,key)))throw Error('Nieznany parametr dźwięku.');
 // The first Sound Lab sketches lack arrangement controls; retain their values.
 const s={...DEFAULT_SOUND_SETTINGS,...input};
 for(const key of ['enabled','ambientEnabled','quietMode','logoEnabled'])if(typeof s[key]!=='boolean')throw Error('Niepoprawny przełącznik dźwięku.');
 for(const [key,[min,max]]of Object.entries(SOUND_FIELDS))if(!Number.isInteger(s[key])||s[key]<min||s[key]>max)throw Error('Niepoprawny parametr dźwięku: '+key);
 if(!Object.hasOwn(SOUND_PRESETS,s.ambientPreset)&&s.ambientPreset!=='custom')throw Error('Nieznany preset dźwięku.');
 if(!Array.isArray(s.mix)||s.mix.length!==10||s.mix.some(v=>!Number.isInteger(v)||v<0||v>100))throw Error('Mikser wymaga 10 suwaków (0–100).');
 return input;
}
function random(seed){let x=seed>>>0;return ()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296;};}
const TAU=Math.PI*2;
const NOTES=[293.6648,329.6276,369.9944,440,493.8833,587.3295]; // D major pentatonic
const CUE_NOTES={
 tap:[[440,0,.09,.21]],toggle:[[440,0,.10,.21],[587.33,.06,.13,.18]],
 correct:[[587.33,0,.17,.23],[739.99,.10,.22,.21],[880,.23,.26,.18]],
 incorrect:[[440,0,.18,.16],[369.99,.14,.24,.13]],
 hint:[[493.88,0,.18,.17],[659.25,.15,.24,.17]],next:[[440,0,.10,.16],[587.33,.08,.16,.15]],
 star:[[587.33,0,.14,.2],[739.99,.10,.17,.2],[880,.22,.25,.18]],
 trophy:[[440,0,.23,.2],[587.33,.14,.24,.21],[739.99,.28,.26,.2],[880,.44,.40,.19]],
 roundStart:[[440,0,.16,.21],[493.88,.12,.16,.2],[587.33,.25,.27,.21]],
 roundEnd:[[739.99,0,.2,.17],[659.25,.15,.22,.16],[587.33,.3,.35,.19],[293.66,.3,.38,.13]],
 progress:[[587.33,0,.18,.18],[739.99,.10,.20,.12]],bubble:[[220,0,.16,.18],[587.33,.045,.18,.09]]
};
function mallet(freq,x,duration,energy=.65){
 if(x<0||x>=duration)return 0;
 const envelope=Math.min(1,x/.008)*Math.exp(-x*5/duration)*Math.min(1,(duration-x)/.04);
 return envelope*(Math.sin(TAU*freq*x)+(.07+.16*energy)*Math.sin(TAU*freq*2*x)*Math.exp(-x*18));
}
export function generateCue(id,rate=16000,settings={}){
 const s=normalizeSoundSettings(settings),notes=CUE_NOTES[id]||CUE_NOTES.tap,energy=s.quietMode ? .2 :s.energy/100;
 const out=new Float32Array(Math.ceil((Math.max(...notes.map(n=>n[1]+n[2]))+.08)*rate));
 for(let i=0;i<out.length;i++){
  const t=i/rate;let v=0;
  for(const [freq,start,duration,level]of notes)v+=level*mallet(freq,t-start,duration,energy);
  if(id==='bubble'||id==='toggle')v+=.13*Math.sin(TAU*(300*t-630*t*t))*Math.sin(Math.PI*Math.min(1,t/.14))**2*Math.exp(-t*18);
  out[i]=Math.tanh(v)*.9;
 }
 return out;
}
// Overlap-add the end into the beginning without fading the entire bed to zero.
// Output ends at source[overlap-1] and starts at source[overlap]: adjacent samples.
export function seamlessLoop(source,overlap){
 const n=source.length-overlap,out=source.slice(overlap);
 for(let i=0;i<overlap;i++){
  const phase=(i+.5)/overlap*Math.PI/2;
  out[n-overlap+i]=source[n+i]*Math.cos(phase)+source[i]*Math.sin(phase);
 }
 return out;
}
export function layerSeconds(id,settings={}){
 const s=normalizeSoundSettings(settings);
 return id==='chimes'||id==='pad'?16*60/s.tempo:({rain:19,stream:23,wind:29,leaves:17,birds:31,waves:37,crickets:27,warmNoise:13})[id]||19;
}
export function generateLayer(id,seconds=layerSeconds(id),rate=16000,settings={}){
 const s=normalizeSoundSettings(settings),n=Math.max(32,Math.round(seconds*rate)),length=n/rate;
 const rng=random(731+SOUND_LAYERS.findIndex(row=>row[0]===id)*131+s.variation*17),variation=s.variation/100,energy=s.quietMode ? .15 :s.energy/100;
 const overlap=Math.min(Math.round(rate*.8),Math.floor(n/4));
 const noise=new Float32Array(n+overlap);let low=0,mid=0,high=0;
 // Warm up filter state, avoiding a manufactured silence at the start.
 for(let i=0;i<2000;i++){const x=rng()*2-1;low=low*.998+x*.002;mid=mid*.965+x*.035;high=high*.55+x*.45;}
 for(let i=0;i<noise.length;i++){
  const x=rng()*2-1;low=low*.998+x*.002;mid=mid*.965+x*.035;high=high*.55+x*.45;
  noise[i]=id==='rain'?mid*.65+high*.07:id==='stream'?mid*.65+low*1.2:id==='leaves'?mid*.45+high*.035:id==='waves'?mid*.8+low*1.4:low*2+mid*.15;
 }
 const bed=seamlessLoop(noise,overlap),out=new Float32Array(n);
 const count=id==='birds'?Math.max(1,Math.floor(length*.4)):id==='stream'?Math.max(2,Math.floor(length*1.6)):id==='rain'?Math.max(2,Math.floor(length*2)):id==='leaves'?Math.max(1,Math.floor(length*.6)):6;
 const events=Array.from({length:count},(_,i)=>({start:(i+.15+rng()*.65)*length/count,duration:.12+rng()*(id==='leaves'?.9:.3),freq:id==='birds'?1200+rng()*1100:id==='rain'?650+rng()*900:380+rng()*700,phase:rng()*TAU,level:.025+rng()*.055}));
 const cyc=(freq,t)=>Math.sin(TAU*Math.round(freq*length)*t/length);
 const clock=t=>((t%length)+length)%length;
 const music=Array.from({length:16},(_,i)=>({start:i*length/16,duration:.45+energy*.25,note:NOTES[[0,2,3,1,4,2,1,3,0,1,4,3,2,1,3,0][i]],level:i%4===0?.13:.075+energy*.035}));
 for(let i=0;i<n;i++){
  const t=i/rate,p=t/length,flow=.70+.15*Math.sin(TAU*p*2+.4)+.15*Math.sin(TAU*p*5+1.2);let v=0;
  if(['rain','stream','wind','leaves','waves','warmNoise'].includes(id)){
   const modulation=id==='waves'?.62+.28*Math.sin(TAU*p*3)+.1*Math.sin(TAU*p*7):id==='wind'?.7+.23*Math.sin(TAU*p*2)+.07*Math.sin(TAU*p*5):flow;
   v=bed[i]*modulation*(id==='warmNoise'?.65:1);
  }
  if(['birds','stream','rain','leaves'].includes(id))for(const event of events){
   const x=clock(t-event.start);if(x>=event.duration)continue;
   const e=Math.sin(Math.PI*x/event.duration)**2;
   if(id==='birds')v+=event.level*1.5*e*Math.sin(TAU*(event.freq*x+90*Math.sin(x*22+event.phase)))*(1-.22*Math.sin(x*55));
   else if(id==='leaves')v+=bed[i]*e*(.3+.8*variation);
   else v+=event.level*e*Math.sin(TAU*(event.freq*x-180*x*x))*Math.exp(-x*12);
  }
  if(id==='crickets'){
   const phrase=clock(t+.34)%(length/7),burst=Math.sin(Math.PI*Math.min(1,phrase/.42))**2;
   v=phrase<.42?.048*burst*cyc(2100,t)*(.65+.35*cyc(27,t)):bed[i]*.045;
  }
  if(id==='chimes')for(const note of music){
   const x=clock(t-note.start);if(x<note.duration)v+=note.level*mallet(note.note,x,note.duration,energy);
  }
  if(id==='pad'){
   const chords=[[146.8324,220,293.6648],[164.8138,246.9417,329.6276],[184.9972,220,369.9944],[146.8324,220,293.6648]];
   for(let c=0;c<4;c++){
    const a=TAU*(p-c/4),weight=Math.max(0,Math.cos(a))**2;
    for(const freq of chords[c])v+=.045*weight*(cyc(freq,t)+.06*cyc(freq*2,t));
   }
  }
  out[i]=Math.tanh(v*1.7);
 }
 return out;
}
export function ambientLevels(settings){
 const s=normalizeSoundSettings(settings),weights=s.mix.map(value=>(value/100)**1.2),balance=Math.min(1,2.3/Math.max(1,weights.reduce((a,b)=>a+b,0)));
 return weights.map(v=>v*s.volume/100*s.ambientVolume/100*1.4*balance*(s.quietMode ? .72 :1));
}
export function mixAmbience(mix,seconds=16*60/DEFAULT_SOUND_SETTINGS.tempo,rate=16000,settings={}){
 const s=normalizeSoundSettings({...settings,mix}),out=new Float32Array(Math.round(seconds*rate)),levels=ambientLevels(s);
 SOUND_LAYERS.forEach(([id],i)=>{
  if(!levels[i])return;
  const data=generateLayer(id,seconds,rate,s);for(let j=0;j<out.length;j++)out[j]+=data[j]*levels[i];
 });
 for(let i=0;i<out.length;i++)out[i]=Math.tanh(out[i]);
 return out;
}
export function logoSoundEvents(config,timing){
 const events=[],turnDuration=config.turnDuration/1000;
 for(let turn=0;turn<config.turns;turn++)for(let shape=0;shape<5;shape++)events.push({id:'orbit',time:turn*turnDuration+shape*turnDuration/5,note:NOTES[shape],duration:.28});
 if(!config.neutral)for(let i=0;i<5;i++)events.push({id:'splash',time:timing.orbit/1000+i*config.splashDuration/1000/7,note:NOTES[i],duration:.4});
 events.push({id:'white',time:timing.white/1000,note:293.66,duration:config.whiteDuration/1000});
 for(let i=0;i<3;i++)events.push({id:'reveal',time:timing.reveal/1000+i*.11,note:[587.33,739.99,880][i],duration:.4});
 return events;
}
export function generateLogoSound(config,timing,rate=16000,settings={}){
 const s=normalizeSoundSettings(settings),out=new Float32Array(Math.ceil((timing.total/1000+.5)*rate));
 for(const event of logoSoundEvents(config,timing)){
  const start=Math.floor(event.time*rate),count=Math.ceil(event.duration*rate);
  for(let i=0;i<count&&start+i<out.length;i++){
   const x=i/rate,phase=x/event.duration;
   let v=mallet(event.note,x,event.duration,s.energy/100)*(event.id==='orbit'?.15:.20);
   if(event.id==='splash')v+=.09*Math.sin(TAU*(150*x+120*x*x))*Math.sin(Math.PI*phase)**2;
   if(event.id==='white')v=.085*Math.sin(TAU*(180*x+80*x*x))*Math.sin(Math.PI*phase)**2;
   out[start+i]+=v;
  }
 }
 for(let i=0;i<out.length;i++)out[i]=Math.tanh(out[i]);
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
 constructor({contextFactory,workerFactory}={}){
  this.contextFactory=contextFactory;this.workerFactory=workerFactory;this.jobs=new Map();this.jobId=0;this.ctx=null;this.channels=new Map();this.pending=new Map();this.buffers=new Map();this.voices=new Set();this.playing=false;this.generation=0;this.voiceGeneration=0;
 }
 async ready(){
  if(!this.ctx){
   const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
   if(!this.contextFactory&&!Context)throw Error('Przeglądarka nie obsługuje dźwięku.');
   this.ctx=this.contextFactory?this.contextFactory():new Context();
   const ctx=this.ctx;
   this.master=ctx.createGain();this.master.gain.value=1;
   this.filter=ctx.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=6500;this.filter.Q.value=.3;
   this.limiter=ctx.createDynamicsCompressor();this.limiter.threshold.value=-12;this.limiter.knee.value=14;this.limiter.ratio.value=4;this.limiter.attack.value=.008;this.limiter.release.value=.16;
   this.ambientBus=ctx.createGain();this.ambientBus.gain.value=1;
   this.ambientBus.connect(this.master);this.master.connect(this.filter).connect(this.limiter).connect(ctx.destination);
  }
  if(this.ctx.state==='suspended')await this.ctx.resume();
  return this.ctx;
 }
 buffer(key,render,rate=16000){
  if(this.buffers.has(key))return this.buffers.get(key);
  const data=render(),buffer=this.ctx.createBuffer(1,data.length,rate);buffer.copyToChannel(data,0);
  this.buffers.set(key,buffer);if(this.buffers.size>24)this.buffers.delete(this.buffers.keys().next().value);
  return buffer;
 }
 async layerBuffer(id,key,settings){
  const cacheKey='layer:'+id+':'+key;if(this.buffers.has(cacheKey))return this.buffers.get(cacheKey);
  if(this.workerFactory!==null&&!this.worker&&typeof Worker!=='undefined')try{
   this.worker=this.workerFactory?this.workerFactory():new Worker(new URL('./sound-worker.mjs',import.meta.url),{type:'module'});
   this.worker.onmessage=({data})=>{const job=this.jobs.get(data.request);this.jobs.delete(data.request);if(data.error)job?.reject(Error(data.error));else job?.resolve(data.samples);};
   this.worker.onerror=()=>{for(const job of this.jobs.values())job.reject(Error('Nie udało się przygotować podkładu.'));this.jobs.clear();this.worker.terminate();this.worker=null;this.workerFactory=null;};
  }catch{this.workerFactory=null;}
  const seconds=layerSeconds(id,settings);
  const data=this.worker?await new Promise((resolve,reject)=>{const request=++this.jobId;this.jobs.set(request,{resolve,reject});this.worker.postMessage({request,id,seconds,settings});}):generateLayer(id,seconds,16000,settings);
  return this.buffer(cacheKey,()=>data);
 }
 release(voice,fade=.06){
  if(voice.released)return;voice.released=true;this.voices.delete(voice);
  const t=this.ctx.currentTime;voice.gain.gain.cancelScheduledValues(t);voice.gain.gain.setTargetAtTime(0,t,.015);
  try{voice.source.stop(t+fade);}catch{}
 }
 tune(settings){
  const s=normalizeSoundSettings(settings);this.filter?.frequency.setTargetAtTime(9000-s.warmth*62-(s.quietMode?1300:0),this.ctx.currentTime,.1);
 }
 duck(settings){
  const s=normalizeSoundSettings(settings),t=this.ctx.currentTime;
  this.ambientBus.gain.setTargetAtTime(1-s.ducking/100*.8,t,.025);
  clearTimeout(this.duckTimer);this.duckTimer=setTimeout(()=>{if(this.ctx)this.ambientBus.gain.setTargetAtTime(1,this.ctx.currentTime,.2);},600);
 }
 async cue(id,settings){
  const generation=this.voiceGeneration,ctx=await this.ready();if(generation!==this.voiceGeneration)return;
  const s=normalizeSoundSettings(settings);this.tune(s);
  const buffer=this.buffer('cue:'+id+':'+s.energy+':'+s.quietMode,()=>generateCue(id,16000,s));
  const voice=this.playBuffer(buffer,s.volume/100*s.cueVolume/100*(s.quietMode ? .7 :1));
  this.duck(s);return voice;
 }
 playBuffer(buffer,level,offset=0){
  const ctx=this.ctx,source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;gain.gain.value=level;
  source.connect(gain).connect(this.master);const voice={source,gain};
  if(this.voices.size>=8)this.release(this.voices.values().next().value);
  this.voices.add(voice);source.onended=()=>{source.disconnect();gain.disconnect();this.voices.delete(voice);};
  source.start(ctx.currentTime+.015,Math.min(buffer.duration-.001,Math.max(0,offset)));return voice;
 }
 async logo(config,timing,offset=0,settings={}){
  this.pauseLogo();const run=++this.logoRun,generation=this.voiceGeneration,ctx=await this.ready();
  if(run!==this.logoRun||generation!==this.voiceGeneration)return;
  const s=normalizeSoundSettings(settings);this.tune(s);
  const key='logo:'+JSON.stringify([config.turns,config.turnDuration,config.splashDuration,config.whiteDuration,timing,s.energy]);
  const buffer=this.buffer(key,()=>generateLogoSound(config,timing,16000,s));
  if(offset/1000>=buffer.duration)return;
  this.logoVoice=this.playBuffer(buffer,s.volume/100*s.logoVolume/100*(s.quietMode ? .7 :1),offset/1000);return ctx;
 }
 pauseLogo(){this.logoRun=(this.logoRun||0)+1;if(this.logoVoice&&this.ctx)this.release(this.logoVoice,.03);this.logoVoice=null;}
 async start(settings){
  const run=++this.generation;await this.ready();if(run!==this.generation)return;
  this.playing=true;this.epoch=this.ctx.currentTime;await this.adjust(settings);
 }
 async adjust(settings){
  if(!this.ctx)return;
  const s=normalizeSoundSettings(settings);this.settings=s;this.tune(s);if(!this.playing)return;
  const levels=ambientLevels(s),key=s.tempo+':'+s.variation+':'+s.energy+':'+s.quietMode;
  for(const [i,voice]of this.channels){
   if(!levels[i]||voice.key!==key){this.release(voice);this.channels.delete(i);}
   else voice.gain.gain.setTargetAtTime(levels[i],this.ctx.currentTime,.06);
  }
  const generation=this.generation;
  for(let i=0;i<SOUND_LAYERS.length;i++){
   if(!levels[i]||this.channels.has(i)||this.pending.has(i))continue;
   this.pending.set(i,generation);
   // Yield between channels; synthesizing a forest must not freeze the game.
   await new Promise(resolve=>setTimeout(resolve,0));
   if(generation!==this.generation||!this.playing){if(this.pending.get(i)===generation)this.pending.delete(i);return;}
   const current=this.settings,currentKey=current.tempo+':'+current.variation+':'+current.energy+':'+current.quietMode;
   if(currentKey!==key){this.pending.delete(i);void this.adjust(current);return;}
   if(!ambientLevels(current)[i]||this.channels.has(i)){this.pending.delete(i);continue;}
   const id=SOUND_LAYERS[i][0];let buffer;try{buffer=await this.layerBuffer(id,key,current);}finally{if(this.pending.get(i)===generation)this.pending.delete(i);}
   if(generation!==this.generation||!this.playing)return;
   const latest=this.settings,latestKey=latest.tempo+':'+latest.variation+':'+latest.energy+':'+latest.quietMode;
   if(latestKey!==key){void this.adjust(latest);return;}
   const level=ambientLevels(latest)[i];if(!level)continue;
   const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=0;
   source.connect(gain).connect(this.ambientBus);source.onended=()=>{source.disconnect();gain.disconnect();};
   source.start(this.ctx.currentTime+.015,((this.ctx.currentTime-this.epoch)%buffer.duration+buffer.duration)%buffer.duration);
   gain.gain.setTargetAtTime(level,this.ctx.currentTime,.12);this.channels.set(i,{source,gain,key});
  }
 }
 stopAmbience(){
  this.generation++;this.playing=false;
  if(this.ctx)for(const voice of this.channels.values())this.release(voice);
  this.channels.clear();this.pending.clear();
 }
 stop(){
  this.voiceGeneration++;this.stopAmbience();this.pauseLogo();clearTimeout(this.duckTimer);
  if(this.ctx){for(const voice of this.voices)this.release(voice);this.ambientBus.gain.setTargetAtTime(1,this.ctx.currentTime,.02);}
 }
 async close(){this.stop();this.worker?.terminate();this.worker=null;for(const job of this.jobs.values())job.reject(Error('Odsłuch zamknięty.'));this.jobs.clear();if(this.ctx){await this.ctx.close();this.ctx=null;this.buffers.clear();}}
}
