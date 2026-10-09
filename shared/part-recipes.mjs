// Defaults come from the production CSS contracts, never from measured preview DOM.
// Token-based controls resolve their geometry from the same runtime tokens.
export const PART_RECIPES={
 'icon-step-dot':{width:31,height:31,radius:200,fontSize:19,fontRole:'body'},
 'image-player-avatar-art':{width:106,height:106,radius:200},
 'icon-pin-dot':{width:14,height:14,radius:200},
 'input-player-name':{height:52,radius:17,fontSize:18,fontRole:'body',paddingLeft:15,paddingRight:15},
 'control-pin':{radius:22,padding:5,fontSize:16,gap:0},
 'control-pin-key':{height:52,radius:19,fontSize:22},
 'button-avatar-choice':{width:72,height:72,radius:20,padding:5},
 'button-player-card':{height:0,radius:28,gap:14,paddingTop:8,paddingBottom:8,paddingLeft:12,paddingRight:20},
 'text-player-title':{fontRole:'display',fontSize:35},
 'text-nickname':{fontRole:'display',fontSize:32},
 'text-pin-instruction':{fontRole:'body',fontSize:23},
 'text-player-copy':{fontRole:'body',fontSize:16},
 'text-field-label':{fontRole:'ui',fontSize:20},
 'text-nickname-help':{fontRole:'body',fontSize:12},
 'container-player-grid':{gap:13,height:0},
 'container-player-actions':{gap:14,height:0},
 'container-avatar-picker':{gap:8,height:0},
 'container-pin-profile':{gap:16,height:0},
 'container-pin-dots':{gap:13,height:0},
 'container-pin-keypad':{gap:9,height:0},
 'container-field-title':{gap:8,height:0},
 'container-pin-card':{height:0,padding:20,radius:28},
 'container-player-form-card':{height:0,padding:20,radius:28}
};
export function partRecipeDefaults(part,config={},mode='default'){
 const token=group=>({...config.tokens?.[group],...config.familyTokens?.[mode]?.[group]});
 const base={width:0,height:0,padding:0,gap:8,radius:0,fontSize:20,opacity:1,offsetX:0,offsetY:0,margin:0,shadowY:6,shadowBlur:18,shadowOpacity:.12,...PART_RECIPES[part.id]};
 if(part.block){const t=token(part.block);for(const key of ['height','width','radius','fontSize'])if(Number.isFinite(t[key]))base[key]=t[key];if(part.block==='card')Object.assign(base,{paddingTop:t.paddingTop??0,paddingBottom:t.paddingBottom??0,paddingLeft:t.paddingX??0,paddingRight:t.paddingX??0});}
 return base;
}
