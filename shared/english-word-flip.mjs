export const DEFAULT_ENGLISH_WORD_FLIP=Object.freeze({
 duration:760,
 perspective:760,
 depth:48,
 rotation:180,
 midScale:.94,
 swapPoint:50,
 easingPreset:1,
 direction:0,
 pauseDuration:45,
 settleDuration:180,
 motionBlur:1.5
});

export const ENGLISH_WORD_FLIP_EASINGS=Object.freeze([
 {value:0,label:'Łagodne',css:'ease-in-out'},
 {value:1,label:'Sprężyste',css:'cubic-bezier(.22,.82,.28,1)'},
 {value:2,label:'Szybki start',css:'cubic-bezier(.12,.78,.22,1)'},
 {value:3,label:'Równe',css:'linear'}
]);

export const ENGLISH_WORD_FLIP_DIRECTIONS=Object.freeze([
 {value:0,label:'Naprzemiennie'},
 {value:1,label:'W lewo'},
 {value:2,label:'W prawo'}
]);

const clamp=(value,min,max)=>Math.min(max,Math.max(min,Number(value)));

export function englishWordFlipConfig(design=globalThis.__MALA_NAUKA_DESIGN__){
 const value={...DEFAULT_ENGLISH_WORD_FLIP,...design?.tokens?.englishWordFlip};
 value.duration=clamp(value.duration,250,1600);
 value.perspective=clamp(value.perspective,250,1600);
 value.depth=clamp(value.depth,0,180);
 value.rotation=clamp(value.rotation,45,360);
 value.midScale=clamp(value.midScale,.8,1.1);
 value.swapPoint=clamp(value.swapPoint,30,70);
 value.easingPreset=Math.round(clamp(value.easingPreset,0,3));
 value.direction=Math.round(clamp(value.direction,0,2));
 value.pauseDuration=clamp(value.pauseDuration,0,400);
 value.settleDuration=clamp(value.settleDuration,0,600);
 value.motionBlur=clamp(value.motionBlur,0,12);
 return value;
}

export function englishWordFlipEasing(value){
 const index=Math.round(Number(value?.easingPreset??value??1));
 return ENGLISH_WORD_FLIP_EASINGS.find(row=>row.value===index)?.css||ENGLISH_WORD_FLIP_EASINGS[1].css;
}

export function englishWordFlipDirection(value,sequence=0){
 const mode=Math.round(Number(value?.direction??value??0));
 if(mode===1)return -1;
 if(mode===2)return 1;
 return Number(sequence)%2===0?1:-1;
}
