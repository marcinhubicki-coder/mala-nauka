import{campaignPool,cleanAdventure}from'./adventure-model.mjs';
import{createSource}from'../modes.mjs';
// Both launch and coverage verification consume this exact source selection.
export function campaignRoundSource(step,config,words,journey,random=Math.random){
 const rows=campaignPool(step,words),covered=new Set(cleanAdventure(journey?.adventure).campaign.coverage[step.id]||[]),remaining=rows.filter(r=>!covered.has(r.key)),keys=new Set((remaining.length?remaining:rows).map(r=>r.key)),sourceConfig={...config,maxValue:step.maxValue};
 let pool=words;if(step.mode==='spelling')pool=words.filter(w=>keys.has(w.word));if(step.mode==='flags')sourceConfig.campaignIds=[...keys];let source=createSource(step.mode,sourceConfig,pool,random);
 if(Array.isArray(source)&&step.mode!=='spelling'){
  if(step.mode==='reading')source=[1,2,3].flatMap(d=>createSource('reading',{...sourceConfig,difficulty:d},pool,random));
  source=source.filter(q=>keys.has(q.learningKey||q.word||q.full||q.text));
 }
 return source;
}
