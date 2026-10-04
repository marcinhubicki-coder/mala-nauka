// One shared explanation per rule; word-specific examples stay in the word bank.
export const RULE_CATEGORIES=['u/ó','rz/ż','ch/h','ć/ci','ś/si','ź/zi','ń/ni','dź/dzi'];
const reserved=new Set(['__proto__','constructor','prototype']);
export function orthographyFamilies(word){
  const text=String(word).normalize('NFC').toLocaleLowerCase('pl');
  return RULE_CATEGORIES.filter((_,index)=>[/[uó]/,/rz|ż/,/ch|h/,/ć|ci/,/ś|si/,/ź|zi/,/ń|ni/,/dź|dzi/][index].test(text));
}
export function validateRules(value){
  if(value?.schemaVersion!==1||!Number.isInteger(value.revision)||value.revision<1||!value.rules||!value.assignments)throw Error('Nieprawidłowa biblioteka zasad.');
  for(const [id,rule]of Object.entries(value.rules)){
    if(!/^rule-[a-f0-9]{12}$/.test(id)||!RULE_CATEGORIES.includes(rule.category)||!['exchange','pattern','exception','memory'].includes(rule.type)||typeof rule.edited!=='boolean')throw Error('Nieprawidłowa zasada.');
    for(const [key,max]of [['title',120],['explanation',600]])if(typeof rule[key]!=='string'||!rule[key].trim()||rule[key].length>max||/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(rule[key]))throw Error('Uzupełnij poprawną nazwę i treść zasady (do 600 znaków).');
  }
  for(const [word,row]of Object.entries(value.assignments)){
    if(reserved.has(word)||!word.trim()||word.length>80||!Object.hasOwn(value.rules,row.primary)||!Array.isArray(row.additional)||row.additional.some(id=>!Object.hasOwn(value.rules,id)||id===row.primary)||new Set(row.additional).size!==row.additional.length||!Array.isArray(row.families)||row.families.some(family=>!RULE_CATEGORIES.includes(family)))throw Error(`Nieprawidłowe powiązania zasady: ${word}.`);
  }
  return value;
}
export function wordRuleIds(library,word){const row=library.assignments[word];return row?[row.primary,...row.additional]:[];}
export function wordsForRule(library,id){return Object.keys(library.assignments).filter(word=>wordRuleIds(library,word).includes(id));}
export function applyRules(words,library){
  if(!library)return words;
  return words.map(word=>{
    const rule=library.rules[library.assignments[word.word]?.primary];
    if(!rule?.edited||!word.learning)return word;
    return {...word,learning:{...word.learning,type:rule.type,title:rule.title,explanation:rule.explanation}};
  });
}
let current;
export function configureRules(value){current=validateRules(value);}
export const ruleLibrary=()=>current;
export const resolveRules=words=>applyRules(words,current);
