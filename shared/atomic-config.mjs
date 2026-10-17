// Idempotent migration of known old instance tuning into named, shared recipes.
// Text overrides with ambiguous old IDs stay local: they cannot safely be guessed.
export const LEGACY_RECIPE_IDS={
 'container-home-stat-icon':['icon-home-target','icon-home-star'],
 'icon-home-stat-symbol':['icon-home-target','icon-home-star']
};
const recipeFor={
 'round-summary-line':'container-result-line','round-summary':'container-result-summary','round-progress':'container-round-progress',
 'result-points-bubble':'result-points-bubble','result-details':'container-result-details',
 'result-title-wrap':'container-result-header','round-mode-pill':'text-result-mode','result-detail-review':'container-result-review',
 'result-stat-toggle-result':'container-result-stat','result-stat-toggle-result-1':'container-result-stat',
 'player-grid':'container-player-grid','player-title':'container-player-title','setup-form':'container-setup-form',
 'wizard-intro':'container-mission','wizard-note':'text-wizard-note',
 'spelling-hint':'button-game-hint',
 'answer-answer':'button-answer','answer-answer-1':'button-answer'
};
export function migrateAtomicConfig(input){
 const c=structuredClone(input);c.elementStyles||={};
 if(c.elementStyles['text-player-subtitle']){c.elementStyles['text-player-copy']={...c.elementStyles['text-player-subtitle'],...c.elementStyles['text-player-copy']};delete c.elementStyles['text-player-subtitle'];}
 const obsolete=['family-player-shell','family-math-settings','family-game-settings','container-player-actions','container-result-actions','button-result-back','container-spelling-question'];
 if(c.elementStyles['container-spelling-question-body']){c.elementStyles['text-spelling-word']={...c.elementStyles['container-spelling-question-body'],...c.elementStyles['text-spelling-word']};delete c.elementStyles['container-spelling-question-body'];}
 for(const id of obsolete)delete c.elementStyles[id];
 const promote=(recipe,row)=>{c.elementStyles[recipe]={...row,...c.elementStyles[recipe]};};
 for(const [old,ids]of Object.entries(LEGACY_RECIPE_IDS))if(c.elementStyles[old]){for(const id of ids)promote(id,c.elementStyles[old]);delete c.elementStyles[old];}
 // Internal icon paths no longer pretend to be separate parts.
 for(const id of ['icon-home-stat-backing'])delete c.elementStyles[id];
 for(const [view,rows]of Object.entries(c.elementOverrides||{}))for(const [id,row]of Object.entries(rows)){
  if(!Object.keys(row).length){delete rows[id];continue;}
  if(id==='primary'&&view.endsWith('-settings')){promote('button-game-start',row);delete rows[id];continue;}
  if(view.endsWith('-settings')&&['spelling-mission-art','english-mission-art','english-mission-boy','img'].includes(id)){
   // One shared frame now owns scale and position. Old artwork corrections are obsolete.
   delete rows[id];continue;
  }
  if(id==='spacer-muwfhj4u'){delete rows[id];continue;}
  const exact={
   'spelling-settings':{h2:'text-mission-title',card:'container-card'},
   'spelling-results':{p:'text-result-subtitle',h1:'text-result-title','result-rays':'icon-result-rays-left','result-rays-1':'icon-result-rays-right',primary:'container-result-continue-rail'},
   players:{h1:'text-player-title',p:'text-player-copy'},
   'player-pin':{'pin-error-outside':'text-pin-error'},
   'spelling-initial':{'question-content':'text-spelling-word'},
   'math-settings':{h1:'text-math-setup-title'}
  }[view]?.[id];
  if(exact){promote(exact,row);delete rows[id];continue;}
  if(view.endsWith('-settings')&&id==='p'&&row.text){const mode=view.split('-')[0];c.familyStyles||={};c.familyStyles[mode]||={};c.familyStyles[mode]['text-mission-hint']={text:row.text.replace(/\s+/g,' ')};delete rows[id];continue;}
  if(['settings','players-empty'].includes(view)&&id==='layout-root'){delete rows[id];continue;}
  if(recipeFor[id]){promote(recipeFor[id],row);delete rows[id];}
 }
 for(const [view,rows]of Object.entries(c.elementOverrides||{}))if(!Object.keys(rows).length)delete c.elementOverrides[view];
 for(const [id,row]of Object.entries(c.elementStyles))if(!Object.keys(row).length)delete c.elementStyles[id];
 return c;
}
