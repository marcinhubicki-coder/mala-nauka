export const SCENES = new Map([
  ['r_ża', { key:'rose', asset:'rose.webp', position:'center 52%', layouts:['bubble'] }],
  ['kr_lik', { key:'bunny', asset:'bunny-bubble.webp', position:'center center', layouts:['bubble'] }],
  ['g_ry', { key:'mountains', asset:'mountains.webp', position:'center 46%', layouts:['bubble'] }],
  ['g_ra', { key:'mountains', asset:'mountains.webp', position:'center 46%', layouts:['bubble'] }],
  ['_mury', { key:'clouds', layouts:['bubble'] }],
  ['_aba', { key:'frog', layouts:['bubble'] }],
  ['samoch_d', { key:'car', layouts:['bubble'] }],
  ['_uragan', { key:'storm', layouts:['bubble'] }],
  ['leka_', { key:'doctor', layouts:['bubble'] }],
  ['g_ebień', { key:'vanity', layouts:['bubble'] }],
  ['kr_l', { key:'king', layouts:['bubble'] }],
  ['sok_ł', { key:'falcon', layouts:['bubble'] }],
]);

export function sceneFor(masked){
  return SCENES.get(masked) || null;
}

export function chooseLayout(){
  return 'bubble';
}

export function sceneUrl(scene){
  if(!scene) return '';
  return `assets/scenes/${scene.asset || `${scene.key}.svg`}`;
}
