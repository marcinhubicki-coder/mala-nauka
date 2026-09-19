export const SCENES = new Map([
  ['r_ża', { key:'rose', asset:'rose.webp', position:'center 50%', layouts:['bubble'] }],
  ['kr_lik', { key:'bunny', asset:'bunny.webp', position:'center 44%', layouts:['bubble'] }],
  ['g_ry', { key:'mountains', asset:'mountains.webp', position:'center 44%', layouts:['bubble'] }],
  ['g_ra', { key:'mountains', asset:'mountains.webp', position:'center 44%', layouts:['bubble'] }],
  ['ż_łw', { key:'turtle', asset:'turtle.avif', position:'center 48%', layouts:['bubble'] }],
  ['wr_bel', { key:'sparrow', asset:'sparrow.avif', position:'center 48%', layouts:['bubble'] }],
  ['jask_łka', { key:'swallow', asset:'swallow.avif', position:'center 48%', layouts:['bubble'] }],
  ['_mury', { key:'clouds', asset:'clouds-review.webp', position:'center 46%', layouts:['bubble'] }],
  ['kr_l', { key:'king', asset:'castle-review.webp', position:'center 44%', layouts:['bubble'] }],
  ['_aba', { key:'frog', layouts:['bubble'] }],
  ['samoch_d', { key:'car', layouts:['bubble'] }],
  ['_uragan', { key:'storm', layouts:['bubble'] }],
  ['leka_', { key:'doctor', layouts:['bubble'] }],
  ['g_ebień', { key:'comb', asset:'comb.avif', position:'center 50%', layouts:['bubble'] }],
  ['sok_ł', { key:'falcon', layouts:['bubble'] }],
]);

export function sceneFor(masked){ return SCENES.get(masked) || null; }
export function chooseLayout(){ return 'bubble'; }
export function sceneUrl(scene){
  if(!scene) return '';
  return `assets/scenes/${scene.asset || `${scene.key}.svg`}`;
}
