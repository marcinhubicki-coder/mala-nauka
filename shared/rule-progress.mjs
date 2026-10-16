import {ruleLibrary,wordRuleIds} from './rules-library.mjs';
import {ruleGroups} from './rule-groups.mjs';
import {cleanJourney,PROGRESSION_RULES,progressionRules} from './progression.mjs';
export function collectibleRules(words,journey,category){
 const library=ruleLibrary(),cards=journey?.cards||{},rules=progressionRules();
 if(!library)return (category?[category]:[...new Set(words.map(w=>w.category))]).flatMap(c=>ruleGroups(words,c)).map(g=>({...g,id:g.key,discovered:g.words.filter(w=>cards[w.word]).length,total:g.words.length,threshold:Math.min(rules.ruleDiscovery,g.words.length)}));
 return Object.entries(library.rules).filter(([,r])=>!category||r.category===category).flatMap(([id,rule])=>{
  const examples=words.filter(w=>wordRuleIds(library,w.word).includes(id));if(!examples.length)return [];
  const discovered=examples.filter(w=>cards[w.word]).length;
  return [{...rule,id,key:id,words:examples,discovered,total:examples.length,threshold:Math.min(rules.ruleDiscovery,examples.length),collected:discovered>=Math.min(rules.ruleDiscovery,examples.length)}];
 });
}
export function awardRuleProgress(value,words,rules=PROGRESSION_RULES){
 const journey=cleanJourney(value),groups=collectibleRules(words,journey);
 for(const group of groups){
  const entry=journey.rules[group.id]||={};if(group.discovered>=Math.min(rules.ruleDiscovery,group.total))entry.collected=true;
  if(group.discovered===group.total&&!entry.complete){entry.complete=true;journey.sparks+=rules.ruleCompleteBonus*1e6;journey.lifetimeSparks+=rules.ruleCompleteBonus*1e6;}
 }
 return journey;
}
