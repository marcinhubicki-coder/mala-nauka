import {DEFAULT_EFFECTS,normalizeEffectsConfig} from '../spelling/effect-model.mjs';
import {validateConfig} from './model.mjs';

export const TEST_PWA_BRANCH='studio/pwa-test';
export function optimizedTestConfig(saved){
 const draft=saved.project?.designDraft||{};
 const config=structuredClone({...saved,...draft});
 const effects=normalizeEffectsConfig(config.effects||DEFAULT_EFFECTS);
 const original={frameRate:effects.bubble.frameRate,transitionBlur:effects.bubble.transitionBlur,transitionSparks:effects.bubble.transitionSparks,particleBudget:effects.particleBudget,ambientSoftness:effects.ambient.softness};
 effects.bubble.frameRate=15;
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
 let result=replaceOnce(source,'const hue=transitionTuning.hue;','const hue=transitionTuning.hue;\n    const opticalFiltersEnabled=blur>.01||Math.abs(hue)>.01;');
 for(const key of ['incomingFilter','incomingMidFilter','outgoingMidFilter','outgoingFilter'])result=replaceOnce(result,'filter:'+key,'...(opticalFiltersEnabled?{filter:'+key+'}:{})');
 const zero="filter:'blur(0px) hue-rotate(0deg)'";
 if(result.split(zero).length!==3)throw Error('Nieznany format przejścia bez filtrów.');
 return result.replaceAll(zero,"...(opticalFiltersEnabled?{filter:'none'}:{})");
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
