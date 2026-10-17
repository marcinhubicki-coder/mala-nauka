// Results contain attempts, so the same word may legitimately occur twice.
// Keep the established word key for single occurrences. Repeated records use
// their persisted timestamp/ID; old examples without either use log occurrence.
export function identifyResultAttempts(attempts){
 const totals=new Map(),occurrences=new Map(),used=new Set();
 for(const attempt of attempts)totals.set(attempt.word,(totals.get(attempt.word)||0)+1);
 return attempts.map(attempt=>{
  const occurrence=(occurrences.get(attempt.word)||0)+1;occurrences.set(attempt.word,occurrence);
  let resultKey=String(attempt.word);
  if(totals.get(attempt.word)>1)resultKey+='|'+(attempt.id||attempt.at||'attempt-'+occurrence);
  if(used.has(resultKey))resultKey+='|attempt-'+occurrence;
  used.add(resultKey);return {...attempt,resultKey};
 });
}
