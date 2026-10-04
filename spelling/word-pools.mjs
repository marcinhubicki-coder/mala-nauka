import {RULE_CATEGORIES,ruleLibrary} from '../shared/rules-library.mjs';

export const wordKey = word => String(word).normalize('NFC').trim().toLocaleLowerCase('pl');
export const categoryLevel=(record,category)=>record.categoryDifficulties?.[category]??record.difficulty;
const letters = /dzi|dź|rz|ch|ci|si|zi|ni|[uóżhćśźń]/g;
const familyOf = Object.fromEntries(RULE_CATEGORIES.flatMap(category=>category.split('/').map(letter=>[letter,category])));

// A word is the identity. A slot is only the question asked about that word.
export function wordSlots(record) {
  const text=record.word.normalize('NFC');
  const slots=[...text.toLocaleLowerCase('pl').matchAll(letters)].map(match=>({
    category:familyOf[match[0]],answer:match[0],options:familyOf[match[0]].split('/'),
    masked:text.slice(0,match.index)+'_'+text.slice(match.index+match[0].length)
  }));
  // Keep the approved primary exercise (including its particular occurrence).
  const primary=slots.findIndex(slot=>slot.masked===record.masked&&slot.answer===record.answer);
  if(primary>0)slots.unshift(...slots.splice(primary,1));
  return slots;
}
export function canonicalWords(rows) {
  const byWord=new Map();
  for(const row of rows){
    const key=wordKey(row.word),existing=byWord.get(key);
    if(existing){
      if(existing.word!==row.word||existing.difficulty!==row.difficulty||JSON.stringify(existing.categoryDifficulties)!==JSON.stringify(row.categoryDifficulties))throw Error(`Konflikt rekordów słowa „${row.word}”. Sprawdź pisownię i poziom.`);
      continue;
    }
    byWord.set(key,row);
  }
  return [...byWord.values()];
}
export function questionForWord(record,category,library=ruleLibrary()) {
  const slot=wordSlots(record).find(slot=>slot.category===category);
  if(!slot)return null;
  const primary=slot.masked===record.masked&&slot.answer===record.answer;
  const rule=Object.values(library?.rules||{}).find(rule=>rule.category===category&&rule.poolDefault);
  const learning=primary?record.learning:rule?{type:rule.type,title:rule.title,explanation:rule.explanation,examples:[],relatedWords:[],forms:[],sources:[]}:{type:'memory',title:`Pisownia ${category}`,explanation:`Zapamiętaj poprawny zapis słowa „${record.word}”. W zaznaczonym miejscu piszemy ${slot.answer}.`,examples:[],relatedWords:[],forms:[],sources:[]};
  return {...record,...slot,difficulty:categoryLevel(record,category),wordId:wordKey(record.word),families:[...new Set(wordSlots(record).map(row=>row.category))],learning};
}
export function spellingPool(rows,config={},random=Math.random,library=ruleLibrary()) {
  const selected=config.category&&config.category!=='all'?new Set(config.category.split(',')):null;
  return canonicalWords(rows).flatMap(record=>{
    const families=[...new Set(wordSlots(record).map(slot=>slot.category))].filter(category=>(!selected||selected.has(category))&&(!config.difficulty||categoryLevel(record,category)===config.difficulty));
    if(!families.length)return [];
    const category=selected?families[Math.min(families.length-1,Math.floor(random()*families.length))]:families.includes(record.category)?record.category:families[0];
    return [questionForWord(record,category,library)];
  });
}
export function auditWordPools(rows,catalog) {
  const words=canonicalWords(rows),groups=new Map();
  for(const row of rows){const key=wordKey(row.word);groups.set(key,[...(groups.get(key)||[]),row.word]);}
  return {
    entries:rows.length,uniqueWords:words.length,
    duplicates:[...groups].filter(([,items])=>items.length>1).map(([word,items])=>({word,entries:items.length})),
    multipleCategories:words.filter(row=>new Set(wordSlots(row).map(slot=>slot.category)).size>1).length,
    missingAssets:catalog?words.filter(row=>!catalog.words[row.word]).map(row=>row.word):[],
    pools:RULE_CATEGORIES.map(category=>({category,primary:words.filter(row=>row.category===category).length,total:words.filter(row=>wordSlots(row).some(slot=>slot.category===category)).length,basic:words.filter(row=>categoryLevel(row,category)===1&&wordSlots(row).some(slot=>slot.category===category)).length})),
    checkedAt:'build'
  };
}
