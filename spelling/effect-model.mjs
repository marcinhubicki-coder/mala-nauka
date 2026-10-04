export const EFFECT_STYLES={spark:'Iskry',star:'Gwiazdy',confetti:'Konfetti',halo:'Aureola',comet:'Komety',petal:'Płatki',orbit:'Orbity',fountain:'Fontanna',diamond:'Diamenty',ripple:'Kręgi'};
export const DEFAULT_EFFECTS={enabled:true,randomize:true,comboEvery:3,comboBoost:1.35,particleBudget:36,
 bubble:{frameRate:24,speed:4.7,amplitude:3.25,orbit:1.35,transitionDuration:1200,transitionBlur:5.3,transitionSparks:18},
 wrong:{duration:440,shake:5,color:'#dd4161'},
 presets:Object.fromEntries(Object.entries(EFFECT_STYLES).map(([id,name],i)=>[id,{name,enabled:true,style:id,particles:[24,18,30,10,18,22,16,28,20,8][i],duration:[850,1050,1100,700,950,1000,1050,900,800,750][i],spread:[82,92,88,66,98,74,85,90,76,60][i],scale:1.08,color:['#ffc82f','#ff4ca0','#52ce9a','#934dff','#4cafff','#ff8bbd','#b49bff','#69d9dc','#ffc82f','#52ce9a'][i]}]))};
const finite=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
export function validateEffects(value){
 if(!value||typeof value.enabled!=='boolean'||typeof value.randomize!=='boolean'||!Number.isInteger(value.comboEvery)||!finite(value.comboEvery,2,12)||!finite(value.comboBoost,1,1.8)||!Number.isInteger(value.particleBudget)||!finite(value.particleBudget,0,48))throw Error('Nieprawidłowy budżet efektów.');
 const b=value.bubble;if(!b||(b.frameRate!==undefined&&![15,24,30].includes(b.frameRate))||!finite(b.speed,2.2,6.6)||!finite(b.amplitude,0,5)||!finite(b.orbit,0,2)||!finite(b.transitionDuration,200,1500)||!finite(b.transitionBlur,0,6)||!Number.isInteger(b.transitionSparks)||!finite(b.transitionSparks,0,24))throw Error('Nieprawidłowe ustawienia bańki.');
 const w=value.wrong;if(!w||!finite(w.duration,100,1000)||!finite(w.shake,0,12)||!/^#[0-9a-f]{6}$/i.test(w.color))throw Error('Nieprawidłowy efekt błędu.');
 if(!value.presets||Array.isArray(value.presets)||Object.keys(value.presets).length!==10)throw Error('Biblioteka powinna zawierać 10 efektów.');
 for(const [id,p]of Object.entries(value.presets))if(!Object.hasOwn(EFFECT_STYLES,id)||!Object.hasOwn(EFFECT_STYLES,p.style)||typeof p.name!=='string'||!p.name.trim()||p.name.length>50||/[<>\u0000-\u001f]/.test(p.name)||typeof p.enabled!=='boolean'||!Number.isInteger(p.particles)||!finite(p.particles,0,48)||!finite(p.duration,200,1400)||!finite(p.spread,20,140)||!finite(p.scale,1,1.18)||!/^#[0-9a-f]{6}$/i.test(p.color))throw Error('Nieprawidłowy efekt odpowiedzi.');
 if(!Object.values(value.presets).some(p=>p.enabled))throw Error('Zostaw co najmniej jeden aktywny efekt lub wyłącz efekty głównym przełącznikiem.');
 return value;
}
export function effectBudget(config,preset,combo=false){
 const requested=Math.round(preset.particles*(combo?config.comboBoost:1));
 const particles=Math.min(config.particleBudget,requested);
 return {particles,requested,capped:particles<requested,duration:preset.duration,load:particles>=36?'średni':'lekki'};
}
export function createEffectPicker(random=Math.random){
 let last='';
 return (config)=>{
  const enabled=Object.entries(config.presets).filter(([,p])=>p.enabled);
  const candidates=config.randomize&&enabled.length>1?enabled.filter(([id])=>id!==last):enabled;
  const [id,preset]=candidates[config.randomize?Math.min(candidates.length-1,Math.floor(random()*candidates.length)):0]||Object.entries(DEFAULT_EFFECTS.presets)[0];
  last=id;return {id,preset};
 };
}
export function frameStats(intervals){
 const values=intervals.filter(v=>Number.isFinite(v)&&v>0).sort((a,b)=>a-b);
 if(values.length<8)return {ready:false,samples:values.length};
 const mean=values.reduce((a,b)=>a+b,0)/values.length,p95=values[Math.min(values.length-1,Math.ceil(values.length*.95)-1)];
 return {ready:true,samples:values.length,fps:Math.round(1000/mean),p95:Math.round(p95*10)/10,longFrames:values.filter(ms=>ms>25).length,rating:p95>33?'ciężki':p95>20?'sprawdź':'płynnie'};
}
