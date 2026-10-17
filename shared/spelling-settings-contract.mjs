// Declarative identities for actual spelling setup controls. Studio and PWA
// use the same names; no DOM shape hashing is necessary for these components.
const rows=[
 ['back','button-back','button','layout-root','atom'],
 ['page-title','text-player-title','text','layout-root','atom'],
 ['mission','container-mission','container','layout-root','group'],
 ['note','text-wizard-note','text','layout-root','atom'],
 ['start','button-game-start','button','layout-root','atom'],
 ['scope-section','group-spelling-scope','container','layout-root','group'],
 ['scope-jelly','control-jelly','toggle','scope-section','group'],
 ...['all','categories','dictation'].map(x=>['scope-'+x,'jelly-option','text','scope-jelly','atom']),
 ['level-section','group-spelling-level','container','layout-root','group'],
 ['level-jelly','control-jelly','toggle','level-section','group'],
 ...[0,1,2].map(x=>['level-'+x,'jelly-option','text','level-jelly','atom']),
 ['round-section','group-spelling-round','container','layout-root','group'],
 ['limit-jelly','control-jelly','toggle','round-section','group'],
 ...['time','count'].map(x=>['limit-'+x,'jelly-option','text','limit-jelly','atom']),
 ['time-jelly','control-jelly','toggle','round-section','group'],
 ...[60,120,180,300].map(x=>['duration-'+x,'jelly-option','text','time-jelly','atom']),
 ['count-jelly','control-jelly','toggle','round-section','group'],
 ...[10,20,40,80].map(x=>['word-limit-'+x,'jelly-option','text','count-jelly','atom'])
];
export const SPELLING_SETTINGS_CONTRACT=Object.freeze(Object.fromEntries(rows.map(([suffix,recipe,kind,parent,level])=>['spelling-'+suffix,Object.freeze({id:'spelling-'+suffix,recipe,kind,parent:parent==='layout-root'?'layout-root':'spelling-'+parent,level,mode:'spelling'})])));
export function validateSpellingSettingsContract(){
 const nodes=Object.values(SPELLING_SETTINGS_CONTRACT);
 for(const row of nodes){
  if(!/^[a-z0-9-]+$/.test(row.id)||!row.recipe||!row.kind)throw Error('Invalid spelling settings ID');
  if(row.parent!=='layout-root'&&!Object.hasOwn(SPELLING_SETTINGS_CONTRACT,row.parent))throw Error('Missing spelling parent: '+row.id);
  if(row.level==='atom'&&nodes.some(child=>child.parent===row.id))throw Error('Atom has children: '+row.id);
 }
 if(nodes.length!==29)throw Error('Incomplete spelling contract: '+nodes.length);
 return true;
}
export function spellingAttrs(suffix){
 const row=SPELLING_SETTINGS_CONTRACT['spelling-'+suffix];
 if(!row)throw Error('Unknown spelling component: '+suffix);
 return 'data-ds-key="'+row.id+'" data-ds-contract="v2" data-ds-element="'+row.id+'" data-ds-block="block-'+row.recipe+'" data-ds-recipe="'+row.recipe+'" data-ds-kind="'+row.kind+'" data-ds-mode="spelling" data-ds-state="default"';
}
