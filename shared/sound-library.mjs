import {SOUND_ZONES,SOUND_COLLECTIONS,DEFAULT_AMBIENCE,ZONE_FIELDS,ZONE_MELODIES} from './sound-themes.mjs';
export {SOUND_ZONES,SOUND_COLLECTIONS,DEFAULT_AMBIENCE,ZONE_FIELDS} from './sound-themes.mjs';
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
export const SOUND_FIELDS={volume:[0,100],cueVolume:[0,100],ambientVolume:[0,100],energy:[0,100],tempo:[60,120],variation:[0,100],warmth:[0,100],ducking:[0,100],crossfadeMs:[800,6000],logoVolume:[0,100],loopSeconds:[24,180]};
export const DEFAULT_SOUND_SETTINGS={enabled:true,volume:48,cueVolume:68,ambientVolume:45,ambientEnabled:true,quietMode:false,ambientPreset:'adventure',mix:[...SOUND_PRESETS.adventure.mix],energy:65,tempo:84,variation:70,warmth:65,ducking:0,crossfadeMs:2600,soundscape:'playground',ambientZone:'home',ambience:structuredClone(DEFAULT_AMBIENCE),logoEnabled:true,logoVolume:72,loopSeconds:72,cues:{},bindings:{}};
const clamp=(v,min,max)=>Math.max(min,Math.min(max,Number(v)||0));
export const CUE_FIELDS={volume:[0,150],duration:[50,250],pitch:[-12,12],attack:[1,80],wood:[0,100],bell:[0,100],pop:[0,100],air:[0,100]};
export function cueSettings(id,settings={}){
 const row={volume:100,duration:100,pitch:0,attack:12,wood:68,bell:['correct','star','trophy','progress'].includes(id)?28:12,pop:['bubble','toggle','tap','next'].includes(id)?48:12,air:0,...settings.cues?.[id]};
 for(const [key,[min,max]]of Object.entries(CUE_FIELDS))row[key]=Math.round(clamp(row[key],min,max));
 return row;
}
export function normalizeSoundSettings(input={}){
 input=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
 const s={...DEFAULT_SOUND_SETTINGS,...(input&&typeof input==='object'&&!Array.isArray(input)?input:{})};
 for(const [key,[min,max]]of Object.entries(SOUND_FIELDS))s[key]=Math.round(clamp(s[key],min,max));
 for(const key of ['enabled','ambientEnabled','quietMode','logoEnabled'])s[key]=s[key]===true;
 if(!Object.hasOwn(SOUND_PRESETS,s.ambientPreset)&&s.ambientPreset!=='custom')s.ambientPreset='adventure';
 s.mix=Array.from({length:10},(_,i)=>Math.round(clamp(s.mix?.[i],0,100)));
 s.cues=Object.fromEntries(SOUND_CUES.filter(([id])=>s.cues?.[id]).map(([id])=>[id,cueSettings(id,s)]));
 if(!Object.hasOwn(SOUND_COLLECTIONS,s.soundscape))s.soundscape='playground';if(!Object.hasOwn(SOUND_ZONES,s.ambientZone))s.ambientZone='home';
 s.ambience=Object.fromEntries(Object.entries(DEFAULT_AMBIENCE).map(([zone,base])=>{const value=input.ambience?.[zone]||{},row={...base,...value,mix:[...(value.mix||base.mix)]};if(zone==='home'&&!input.ambience&&input.mix){row.mix=[...s.mix];row.ambientPreset=s.ambientPreset;for(const k of ['tempo','energy','variation','loopSeconds'])if(input[k]!==undefined)row[k]=s[k];}if(!Object.hasOwn(SOUND_COLLECTIONS,row.soundscape))row.soundscape=base.soundscape;row.mix=Array.from({length:10},(_,i)=>Math.round(clamp(row.mix[i],0,100)));for(const [key,[min,max]]of Object.entries(ZONE_FIELDS))row[key]=Math.round(clamp(row[key],min,max));return [zone,row];}));
 s.bindings=structuredClone(s.bindings&&typeof s.bindings==='object'&&!Array.isArray(s.bindings)?s.bindings:{});
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
 if(!s.cues||typeof s.cues!=='object'||Array.isArray(s.cues))throw Error('Niepoprawny mikser krótkich dźwięków.');
 for(const [id,fields]of Object.entries(s.cues)){
  if(!SOUND_CUES.some(row=>row[0]===id)||!fields||Array.isArray(fields)||typeof fields!=='object')throw Error('Nieznane brzmienie.');
  for(const [key,value]of Object.entries(fields)){const limits=CUE_FIELDS[key];if(!limits||!Number.isInteger(value)||value<limits[0]||value>limits[1])throw Error('Niepoprawne ustawienie brzmienia: '+key);}
 }
 if(!Object.hasOwn(SOUND_COLLECTIONS,s.soundscape)||!Object.hasOwn(SOUND_ZONES,s.ambientZone))throw Error('Nieznany zestaw lub strefa dźwięków.');
 if(!s.ambience||typeof s.ambience!=='object'||Array.isArray(s.ambience))throw Error('Niepoprawne motywy tła.');
 for(const [zone,row]of Object.entries(s.ambience)){if(!Object.hasOwn(SOUND_ZONES,zone)||!row||Array.isArray(row)||typeof row!=='object'||Object.keys(row).some(k=>!['soundscape','ambientPreset','mix',...Object.keys(ZONE_FIELDS)].includes(k)))throw Error('Nieznana strefa lub parametr motywu.');if(!Object.hasOwn(SOUND_COLLECTIONS,row.soundscape)||(!Object.hasOwn(SOUND_PRESETS,row.ambientPreset)&&row.ambientPreset!=='custom')||!Array.isArray(row.mix)||row.mix.length!==10||row.mix.some(v=>!Number.isInteger(v)||v<0||v>100))throw Error('Niepoprawny miks strefy.');for(const [key,[min,max]]of Object.entries(ZONE_FIELDS))if(!Number.isInteger(row[key])||row[key]<min||row[key]>max)throw Error('Niepoprawny parametr strefy: '+key);}
 if(!s.bindings||typeof s.bindings!=='object'||Array.isArray(s.bindings))throw Error('Niepoprawna mapa dźwięków.');
 let count=0;
 for(const [view,rows]of Object.entries(s.bindings)){
  if(!(view==='*'||/^[a-z][a-z0-9-]{0,79}$/.test(view))||!rows||Array.isArray(rows)||typeof rows!=='object')throw Error('Niepoprawny ekran mapy dźwięków.');
  for(const [key,value]of Object.entries(rows)){
   if(++count>2000||!/^[a-z][a-zA-Z0-9:_-]{0,159}$/.test(key)||!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(k=>!['cue','volume'].includes(k))||!['none',...SOUND_CUES.map(row=>row[0])].includes(value.cue)||!Number.isInteger(value.volume)||value.volume<0||value.volume>150)throw Error('Niepoprawne przypisanie dźwięku.');
  }
 }
 return input;
}
export function ambienceForZone(settings,zone='home'){
 const s=normalizeSoundSettings(settings),theme=s.ambience[zone]||s.ambience.home;
 return {...s,...theme,volume:s.volume,ambientVolume:s.ambientVolume*theme.volume/100,ambientZone:zone};
}
export function ambienceKey(settings){return [settings.ambientZone,settings.soundscape,settings.tempo,settings.variation,settings.energy,settings.quietMode,settings.loopSeconds].join(':');}
function random(seed){let x=seed>>>0;return ()=>{x=(1664525*x+1013904223)>>>0;return x/4294967296;};}
const TAU=Math.PI*2;
const NOTES=[293.6648,329.6276,369.9944,440,493.8833,587.3295]; // D major pentatonic
const CUE_NOTES={
 tap:[[440,0,.08,.13],[587.33,.035,.10,.06]],toggle:[[392,0,.08,.14],[587.33,.055,.16,.13]],
 correct:[[523.25,0,.13,.16],[659.25,.09,.16,.15],[783.99,.21,.26,.13]],
 incorrect:[[392,0,.16,.13],[440,.15,.20,.10]],hint:[[493.88,0,.15,.13],[739.99,.12,.25,.12]],
 next:[[392,0,.08,.12],[587.33,.07,.14,.12]],star:[[587.33,0,.12,.16],[739.99,.075,.14,.15],[987.77,.17,.26,.12]],
 trophy:[[392,0,.17,.14],[523.25,.10,.18,.15],[659.25,.23,.20,.14],[783.99,.40,.39,.13]],
 roundStart:[[392,0,.13,.15],[493.88,.085,.15,.14],[587.33,.22,.28,.15]],
 roundEnd:[[739.99,0,.17,.12],[587.33,.12,.23,.13],[440,.27,.33,.12],[293.66,.27,.34,.09]],
 progress:[[523.25,0,.14,.14],[783.99,.09,.22,.12]],bubble:[[196,0,.17,.12],[659.25,.06,.21,.07]]
};
function mallet(freq,x,duration,energy=.65,attack=.008){
 if(x<0||x>=duration)return 0;
 const envelope=Math.min(1,x/attack)*Math.exp(-x*5/duration)*Math.min(1,(duration-x)/.04);
 return envelope*(Math.sin(TAU*freq*x)+(.07+.16*energy)*Math.sin(TAU*freq*2*x)*Math.exp(-x*18));
}
export function generateCue(id,rate=16000,settings={}){
 const s=normalizeSoundSettings(settings),c=cueSettings(id,s),scale=c.duration/100,ratio=2**(c.pitch/12),notes=CUE_NOTES[id]||CUE_NOTES.tap,energy=s.quietMode ? .2 :s.energy/100;
 const out=new Float32Array(Math.round(Math.ceil((Math.max(...notes.map(n=>n[1]+n[2]))+.08)*rate)*scale)),rng=random(711);
 for(let i=0;i<out.length;i++){
  const t=i/rate,u=t/scale;let v=0;
  for(const [freq,start,duration,level]of notes){
   const x=t-start*scale,d=duration*scale;
   v+=c.wood/100*level*mallet(freq*ratio,x,d,energy,c.attack/1000);
   if(x>=0&&x<d)v+=c.bell/100*level*Math.min(1,x/(c.attack/1000))*Math.exp(-x*3/d)*Math.min(1,(d-x)/.04)*(Math.sin(TAU*freq*ratio*x)+.24*Math.sin(TAU*freq*ratio*2.76*x));
  }
  v+=c.pop/100*.11*Math.sin(TAU*ratio*(240*u+950*u*u-2000*u*u*u))*Math.sin(Math.PI*Math.min(1,u/.14))**2*Math.exp(-u*18);
  v+=c.air/100*(rng()-.5)*.10*Math.min(1,t/(c.attack/1000))*Math.exp(-u*35);
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
 const s=normalizeSoundSettings(settings),bar=16*60/s.tempo;
 return id==='chimes'||id==='pad'?Math.max(bar,Math.round(s.loopSeconds/bar)*bar):s.loopSeconds*({rain:.83,stream:1.13,wind:1.43,leaves:.97,birds:1.37,waves:1.57,crickets:1.19,warmNoise:1})[id]||s.loopSeconds;
}
export function generateLayer(id,seconds=layerSeconds(id),rate=16000,settings={}){
 const s=normalizeSoundSettings(settings),n=Math.max(32,Math.round(seconds*rate)),length=n/rate;
 const kit=s.soundscape,zone=Object.keys(SOUND_ZONES).indexOf(s.ambientZone);
 const rng=random(731+SOUND_LAYERS.findIndex(row=>row[0]===id)*131+s.variation*17+zone*211+Object.keys(SOUND_COLLECTIONS).indexOf(kit)*977),variation=s.variation/100,energy=s.quietMode ? .15 :s.energy/100;
 const overlap=Math.min(Math.round(rate*.8),Math.floor(n/4));
 const noise=new Float32Array(n+overlap);let low=0,mid=0,high=0;
 // Warm up filter state, avoiding a manufactured silence at the start.
 for(let i=0;i<2000;i++){const x=rng()*2-1;low=low*.998+x*.002;mid=mid*.965+x*.035;high=high*.55+x*.45;}
 for(let i=0;i<noise.length;i++){
  const x=rng()*2-1;low=low*.998+x*.002;mid=mid*.965+x*.035;high=high*.55+x*.45;
  noise[i]=id==='rain'?mid*.35+high*.04:id==='stream'?low*.16+mid*.035:id==='leaves'?mid*.8+high*.16:id==='waves'?mid*.32+low*.8:low*.65+mid*.025;
 }
 const bed=seamlessLoop(noise,overlap),out=new Float32Array(n);
 const count=id==='birds'?Math.max(1,Math.floor(length*.4)):id==='stream'?Math.max(2,Math.floor(length*1.6)):id==='rain'?Math.max(2,Math.floor(length*2)):id==='leaves'?Math.max(1,Math.floor(length*.6)):6;
 const events=Array.from({length:count},(_,i)=>({start:(i+.15+rng()*.65)*length/count,duration:.12+rng()*(id==='leaves'?.9:.3),freq:id==='birds'?1200+rng()*1100:id==='rain'?650+rng()*900:380+rng()*700,phase:rng()*TAU,level:.025+rng()*.055}));
 const cyc=(freq,t)=>Math.sin(TAU*Math.round(freq*length)*t/length);
 const clock=t=>((t%length)+length)%length;
 const beats=Math.max(1,Math.round(length*s.tempo/60));
 const music=Array.from({length:beats},(_,i)=>{const phrase=Math.floor(i/16),degree=(ZONE_MELODIES[s.ambientZone]||ZONE_MELODIES.home)[i%16],varied=phrase&&i%4!==0?Math.min(5,Math.max(0,degree+(rng()<.5?-1:1))):degree;return {start:i*length/beats,duration:Math.min(length/beats*.86,.45+energy*.25),note:NOTES[varied],level:i%4===0?.13:(rng()<.18?0:.075+energy*.035)};});
 for(let i=0;i<n;i++){
  const t=i/rate,p=t/length,flow=.70+.15*Math.sin(TAU*p*2+.4)+.15*Math.sin(TAU*p*5+1.2);let v=0;
  if(['rain','stream','wind','waves','warmNoise'].includes(id)){
   const modulation=id==='waves'?.62+.28*Math.sin(TAU*p*3)+.1*Math.sin(TAU*p*7):id==='wind'?.7+.23*Math.sin(TAU*p*2)+.07*Math.sin(TAU*p*5):flow;
   v=bed[i]*modulation*(id==='warmNoise'?.4:id==='stream'?.35:1);
   if(id==='waves'&&kit==='forest'){const wing=clock(t)%(length/9);v=wing<.7?bed[i]*Math.sin(Math.PI*wing/.7)**2*(.5+.5*cyc(9,t)):0;}
  }
  if(id==='crickets'){
   const phrase=clock(t+.34)%(length/7),burst=Math.sin(Math.PI*Math.min(1,phrase/.42))**2;
   v=phrase<.42?.035*burst*cyc(kit==='garden'?1700:2100,t)*(.65+.35*cyc(kit==='garden'?43:27,t)):0;
  }
  if(id==='pad'){
   const chords=[[146.8324,220,293.6648],[164.8138,246.9417,329.6276],[184.9972,220,369.9944],[146.8324,220,293.6648]];
   for(let c=0;c<4;c++){
    const a=TAU*(p-c/4),weight=Math.max(0,Math.cos(a))**2;
    for(const freq of chords[(c+Math.max(0,zone))%4])v+=(kit==='garden'?.032:.04)*weight*(cyc(freq,t)+.035*cyc(freq*2,t));
   }
  }
  out[i]=v;
 }
 // Render only the samples occupied by a note or chirp. Longer arrangements
 // must not multiply work by scanning every event for every frame of audio.
 const add=(start,duration,sample)=>{for(let j=Math.ceil(start*rate);j<(start+duration)*rate;j++){const i=j%n;out[i]+=sample(j/rate-start,i);}};
 if(['birds','stream','rain','leaves'].includes(id))for(const event of events)add(event.start,event.duration,(x,i)=>{
  const e=Math.sin(Math.PI*x/event.duration)**2;
  if(id==='birds'){const species=kit==='forest'?Math.floor(event.phase)%3:0,freq=event.freq*(species===1?.73:species===2?1.17:1),syllable=species===1?18:species===2?38:22;return event.level*1.25*e*Math.sin(TAU*(freq*x+(kit==='garden'?45:90)*Math.sin(x*syllable+event.phase)))*(1-.22*Math.sin(x*55));}
  if(id==='leaves')return bed[i]*e*(.4+.8*variation)+(kit==='forest'?.015*mallet(170+event.freq*.1,x,.075,.1):0);
  return event.level*(id==='stream'?2:1)*e*Math.sin(TAU*(event.freq*x-420*x*x))*Math.exp(-x*(id==='stream'?8:12));
 });
 if(id==='stream'&&kit==='garden')for(let k=0;k<6;k++)add(k*length/6+.2,.32,x=>.08*mallet(180+k%2*28,x,.32,.15)+.025*mallet(510,x,.19,.1));
 if(id==='chimes')for(const note of music)if(note.level)add(note.start,note.duration,x=>note.level*mallet(note.note*(kit==='forest'?.5:1),x,note.duration,kit==='garden'?.1:energy,.012)+(kit==='garden'?note.level*.22*Math.sin(TAU*note.note*2.76*x)*Math.min(1,x/.02)*Math.exp(-x*14):0));
 for(let i=0;i<n;i++)out[i]=Math.tanh(out[i]*1.7);
 return out;
}
export function ambientLevels(settings){
 const s=normalizeSoundSettings(settings),weights=s.mix.map(value=>(value/100)**1.2),balance=Math.min(1,2.3/Math.max(1,weights.reduce((a,b)=>a+b,0)));
 return weights.map(v=>v*s.volume/100*s.ambientVolume/100*1.4*balance*(s.quietMode ? .72 :1));
}
export function mixAmbience(mix,seconds,rate=16000,settings={}){
 seconds??=layerSeconds('pad',settings);
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
  this.contextFactory=contextFactory;this.workerFactory=workerFactory;this.jobs=new Map();this.jobId=0;this.ctx=null;this.channels=new Map();this.pending=new Map();this.buffers=new Map();this.bufferSizes=new Map();this.cacheBytes=0;this.voices=new Set();this.playing=false;this.generation=0;this.voiceGeneration=0;
 }
 async ready({gesture=false}={}){
  if(this.ctx?.state==='closed'){this.ctx=null;this.clearBuffers();}
  if(!this.ctx){
   const Context=globalThis.AudioContext||globalThis.webkitAudioContext;
   if(!this.contextFactory&&!Context)throw Error('Przeglądarka nie obsługuje dźwięku.');
   this.ctx=this.contextFactory?this.contextFactory():new Context();
   const ctx=this.ctx;
   this.master=ctx.createGain();this.master.gain.value=1;
   this.filter=ctx.createBiquadFilter();this.filter.type='lowpass';this.filter.frequency.value=6500;this.filter.Q.value=.3;
   this.limiter=ctx.createDynamicsCompressor();this.limiter.threshold.value=-12;this.limiter.knee.value=14;this.limiter.ratio.value=4;this.limiter.attack.value=.008;this.limiter.release.value=.16;
   this.ambientBus=ctx.createGain();this.ambientBus.gain.value=1;
   this.ambientBus.connect(this.master);this.master.connect(this.filter);this.filter.connect(this.limiter);this.limiter.connect(ctx.destination);
  }
  if(gesture){
   // Keep native activation inside the touch/click call stack, before any await.
   try{if(globalThis.navigator?.audioSession)navigator.audioSession.type='playback';}catch{}
   const ctx=this.ctx;
   if(ctx.state!=='running'&&!this.primedContexts?.has(ctx)){
    this.primedContexts??=new WeakSet();this.primedContexts.add(ctx);
    const silent=ctx.createBufferSource();silent.buffer=ctx.createBuffer(1,1,ctx.sampleRate||44100);silent.connect(ctx.destination);silent.onended=()=>silent.disconnect();silent.start(0);
   }
  }
  // WebKit can interrupt an already unlocked context when the device or tab sleeps.
  const ctx=this.ctx;
  if(ctx.state==='suspended'||ctx.state==='interrupted')await ctx.resume();
  if(ctx!==this.ctx||ctx.state!=='running')throw Error('Dźwięk jest wstrzymany. Kliknij ponownie przycisk odsłuchu.');
  return ctx;
 }
 buffer(key,render,rate=16000){
  if(this.buffers.has(key))return this.buffers.get(key);
  const data=render(),buffer=this.ctx.createBuffer(1,data.length,rate);buffer.copyToChannel(data,0);
  this.buffers.set(key,buffer);this.bufferSizes.set(key,data.length*4);this.cacheBytes+=data.length*4;
  while(this.buffers.size>1&&(this.buffers.size>24||this.cacheBytes>64*1024*1024)){const oldest=this.buffers.keys().next().value;this.cacheBytes-=this.bufferSizes.get(oldest);this.buffers.delete(oldest);this.bufferSizes.delete(oldest);}
  return buffer;
 }
 clearBuffers(){this.buffers.clear();this.bufferSizes.clear();this.cacheBytes=0;}
 failWorker(disable=true){
  const worker=this.worker;this.worker=null;if(disable)this.workerFactory=null;worker?.terminate();
  for(const job of this.jobs.values()){clearTimeout(job.timer);job.reject(Error('Nie udało się przygotować podkładu.'));}this.jobs.clear();
 }
 async layerBuffer(id,key,settings){
  const cacheKey='layer:'+id+':'+key;if(this.buffers.has(cacheKey))return this.buffers.get(cacheKey);
  const ctx=this.ctx,generation=this.generation;
  if(this.workerFactory!==null&&!this.worker&&(this.workerFactory||typeof Worker!=='undefined'))try{
   this.worker=this.workerFactory?this.workerFactory():new Worker(new URL('./sound-worker.mjs',import.meta.url),{type:'module'});
   this.worker.onmessage=({data})=>{const job=this.jobs.get(data.request);if(!job)return;this.jobs.delete(data.request);clearTimeout(job.timer);if(data.error)job.reject(Error(data.error));else job.resolve(data.samples);};
   this.worker.onerror=()=>this.failWorker();
   this.worker.onmessageerror=()=>this.failWorker();
  }catch{this.failWorker();}
  const seconds=layerSeconds(id,settings);let data;
  if(this.worker)try{
   data=await new Promise((resolve,reject)=>{
    const request=++this.jobId,timer=setTimeout(()=>this.failWorker(),3000);this.jobs.set(request,{resolve,reject,timer});
    try{this.worker.postMessage({request,id,seconds,settings});}catch{this.failWorker();}
   });
  }catch{/* A failed worker must not leave the mixer permanently silent. */}
  if(ctx!==this.ctx||generation!==this.generation)throw Error('Odsłuch zamknięty.');
  data||=generateLayer(id,seconds,16000,settings);
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
 async cue(id,settings,level=1){
  const generation=this.voiceGeneration,ctx=await this.ready();if(generation!==this.voiceGeneration)return;
  const s=normalizeSoundSettings(settings);this.tune(s);
  const buffer=this.buffer('cue:'+id+':'+s.energy+':'+s.quietMode+':'+JSON.stringify(cueSettings(id,s)),()=>generateCue(id,16000,s));
  const voice=this.playBuffer(buffer,s.volume/100*s.cueVolume/100*cueSettings(id,s).volume/100*level*(s.quietMode ? .7 :1));
  this.duck(s);return voice;
 }
 playBuffer(buffer,level,offset=0,rate=1){
  const ctx=this.ctx,source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;if(source.playbackRate)source.playbackRate.value=rate;gain.gain.value=level;
  source.connect(gain);gain.connect(this.master);const voice={source,gain};
  if(this.voices.size>=8)this.release(this.voices.values().next().value);
  this.voices.add(voice);source.onended=()=>{source.disconnect();gain.disconnect();this.voices.delete(voice);};
  source.start(ctx.currentTime+.015,Math.min(buffer.duration-.001,Math.max(0,offset)));return voice;
 }
 async logo(config,timing,offset=0,settings={},rate=1){
  this.pauseLogo();const run=++this.logoRun,generation=this.voiceGeneration,ctx=await this.ready();
  if(run!==this.logoRun||generation!==this.voiceGeneration)return;
  const s=normalizeSoundSettings(settings);this.tune(s);
  const key='logo:'+JSON.stringify([config.turns,config.turnDuration,config.splashDuration,config.whiteDuration,timing,s.energy]);
  const buffer=this.buffer(key,()=>generateLogoSound(config,timing,16000,s));
  if(offset/1000>=buffer.duration)return;
  this.logoVoice=this.playBuffer(buffer,s.volume/100*s.logoVolume/100*(s.quietMode ? .7 :1),offset/1000,rate);return ctx;
 }
 pauseLogo(){this.logoRun=(this.logoRun||0)+1;if(this.logoVoice&&this.ctx)this.release(this.logoVoice,.03);this.logoVoice=null;}
 async start(settings){
  const run=++this.generation;await this.ready();if(run!==this.generation)return;
  this.playing=true;this.epoch??=this.ctx.currentTime;
  try{await this.adjust(settings);}catch(error){if(run===this.generation)this.stopAmbience();throw error;}
 }
 async adjust(settings){
  if(!this.ctx)return;
  const s=normalizeSoundSettings(settings);this.settings=s;this.tune(s);if(!this.playing)return;
  const key=ambienceKey(s),levels=ambientLevels(s);
  if(this.theme?.key===key){
   // Returning while a different theme is preparing keeps the current theme.
   if(this.preparing?.key!==key){this.themeRequest=(this.themeRequest||0)+1;this.preparing=null;}
   for(const [i,voice]of this.channels){if(!levels[i]){this.release(voice);this.channels.delete(i);}else voice.gain.gain.setTargetAtTime(levels[i],this.ctx.currentTime,.08);}
   const missing=levels.some((level,i)=>level&&!this.channels.has(i));
   if(!missing)return;
  }
  if(this.preparing?.key===key)return this.preparing.promise;
  const request=(this.themeRequest||0)+1;this.themeRequest=request;const generation=this.generation;
  const prepare=async()=>{
   const buffers=new Map();
   for(let i=0;i<SOUND_LAYERS.length;i++){
    if(!levels[i]||this.theme?.key===key&&this.channels.has(i))continue;
    this.pending.set(i,request);await new Promise(resolve=>setTimeout(resolve,0));
    if(request!==this.themeRequest||generation!==this.generation||!this.playing)return;
    try{buffers.set(i,await this.layerBuffer(SOUND_LAYERS[i][0],key,s));}
    finally{if(this.pending.get(i)===request)this.pending.delete(i);}
   }
   if(request!==this.themeRequest||generation!==this.generation||!this.playing)return;
   const latestLevels=ambientLevels(this.settings),t=this.ctx.currentTime+.025;
   if(this.theme?.key===key){
    for(const [i,buffer]of buffers)if(latestLevels[i])this.channels.set(i,this.loopVoice(buffer,latestLevels[i],key,this.theme.bus,t));
    return;
   }
   // Prepare the complete incoming theme before touching the outgoing one.
   const bus=this.ctx.createGain();bus.gain.value=0;bus.connect(this.ambientBus);
   const theme={key,bus,channels:new Map()};
   for(const [i,buffer]of buffers)if(latestLevels[i])theme.channels.set(i,this.loopVoice(buffer,latestLevels[i],key,bus,t));
   const old=this.theme;this.theme=theme;this.channels=theme.channels;
   const seconds=this.settings.crossfadeMs/1000;
   this.fadeTheme(theme,true,t,seconds);if(old)this.retireTheme(old,t,seconds);
  };
  const promise=prepare().finally(()=>{if(this.preparing?.request===request)this.preparing=null;});
  this.preparing={key,request,promise};return promise;
 }
 loopVoice(buffer,level,key,bus,t){
  const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=level;
  source.connect(gain);gain.connect(bus);source.onended=()=>{source.disconnect();gain.disconnect();};
  source.start(t,((t-this.epoch)%buffer.duration+buffer.duration)%buffer.duration);return {source,gain,key};
 }
 fadeTheme(theme,incoming,t,seconds){
  const param=theme.bus.gain,start=Math.max(0,Math.min(1,param.value));
  // A quick route change may interrupt a curve already in progress. Remove
  // that complete curve before scheduling another, including in WebKit.
  param.cancelScheduledValues(0);param.setValueAtTime?.(start,this.ctx.currentTime);
  if(param.setValueCurveAtTime){const curve=Float32Array.from({length:33},(_,i)=>incoming?Math.sin(i/32*Math.PI/2):Math.cos(i/32*Math.PI/2)*start);param.setValueCurveAtTime(curve,t,seconds);}
  else param.setTargetAtTime(incoming?1:0,t,seconds/4);
 }
 retireTheme(theme,t,seconds){
  this.retiring??=new Set();for(const old of this.retiring)this.disposeTheme(old);this.retiring.add(theme);
  this.fadeTheme(theme,false,t,seconds);
  theme.timer=setTimeout(()=>{this.disposeTheme(theme);this.retiring.delete(theme);},(seconds+.12)*1000);
 }
 disposeTheme(theme){
  clearTimeout(theme.timer);for(const voice of theme.channels.values())this.release(voice);theme.channels.clear();theme.bus.disconnect();
 }
 stopAmbience(){
  this.generation++;this.themeRequest=(this.themeRequest||0)+1;this.playing=false;this.preparing=null;
  if(this.theme){this.disposeTheme(this.theme);this.theme=null;}
  if(this.retiring)for(const theme of this.retiring)this.disposeTheme(theme);this.retiring?.clear();
  this.channels.clear();this.pending.clear();
 }
 stop(){
  this.voiceGeneration++;this.stopAmbience();this.pauseLogo();clearTimeout(this.duckTimer);
  if(this.ctx){for(const voice of this.voices)this.release(voice);this.ambientBus.gain.setTargetAtTime(1,this.ctx.currentTime,.02);}
 }
 async close(){
  this.stop();this.failWorker(false);const ctx=this.ctx;this.ctx=null;this.clearBuffers();
  if(ctx&&ctx.state!=='closed')await ctx.close();
 }
}
