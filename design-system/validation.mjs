// Explicit schema for values that may become CSS or repository paths.
export const FIELDS={
 layout:['canvasWidth','sidePadding','safeTop','safeBottom','sectionGap','headerHeight','headerGap','headerBottom','missionHeight','missionBottom'],
 card:['radius','paddingX','paddingTop','paddingBottom','borderWidth'],
 jelly:['height','radius','inset','labelSize','labelWeight','trackShadowY','trackShadowBlur','trackShadowOpacity','duration','stretch','recoil','bounce','inertia','magnet','squish','tilt','glow','shine','blur','saturation','contrast','inkDelay','inkDuration','inkBump','inkGlow','inkFade','inkBlur'],
 toggle:['width','height','radius','labelSize'],button:['height','radius','fontSize','paddingX','shadowY','shadowBlur','borderWidth'],
 answer:['height','compactHeight','radius','gap','paddingX','fontSize','compactFontSize','widthPercent'],flashcard:['radius','padding','gap'],slider:['height','radius','handleSize','threshold'],
 sliderWrong:['springDuration','springOvershoot','fillDuration','completionDelay','glowBlur','sparkDuration'],sliderResult:['springDuration','springOvershoot','fillDuration','completionDelay','glowBlur','doneDuration'],
 popup:['radius','padding','maxHeightPercent'],progress:['height','radius','duration','easePower','stretch','bounce','wobble','startKick','flash','finishDuration'],resultText:['settlePercent','rollDuration','hundredPause','hundredStagger','hundredRevealDelay','kickDuration','handoffDelay'],profile:['radius','gap','padding','avatarSize'],trophy:['size','gap'],
 space:['xs','sm','md','lg','xl','xxl'],color:['ink','muted','surface','correct','wrong']
};
export const THEME_FIELDS=['accent','light','middle','bottom','border','lip','shine','depth','activeInk','idleInk'];
export const MODES=['spelling','english','flags','reading','math'];
const OPTIONAL_GROUPS=new Set(['sliderWrong','sliderResult','resultText']);
const OPTIONAL_FIELDS=new Set([
 ...['stretch','recoil','bounce','inertia','magnet','squish','tilt','glow','shine','blur','saturation','contrast','inkBump','inkGlow','inkFade','inkBlur'].map(key=>'jelly.'+key),
 ...['easePower','stretch','bounce','wobble','startKick','flash','finishDuration'].map(key=>'progress.'+key),
]);
const DECIMAL_EFFECTS=new Set(['stretch','recoil','bounce','inertia','magnet','tilt','glow','shine','saturation','contrast','inkBump','inkGlow','inkFade','easePower','wobble','startKick','flash']);
export function tokenBounds(group,key){
 let min=0,max=400;
 if(key==='duration')max=5000;
 if(/Duration|Delay/.test(key))max=1500;
 if(DECIMAL_EFFECTS.has(key))max=key==='tilt'?8:key==='startKick'?6:4;
 if(key==='squish')max=40;
 if(['blur','inkBlur','glowBlur'].includes(key))max=30;
 if(key==='springOvershoot')max=15;
 if(key==='labelWeight'){min=400;max=950;}
 if(key==='trackShadowOpacity')max=.5;
 if(key==='canvasWidth'){min=320;max=480;}
 if(group==='jelly'&&key==='height'){min=28;max=96;}
 if(/Percent$/.test(key)){min=50;max=100;}
 if(key==='settlePercent')max=95;
 if(key==='threshold'){min=70;max=100;}
 return[min,max];
}
export function safeKeys(node){
 if(!node||typeof node!=='object'||Array.isArray(node))throw Error('Oczekiwano obiektu konfiguracji.');
 for(const key of Object.keys(node))if(!/^[a-zA-Z0-9_-]+$/.test(key)||['__proto__','constructor','prototype'].includes(key))throw Error('Nieprawidłowy klucz konfiguracji.');
}
export function validateTokens(tokens,partial=false){
 safeKeys(tokens);
 for(const [group,values] of Object.entries(tokens)){
  if(!FIELDS[group])throw Error(`Nieznana grupa: ${group}.`);safeKeys(values);
  for(const [key,value] of Object.entries(values)){
   if(!FIELDS[group].includes(key))throw Error(`Nieznany token: ${group}.${key}.`);
   if(group==='color'){if(!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value))throw Error(`Nieprawidłowy kolor: ${key}.`);continue;}
   const [min,max]=tokenBounds(group,key);
   if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max)throw Error(`Nieprawidłowa wartość: ${group}.${key} (${min}–${max}).`);
  }
  if(!partial&&FIELDS[group].some(key=>values[key]===undefined&&!OPTIONAL_FIELDS.has(group+'.'+key)))throw Error(`Niepełna grupa tokenów: ${group}.`);
 }
 if(!partial&&Object.keys(FIELDS).some(group=>!OPTIONAL_GROUPS.has(group)&&!tokens[group]))throw Error('Brakuje grupy tokenów.');
}
export function validAssetPath(path){return typeof path==='string'&&/^assets\/[a-zA-Z0-9._/-]+$/.test(path)&&!path.split('/').some(part=>part==='.'||part==='..'||!part);}
export function validateAssets(value){
 if(value?.schemaVersion!==1||!Array.isArray(value.assets)||!value.words||!value.aliases)throw Error('Nieprawidłowy rejestr assetów.');
 const paths=new Set();
 for(const asset of value.assets){if(!validAssetPath(asset.path)||paths.has(asset.path)||!/^[0-9a-f]{64}$/.test(asset.sha)||!Number.isFinite(asset.size)||asset.size<0)throw Error('Nieprawidłowy lub powtórzony asset.');paths.add(asset.path);}
 for(const [from,to] of Object.entries(value.aliases))if(!validAssetPath(from)||!paths.has(to)||from===to)throw Error('Nieprawidłowy alias assetu.');
 for(const [word,row] of Object.entries(value.words))if(['__proto__','constructor','prototype'].includes(word)||!paths.has(row.path)||!/^data\/words-0[1-8]\.json$/.test(row.source))throw Error(`Nieprawidłowe przypisanie ilustracji: ${word}.`);
 return value;
}
