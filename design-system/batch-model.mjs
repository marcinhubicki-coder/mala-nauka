import {RULE_CATEGORIES,orthographyFamilies} from '../shared/rules-library.mjs';
import {wordKey,wordSlots,practiceCategories} from '../spelling/word-pools.mjs';

export const EMPTY_BATCHES={schemaVersion:1,targetPerCategory:100,batches:[]};
const validWord=word=>typeof word==='string'&&/^[a-ząćęłńóśźż][a-ząćęłńóśźż-]{1,47}$/.test(word)&&!word.includes('--')&&!word.endsWith('-');
export const candidateId=word=>'word-'+[...wordKey(word)].map(c=>c.codePointAt(0).toString(16)).join('-');
const validCategorySubset=row=>{const detected=orthographyFamilies(row.word);return Array.isArray(row.categories)&&row.categories.length>0&&new Set(row.categories).size===row.categories.length&&row.categories.every(c=>detected.includes(c))&&JSON.stringify(row.categories)===JSON.stringify(detected.filter(c=>row.categories.includes(c)));};
export function createCandidate(text,{difficulty=1}={}){
 const word=wordKey(text),categories=orthographyFamilies(word);
 if(!validWord(word)||!categories.length)throw Error('Wpisz pojedyncze słowo z co najmniej jedną ćwiczoną grupą liter.');
 if(![1,2].includes(difficulty))throw Error('Wybierz poziom podstawowy lub trudny.');
 return {id:candidateId(word),word,categories,levels:Object.fromEntries(categories.map(c=>[c,difficulty])),selected:true,assetPath:null};
}
export const batchWords=batches=>batches.batches.flatMap(batch=>batch.words);
export function validateBatches(value){
 if(value?.schemaVersion!==1||value.targetPerCategory!==100||!Array.isArray(value.batches)||value.batches.length>100)throw Error('Nieprawidłowa kolejka batchy.');
 const ids=new Set(),words=new Set();
 for(const batch of value.batches){
  if(!/^[a-z0-9-]{1,70}$/.test(batch.id)||ids.has(batch.id)||typeof batch.name!=='string'||!batch.name.trim()||batch.name.length>100||/[<>\u0000-\u001f]/.test(batch.name)||!['proposed','images','published'].includes(batch.stage)||!Array.isArray(batch.words)||!batch.words.length||batch.words.length>60)throw Error('Nieprawidłowy batch.');
  ids.add(batch.id);
  for(const row of batch.words){
   const key=wordKey(row.word);
   if(!validWord(row.word)||key!==row.word||words.has(key)||row.id!==candidateId(row.word)||typeof row.selected!=='boolean'||!validCategorySubset(row)||!row.levels||JSON.stringify(Object.keys(row.levels))!==JSON.stringify(row.categories)||row.categories.some(c=>![1,2].includes(row.levels[c]))||row.assetPath!==null&&!/^assets\/[a-zA-Z0-9._/-]+$/.test(row.assetPath)||row.assetPath?.split('/').some(p=>p==='..'||p==='.'||!p))throw Error(`Nieprawidłowe hasło w batchu: ${row.word}.`);
   words.add(key);
  }
 }
 return value;
}
export function addCandidates(value,texts,activeWords,{name='Nowa grupa',id='batch-'+Date.now()}={}){
 const known=new Set([...activeWords.map(r=>wordKey(r.word)),...batchWords(value).map(r=>wordKey(r.word))]),rows=[],rejected=[];
 for(const text of texts){try{const row=createCandidate(text);if(known.has(row.word))throw Error('To słowo jest już w bazie lub kolejce.');known.add(row.word);rows.push(row);}catch(e){rejected.push({word:String(text),reason:e.message});}}
 const next=structuredClone(value);if(rows.length>60)throw Error('Podziel import na grupy po najwyżej 60 słów.');
 if(rows.length)next.batches.push({id,name,stage:'proposed',words:rows});
 return {value:validateBatches(next),added:rows.length,rejected};
}
export function candidateProblems(row,catalog,activeWords=[]){
 const problems=[];
 if(activeWords.some(w=>wordKey(w.word)===row.word))problems.push('Słowo jest już w grze.');
 if(!validCategorySubset(row))problems.push('Kategorie nie są poprawnym, uporządkowanym podzbiorem pisowni.');
 if(row.categories.some(c=>![1,2].includes(row.levels[c])))problems.push('Uzupełnij poziom każdej kategorii.');
 const path=catalog.aliases?.[row.assetPath]||row.assetPath,asset=catalog.assets.find(a=>a.path===path);
 if(!asset)problems.push('Dodaj lub wybierz ilustrację.');
 else if(!['scenes','managed'].includes(asset.group)||!asset.width||!asset.height||Math.abs(asset.width/asset.height-1)>.04)problems.push('Wybierz kwadratową ilustrację słowa.');
 return problems;
}
export function batchSummary(value,activeWords){
 const keys=new Set(activeWords.map(r=>wordKey(r.word)));
 const pending=batchWords(value).filter(r=>r.selected&&!keys.has(r.word));
 return RULE_CATEGORIES.map(category=>{const active=activeWords.filter(r=>practiceCategories(r).includes(category)).length,proposed=pending.filter(r=>r.categories.includes(category)).length;return {category,active,proposed,total:active+proposed,remaining:Math.max(0,100-active-proposed)};});
}
export function publicationPlan(batch,catalog,activeWords,library){
 if(batch.stage!=='images')throw Error('Najpierw zatwierdź listę słów w tym batchu.');
 const selected=batch.words.filter(r=>r.selected);if(!selected.length)throw Error('Zaznacz co najmniej jedno słowo.');
 const defaults=Object.entries(library.rules).filter(([,r])=>r.poolDefault),records=[],assignments={};
 for(const row of selected){
  const errors=candidateProblems(row,catalog,activeWords);if(errors.length)throw Error(`${row.word}: ${errors.join(' ')}`);
  const category=row.categories[0],slot=wordSlots({word:row.word}).find(s=>s.category===category),primary=defaults.find(([,r])=>r.category===category);
  if(!primary)throw Error(`Brakuje wspólnej zasady dla ${category}.`);
  const rule=primary[1];
  records.push({word:row.word,...slot,difficulty:row.levels[category],categoryDifficulties:{...row.levels},practiceCategories:[...row.categories],learning:{type:rule.type,title:rule.title,explanation:rule.explanation,examples:[],relatedWords:[],forms:[],sources:[]}});
  assignments[row.word]={primary:primary[0],additional:defaults.filter(([id,r])=>id!==primary[0]&&row.categories.includes(r.category)).map(([id])=>id),families:[...row.categories]};
 }
 return {records,assignments};
}
// New words cannot bypass the final group review through the generic Git save.
export function validatePublication(batches,catalog,edits){
 if(batches)validateBatches(batches);
 for(const edit of edits){
  const known=new Set((edit.baseValue||[]).map(r=>wordKey(r.word)));
  for(const word of edit.value){if(known.has(wordKey(word.word)))continue;
   const batch=batches?.batches.find(b=>b.stage==='published'&&b.words.some(r=>r.selected&&r.word===word.word));
   const row=batch?.words.find(r=>r.word===word.word),path=catalog.words[word.word]?.path;
   const slot=row&&wordSlots({word:row.word}).find(s=>s.category===word.category&&s.masked===word.masked&&s.answer===word.answer);
   if(!slot||word.difficulty!==row.levels[word.category]||JSON.stringify(word.practiceCategories)!==JSON.stringify(row.categories))throw Error(`Sprawdź pisownię i dozwolone kategorie hasła „${word.word}”.`);
   if(!row||candidateProblems(row,catalog).length||path!==(catalog.aliases?.[row.assetPath]||row.assetPath)||JSON.stringify(word.categoryDifficulties)!==JSON.stringify(row.levels))throw Error(`Hasło „${word.word}” wymaga końcowej akceptacji batcha z ilustracją i poziomami.`);
  }
 }
}

export function matchBatchImage(filename,batch){
 const stem=wordKey(filename.replace(/\.[^.]+$/,'')),rows=batch.words.filter(r=>r.selected);
 const exact=rows.filter(r=>r.word===stem);if(exact.length===1)return exact[0];
 const fold=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l');
 const matches=rows.filter(r=>fold(r.word)===fold(stem));
 if(matches.length!==1)throw Error(matches.length?'Nazwa pasuje do kilku słów. Użyj polskich znaków.':'Nazwa pliku nie pasuje do zaznaczonego hasła.');
 return matches[0];
}

export function requeueRejected(value,id,newId='batch-'+Date.now()){
 const next=structuredClone(value),batch=next.batches.find(b=>b.id===id);
 if(batch?.stage!=='published')throw Error('Najpierw zaakceptuj gotową część batcha.');
 const rejected=batch.words.filter(r=>!r.selected);if(!rejected.length)throw Error('W tym batchu nie ma odłożonych haseł.');
 batch.words=batch.words.filter(r=>r.selected);
 next.batches.push({id:newId,name:batch.name.slice(0,75)+' · ponowna ocena',stage:'proposed',words:rejected.map(r=>({...r,selected:true}))});
 return validateBatches(next);
}
