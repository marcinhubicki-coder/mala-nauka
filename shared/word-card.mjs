import {wordSlots,practiceCategories,questionForWord} from '../spelling/word-pools.mjs';
import {targetId} from './mastery.mjs';
import {progressionRules,starLevel} from './progression.mjs';
import {ruleLibrary,wordRuleIds} from './rules-library.mjs';
import {assetUrl} from './asset-loader.mjs';
import {WORD_BADGE_ASSETS} from './word-badge-assets.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function wordTargets(word){const families=practiceCategories(word);return wordSlots(word).filter(s=>families.includes(s.category));}
// Read-only projection of existing ledgers. Stars remain per word; retention
// remains per spelling target. Neither rewards nor old achievements are changed.
export function wordCardProgress(word,journey={},item=null){
 const rules=progressionRules(),targets=wordTargets(word),correct=journey?.cards?.[word.word]?.correct??item?.correct??0;
 const level=starLevel(correct,rules),starTotal=rules.stars[Math.min(level,2)],mastered=item?.masteryEarned===true;
 const total=Math.max(1,targets.length)*rules.mastery.recallDays;
 const current=mastered?total:targets.reduce((sum,s)=>{const t=item?.targets?.[targetId(s)];return sum+(t?.masteryEarned?rules.mastery.recallDays:Math.min(rules.mastery.recallDays-1,new Set(t?.correctDays||[]).size));},0);
 return {level,correct,starCurrent:Math.min(correct,starTotal),starTotal,mastered,masteryCurrent:current,masteryTotal:total,families:practiceCategories(word),targets:targets.length,spanDays:rules.mastery.spanDays};
}
export function markedWord(word){
 const text=word.word.normalize('NFC'),slots=wordTargets(word).map(s=>({...s,start:s.masked.indexOf('_')})).sort((a,b)=>a.start-b.start);let cursor=0,html='';
 for(const s of slots){if(s.start<cursor)continue;html+=esc(text.slice(cursor,s.start))+`<mark class="word-spelling-mark" data-category="${esc(s.category)}">${esc(text.slice(s.start,s.start+s.answer.length))}</mark>`;cursor=s.start+s.answer.length;}
 return html+esc(text.slice(cursor));
}
export function wordFamiliesMarkup(word){return `<span class="word-families" aria-label="Kategorie pisowni: ${esc(practiceCategories(word).join(', '))}">${practiceCategories(word).map(c=>`<span class="word-family" data-family="${esc(c)}">${esc(c)}</span>`).join('')}</span>`;}
export function wordBadgeMarkup(type,state,{counter=false,imageAttrs='',countAttrs=''}={}){
 const mastery=type==='mastery',earned=mastery?state.mastered:state.level>0,tier=mastery?'mastery':['gold','bronze','silver','gold'][state.level];
 const current=mastery?state.masteryCurrent:state.starCurrent,total=mastery?state.masteryTotal:state.starTotal;
 const label=mastery?`Umiem: ${current}/${total} utrwalonych kroków. Każde miejsce pisowni wymaga poprawnych powtórek w różnych dniach i co najmniej ${state.spanDays} dni.`:`${['Miejsce na gwiazdkę','Brązowa gwiazdka','Srebrna gwiazdka','Złota gwiazdka'][state.level]}: ${current}/${total} poprawnych odpowiedzi.`;
 const art=WORD_BADGE_ASSETS[tier];
 return `<span class="word-badge word-badge-${type} ${earned?'is-earned':'is-empty'}" data-badge="${type}" data-level="${mastery?Number(earned):state.level}" role="img" aria-label="${esc(label)}" title="${esc(label)}"><img class="word-badge-art" data-ds-state="${earned?'earned':'empty'}" ${imageAttrs} src="${esc(assetUrl(art.path))}" width="1254" height="1254" alt="" decoding="async" loading="lazy">${counter?`<span class="word-badge-count" ${countAttrs} aria-hidden="true">${current}/${total}</span>`:''}</span>`;
}
export function wordRules(word){
 const library=ruleLibrary(),assigned=library?wordRuleIds(library,word.word).map(id=>({...library.rules[id],id})):[],rows=[];
 for(const c of practiceCategories(word)){
  const matches=assigned.filter(r=>r.category===c);
  if(matches.length)rows.push(...matches);
  else{const q=questionForWord(word,c,library);if(q?.learning)rows.push({...q.learning,category:c,id:'category-'+c});}
 }
 const seen=new Set();return rows.filter(r=>{const k=r.category+'|'+r.title+'|'+r.explanation;if(seen.has(k))return false;seen.add(k);return true;});
}
