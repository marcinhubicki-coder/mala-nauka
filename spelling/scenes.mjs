export const SCENES = new Map([
  ['r_ża', { key:'rose', asset:'rose.webp', layouts:['bubble'] }],
  ['kr_lik', { key:'bunny', asset:'bunny.webp', layouts:['bubble'] }],
  ['g_ry', { key:'mountains', asset:'mountains.webp', layouts:['bubble'] }],
  ['g_ra', { key:'mountains', asset:'mountains.webp', layouts:['bubble'] }],
  ['ż_łw', { key:'turtle', asset:'turtle.avif', layouts:['bubble'] }],
  ['wr_bel', { key:'sparrow', asset:'sparrow.avif', layouts:['bubble'] }],
  ['jask_łka', { key:'swallow', asset:'swallow.avif', layouts:['bubble'] }],
  ['_mury', { key:'clouds', asset:'clouds-review.webp', layouts:['bubble'] }],
  ['kr_l', { key:'king', asset:'krol.avif', layouts:['bubble'] }],
  ['c_rka', { key:'corka', asset:'corka.avif', layouts:['bubble'] }],
  ['w_zek', { key:'wozek', asset:'wozek.avif', layouts:['bubble'] }],
  ['pi_ro', { key:'pioro', asset:'pioro.avif', layouts:['bubble'] }],
  ['_semka', { key:'osemka', asset:'osemka.avif', layouts:['bubble'] }],
  ['_aba', { key:'frog', layouts:['bubble'] }],
  ['samoch_d', { key:'car', layouts:['bubble'] }],
  ['_uragan', { key:'storm', layouts:['bubble'] }],
  ['leka_', { key:'doctor', layouts:['bubble'] }],
  ['g_ebień', { key:'comb', asset:'comb.avif', layouts:['bubble'] }],
  ['sok_ł', { key:'falcon', layouts:['bubble'] }],
]);

export function sceneFor(masked){ return SCENES.get(masked) || null; }
export function chooseLayout(){ return 'bubble'; }
export function sceneUrl(scene){
  if(!scene) return '';
  return new URL(`../assets/scenes/${scene.asset || `${scene.key}.svg`}`, import.meta.url).href;
}
