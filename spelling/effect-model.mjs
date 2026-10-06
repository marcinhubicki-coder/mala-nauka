import {DEFAULT_REACTIONS,BUBBLE_SHAPES,validateReactions} from './bubble-dynamics.mjs';
export const EFFECT_STYLES={spark:'Iskry',star:'Gwiazdy',star5:'Gwiazdy 5-ramienne',star9:'Gwiazdy 9-ramienne',confetti:'Konfetti',textConfetti:'Konfetti z tekstu',halo:'Aureola',comet:'Komety',petal:'Płatki',orbit:'Orbity',fountain:'Fontanna',diamond:'Diamenty',ripple:'Kręgi',lightning:'Błyskawice',glitter:'Brokat',dynamite:'Iskrzący dynamit'};
export const DEFAULT_EFFECTS={enabled:true,randomize:true,comboEvery:3,comboBoost:1.35,particleBudget:36,
 bubble:{frameRate:24,speed:4.7,amplitude:3.25,orbit:1.35,transitionDuration:1200,transitionBlur:5.3,transitionSparks:18,shape:'bubble',morph:1,skin:'rainbow',texture:.28,sparkle:.55,lightning:0,fizz:.15},reactions:DEFAULT_REACTIONS,
 wrong:{duration:520,shake:6,color:'#dd4161',style:'lightning',particles:16,spread:76,sizeMin:8,sizeMax:24,speed:1.05,gravity:.12,drag:.08,lifetime:.8,opacity:.9,rotation:120,originX:50,originY:50,delay:0,bursts:1,randomness:.55,intensity:.8,wobble:.65,randomHit:.7,flash:.55},
 presets:Object.fromEntries(Object.entries(EFFECT_STYLES).map(([id,name],i)=>[id,{name,enabled:['spark','star','confetti','halo','comet','petal','orbit','fountain','diamond','ripple'].includes(id),style:id,particles:[24,18,18,18,30,34,10,18,22,16,28,20,8,16,42,36][i]||18,duration:[850,1050,1050,1150,1100,1200,700,950,1000,1050,900,800,750,720,1250,900][i]||900,spread:[82,92,104,112,94,118,66,108,80,92,94,82,64,110,122,126][i]||88,scale:1.08,color:['#ffc82f','#ff4ca0','#ffd64b','#b88cff','#52ce9a','#ff5aa5','#934dff','#4cafff','#ff8bbd','#b49bff','#69d9dc','#ffc82f','#52ce9a','#8ee9ff','#fff1a8','#ff9b35'][i]||'#ffc82f',sizeMin:id==='glitter'?4:7,sizeMax:id==='halo'||id==='ripple'?46:id==='star5'||id==='star9'?30:20,speed:id==='dynamite'?1.4:id==='lightning'?1.35:1,gravity:['confetti','textConfetti','fountain'].includes(id)?.75:id==='petal'?.45:.18,drag:.12,lifetime:1,opacity:1,rotation:['confetti','textConfetti','star5','star9'].includes(id)?560:220,originX:50,originY:50,delay:0,bursts:['textConfetti','glitter'].includes(id)?2:id==='dynamite'?3:1,randomness:['textConfetti','glitter','dynamite'].includes(id)?.85:.5}]))};
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
const optionalFinite=(v,min,max)=>v===undefined||finite(v,min,max);
export function normalizeEffectsConfig(value=DEFAULT_EFFECTS){const source=value||{},presets=Object.fromEntries(Object.entries({...DEFAULT_EFFECTS.presets,...source.presets}).map(([id,row])=>[id,{...DEFAULT_EFFECTS.presets[id],...row}]));return {...DEFAULT_EFFECTS,...source,bubble:{...DEFAULT_EFFECTS.bubble,...source.bubble},wrong:{...DEFAULT_EFFECTS.wrong,...source.wrong},reactions:{correct:{...DEFAULT_REACTIONS.correct,...source.reactions?.correct},wrong:{...DEFAULT_REACTIONS.wrong,...source.reactions?.wrong},combo:{...DEFAULT_REACTIONS.combo,...source.reactions?.combo}},presets};}
export function validateEffects(value){
 const e=normalizeEffectsConfig(value);if(!value||typeof e.enabled!=='boolean'||typeof e.randomize!=='boolean'||!Number.isInteger(e.comboEvery)||!finite(e.comboEvery,2,12)||!finite(e.comboBoost,1,1.8)||!Number.isInteger(e.particleBudget)||!finite(e.particleBudget,0,120))throw Error('Nieprawidłowy budżet efektów.');
 const b=e.bubble;if(!b||(b.frameRate!==undefined&&![15,24,30].includes(b.frameRate))||!finite(b.speed,2.2,15)||!finite(b.amplitude,0,12)||!finite(b.orbit,0,6)||!finite(b.transitionDuration,200,5000)||!finite(b.transitionBlur,0,12)||!Number.isInteger(b.transitionSparks)||!finite(b.transitionSparks,0,72)||!Object.hasOwn(BUBBLE_SHAPES,b.shape)||!finite(b.morph,0,1)||!['rainbow','ocean','sunset','leaf'].includes(b.skin)||!optionalFinite(b.texture,0,2)||!optionalFinite(b.sparkle,0,3)||!optionalFinite(b.lightning,0,3)||!optionalFinite(b.fizz,0,3))throw Error('Nieprawidłowe ustawienia bańki.');
 validateReactions(e.reactions);
 const w=e.wrong;if(!w||!finite(w.duration,100,3000)||!finite(w.shake,0,32)||!/^#[0-9a-f]{6}$/i.test(w.color)||!Object.hasOwn(EFFECT_STYLES,w.style)||!Number.isInteger(w.particles)||!finite(w.particles,0,120)||!finite(w.spread,10,360)||!optionalFinite(w.sizeMin,2,90)||!optionalFinite(w.sizeMax,2,140)||!optionalFinite(w.speed,.25,4)||!optionalFinite(w.gravity,-3,4)||!optionalFinite(w.drag,0,.95)||!optionalFinite(w.lifetime,.25,3)||!optionalFinite(w.opacity,.1,1)||!optionalFinite(w.rotation,0,2160)||!optionalFinite(w.originX,0,100)||!optionalFinite(w.originY,0,100)||!optionalFinite(w.delay,0,1800)||!optionalFinite(w.bursts,1,8)||!optionalFinite(w.randomness,0,1)||!optionalFinite(w.intensity,0,3)||!optionalFinite(w.wobble,0,3)||!optionalFinite(w.randomHit,0,3)||!optionalFinite(w.flash,0,3))throw Error('Nieprawidłowy efekt błędu.');
 if(!e.presets||Array.isArray(e.presets)||Object.keys(e.presets).length<10)throw Error('Biblioteka efektów jest niepełna.');
 for(const [id,p]of Object.entries(e.presets))if(!Object.hasOwn(DEFAULT_EFFECTS.presets,id)||!Object.hasOwn(EFFECT_STYLES,p.style)||typeof p.name!=='string'||!p.name.trim()||p.name.length>50||/[<>\u0000-\u001f]/.test(p.name)||typeof p.enabled!=='boolean'||!Number.isInteger(p.particles)||!finite(p.particles,0,120)||!finite(p.duration,180,3000)||!finite(p.spread,10,360)||!finite(p.scale,1,1.5)||!optionalFinite(p.sizeMin,2,90)||!optionalFinite(p.sizeMax,2,140)||!optionalFinite(p.speed,.25,4)||!optionalFinite(p.gravity,-3,4)||!optionalFinite(p.drag,0,.95)||!optionalFinite(p.lifetime,.25,3)||!optionalFinite(p.opacity,.1,1)||!optionalFinite(p.rotation,0,2160)||!optionalFinite(p.originX,0,100)||!optionalFinite(p.originY,0,100)||!optionalFinite(p.delay,0,1800)||!optionalFinite(p.bursts,1,8)||!optionalFinite(p.randomness,0,1)||!/^#[0-9a-f]{6}$/i.test(p.color)||p.sizeMax<p.sizeMin)throw Error('Nieprawidłowy efekt odpowiedzi.');
 if(!Object.values(e.presets).some(p=>p.enabled))throw Error('Zostaw co najmniej jeden aktywny efekt lub wyłącz efekty głównym przełącznikiem.');
 return value;
}
export function effectBudget(config,preset,combo=false){
 const e=normalizeEffectsConfig(config),p={...DEFAULT_EFFECTS.presets.spark,...preset};const requested=Math.round(p.particles*(combo?e.comboBoost:1));
 const particles=Math.min(e.particleBudget,requested);
 return {particles,requested,capped:particles<requested,duration:p.duration,load:particles>=90?'bardzo wysoki':particles>=60?'wysoki':particles>=36?'średni':'lekki'};
}
export function createEffectPicker(random=Math.random){
 let last='';
 return (config)=>{
  const e=normalizeEffectsConfig(config),enabled=Object.entries(e.presets).filter(([,p])=>p.enabled);
  const candidates=e.randomize&&enabled.length>1?enabled.filter(([id])=>id!==last):enabled;
  const [id,preset]=candidates[e.randomize?Math.min(candidates.length-1,Math.floor(random()*candidates.length)):0]||Object.entries(DEFAULT_EFFECTS.presets)[0];
  last=id;return {id,preset};
 };
}
export function frameStats(intervals){
 const values=intervals.filter(v=>Number.isFinite(v)&&v>0).sort((a,b)=>a-b);
 if(values.length<8)return {ready:false,samples:values.length};
 const mean=values.reduce((a,b)=>a+b,0)/values.length,p95=values[Math.min(values.length-1,Math.ceil(values.length*.95)-1)];
 return {ready:true,samples:values.length,fps:Math.round(1000/mean),p95:Math.round(p95*10)/10,longFrames:values.filter(ms=>ms>25).length,rating:p95>33?'ciężki':p95>20?'sprawdź':'płynnie'};
}
