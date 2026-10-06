import {DEFAULT_EFFECTS,normalizeEffectsConfig} from '../spelling/effect-model.mjs';
import {validateConfig} from './model.mjs';

export const TEST_PWA_BRANCH='studio/pwa-test';
export function optimizedTestConfig(saved){
 const draft=saved.project?.designDraft||{};
 const config=structuredClone({...saved,...draft});
 const effects=normalizeEffectsConfig(config.effects||DEFAULT_EFFECTS);
 const original={frameRate:effects.bubble.frameRate,transitionBlur:effects.bubble.transitionBlur,transitionSparks:effects.bubble.transitionSparks,particleBudget:effects.particleBudget,ambientSoftness:effects.ambient.softness};
 effects.bubble.frameRate=30;
 effects.bubble.transitionBlur=0;
 effects.bubble.transitionSparks=Math.min(12,effects.bubble.transitionSparks);
 effects.particleBudget=Math.min(24,effects.particleBudget);
 effects.ambient.softness=0;
 config.effects=effects;
 validateConfig(config);
 const hidden=[];
 for(const [family,style] of Object.entries(config.elementStyles||{}))if(['hidden','removed'].includes(style.visibility))hidden.push({scope:'global',family,mode:style.visibility});
 for(const [view,items] of Object.entries(config.elementOverrides||{}))for(const [id,style] of Object.entries(items))if(['hidden','removed'].includes(style.visibility))hidden.push({scope:'view',view,id,mode:style.visibility});
 return {config,report:{kind:'optimized-pwa-test',optimization:'mobile-v1',usesDesignDraft:Boolean(saved.project?.designDraft),original,optimized:{frameRate:effects.bubble.frameRate,transitionBlur:effects.bubble.transitionBlur,transitionSparks:effects.bubble.transitionSparks,particleBudget:effects.particleBudget,ambientSoftness:effects.ambient.softness},hidden}};
}
function replaceOnce(source,a,b){if(source.split(a).length!==2)throw Error('Silnik bańki zmienił się — wstrzymano automatyczną optymalizację.');return source.replace(a,b);}
export function optimizeBubbleSource(source){
 let result=source;
 if(!result.includes('const opticalFiltersEnabled=blur>.01||Math.abs(hue)>.01;')){
  result=replaceOnce(result,'const hue=transitionTuning.hue;','const hue=transitionTuning.hue;\\n    const opticalFiltersEnabled=blur>.01||Math.abs(hue)>.01;');
  for(const key of ['incomingFilter','incomingMidFilter','outgoingFilter','outgoingMidFilter'])
   result=replaceOnce(result,'filter:'+key,'...(opticalFiltersEnabled?{filter:'+key+'}:{})');
  const zero="filter:'blur(0px) hue-rotate(0deg)'";
  if(result.split(zero).length!==3)throw Error('Nieznany format przejścia bez filtrów.');
  result=result.replaceAll(zero,"...(opticalFiltersEnabled?{filter:'none'}:{})");
 }
 if(!result.includes('const paintedContours=')){
  result=replaceOnce(result,'<clipPath id="${id}-clip"><use href="#${id}-shape"/></clipPath>','<clipPath id="${id}-clip"><path class="soap-dynamic-contour"/></clipPath>');
  const oldUse='<use href="#${id}-shape"';
  if(result.split(oldUse).length!==12)throw Error('Nieznana liczba odwołań SVG use: przejrzyj zaktualizowany silnik.');
  result=result.replaceAll(oldUse,'<path data-soap-contour="1"');
  result=replaceOnce(result,'  const shape = host.querySelector(`#${id}-shape`);','  const shape = host.querySelector(`#${id}-shape`);\\n  const paintedContours=[...host.querySelectorAll(\'.soap-dynamic-contour,[data-soap-contour]\')];');
  result=replaceOnce(result,"    shape.setAttribute('d',contour+'Z');","    const nextContour=contour+'Z';\\n    shape.setAttribute('d',nextContour);\\n    for(const path of paintedContours)path.setAttribute('d',nextContour);");
 }
 return result;
}
export function optimizeRuntimeSource(source){
 const target="['design-system/config.json','design-system/assets.json','design-system/rules.json']";
 if(source.split(target).length!==2)throw Error('Zmienił się sposób wczytywania konfiguracji. Przerwano budowanie Test PWA.');
 const replacement="[(document.querySelector('meta[name=mn-pwa-build]')?'design-system/pwa-runtime-config.json':'design-system/config.json'),'design-system/assets.json','design-system/rules.json']";
 return source.replace(target,replacement);
}
export function optimizeIndexHTML(source){if(!source.includes('</head>'))throw Error('Brak nagłówka PWA.');return source.replace('</head>','<link rel="stylesheet" href="pwa-optimized.css">\n<meta name="mn-pwa-build" content="optimized-test">\n</head>');}
export const OPTIMIZED_CSS=`/* Only the optimized Test PWA branch. */
.screen-atmosphere .ambient-finish{-webkit-backdrop-filter:none!important;backdrop-filter:none!important}
@media(max-width:900px){
 .screen-atmosphere .ambient-lens{animation:none!important;will-change:auto!important}
 .screen-atmosphere i{animation-duration:18s!important;will-change:auto!important}
 .soap-star,.soap-satellite{animation-duration:9s!important}
}
`;

// Block promotion of a design revision that would silently discard hidden elements.
export function assertVisibilityReadyForProduction(config){
 const draft=config.project?.designDraft;
 if(!draft)return 0;
 let checked=0;const stale=[];
 for(const [family,row] of Object.entries(draft.elementStyles||{})){
  if(!['visible','hidden','removed'].includes(row.visibility))continue;
  checked++;
  if(config.elementStyles?.[family]?.visibility!==row.visibility)stale.push('global: '+family);
 }
 for(const [view,rows] of Object.entries(draft.elementOverrides||{}))for(const [id,row] of Object.entries(rows)){
  if(!['visible','hidden','removed'].includes(row.visibility))continue;
  checked++;
  if(config.elementOverrides?.[view]?.[id]?.visibility!==row.visibility)stale.push(view+': '+id);
 }
 if(stale.length)throw Error('Publikacja zablokowana: '+stale.length+' ustawień widoczności w Komponentach nie jest zatwierdzonych do produkcji. Zatwierdź projekt i jego aktualny wygląd przed wydaniem. Pierwsze różnice: '+stale.slice(0,3).join(', '));
 return checked;
}
