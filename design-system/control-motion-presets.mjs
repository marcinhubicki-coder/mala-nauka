const preset=(label,description,skinCue,tokens)=>({label,description,skinCue,tokens});

export const CONTROL_MOTION_PRESETS=Object.freeze({
 subtle:preset('Subtelny','Krótki, precyzyjny ruch z małym wychyleniem.','matowe szkło',{
  jelly:{duration:760,stretch:.85,recoil:.3,bounce:.35,inertia:1.45,magnet:1.25,squish:9,tilt:.6,glow:.42,shine:1.15,blur:0,saturation:1,contrast:1,inkDelay:300,inkDuration:300,inkBump:1.08,inkGlow:.35,inkFade:.85,inkBlur:0},
  sliderWrong:{springDuration:300,springOvershoot:1.5,fillDuration:260,completionDelay:190,glowBlur:6,sparkDuration:760},
  sliderResult:{springDuration:300,springOvershoot:1.5,fillDuration:260,completionDelay:260,glowBlur:7,doneDuration:220},
  progress:{duration:2400,easePower:1.55,stretch:.2,bounce:.7,wobble:.06,startKick:.7,flash:.16,finishDuration:620},
  resultText:{settlePercent:70,rollDuration:190,hundredPause:60,hundredStagger:16,hundredRevealDelay:150,kickDuration:160,handoffDelay:90},
 }),
 spring:preset('Sprężysty','Czytelne odbicie i energiczny finał bez utraty kontroli.','błyszcząca guma',{
  jelly:{duration:900,stretch:1.45,recoil:.55,bounce:.75,inertia:2.4,magnet:1.8,squish:15,tilt:1.3,glow:.65,shine:1.5,blur:0,saturation:1,contrast:1,inkDelay:440,inkDuration:430,inkBump:1.25,inkGlow:.65,inkFade:1.1,inkBlur:0},
  sliderWrong:{springDuration:405,springOvershoot:3,fillDuration:350,completionDelay:240,glowBlur:9,sparkDuration:600},
  sliderResult:{springDuration:405,springOvershoot:3,fillDuration:350,completionDelay:350,glowBlur:9,doneDuration:300},
  progress:{duration:3000,easePower:1.829,stretch:.5,bounce:2.1,wobble:.2,startKick:2,flash:.35,finishDuration:950},
  resultText:{settlePercent:76,rollDuration:250,hundredPause:90,hundredStagger:24,hundredRevealDelay:210,kickDuration:220,handoffDelay:120},
 }),
 organic:preset('Organiczny','Wolniejsza, miękka masa z mocniejszym oddechem i asymetrią.','półprzezroczysta kropla',{
  jelly:{duration:1080,stretch:1.9,recoil:.72,bounce:.92,inertia:2.85,magnet:1.55,squish:22,tilt:2.6,glow:.85,shine:1.75,blur:.35,saturation:1.08,contrast:1.04,inkDelay:500,inkDuration:560,inkBump:1.38,inkGlow:.82,inkFade:1.32,inkBlur:.45},
  sliderWrong:{springDuration:560,springOvershoot:5,fillDuration:460,completionDelay:300,glowBlur:13,sparkDuration:820},
  sliderResult:{springDuration:520,springOvershoot:4.5,fillDuration:440,completionDelay:420,glowBlur:14,doneDuration:420},
  progress:{duration:3600,easePower:2.15,stretch:.85,bounce:2.65,wobble:.42,startKick:2.8,flash:.52,finishDuration:1180},
  resultText:{settlePercent:82,rollDuration:340,hundredPause:130,hundredStagger:38,hundredRevealDelay:280,kickDuration:310,handoffDelay:170},
 }),
});

export function controlMotionEntries(id){
 const value=CONTROL_MOTION_PRESETS[id];if(!value)throw Error('Nieznany preset ruchu.');
 return Object.entries(value.tokens).flatMap(([group,fields])=>Object.entries(fields).map(([key,next])=>[`tokens.${group}.${key}`,next]));
}
export function applyControlMotionPreset(tokens,id){
 const result=structuredClone(tokens);
 for(const [path,value]of controlMotionEntries(id)){const [,group,key]=path.split('.');result[group]||={};result[group][key]=value;}
 return result;
}
export function activeControlMotionPreset(tokens){
 for(const [id,presetValue]of Object.entries(CONTROL_MOTION_PRESETS))if(Object.entries(presetValue.tokens).every(([group,fields])=>Object.entries(fields).every(([key,value])=>tokens?.[group]?.[key]===value)))return id;
 return '';
}
