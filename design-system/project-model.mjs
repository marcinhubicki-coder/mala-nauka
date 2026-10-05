import {DISCOVERY_RULES,validateDiscoveryRules} from '../shared/discovery-model.mjs';
import {validateBlueprint} from '../shared/component-recipes.mjs';
import {validateTokens} from './validation.mjs';
const DESIGN_FIELDS=['typography','tokens','themes','overrides','recipes','motion','effects','scoring','elementStyles','elementOverrides'];
export const designFields=config=>Object.fromEntries(DESIGN_FIELDS.filter(k=>config[k]!==undefined).map(k=>[k,structuredClone(config[k])]));
export function editableProjectConfig(config){return {...structuredClone(config),...structuredClone(config.project?.designDraft||{})};}
export function projectContract(local,committed){
  if(!local.project)return structuredClone(local);
  const result=structuredClone(local),p=result.project;p.designDraft=designFields(local);
  const release=p.releases.find(r=>r.id===p.activeRelease);
  const published=release&&p.activeRelease!==committed.project?.activeRelease;
  if(published){if(release.status!=='published')throw Error('Najpierw zatwierdź pilot.');approveRelease(release);if(release.fingerprint!==fingerprint(release.snapshot))throw Error('Wersja testowa zmieniła się. Zapisz nową wersję i powtórz kontrolę.');}
  const design=published?release.snapshot.design:committed;
  for(const k of DESIGN_FIELDS){if(design[k]!==undefined)result[k]=structuredClone(design[k]);else delete result[k];}
  if(published)result.copyOverrides=structuredClone(release.snapshot.copy);
  else if(committed.copyOverrides)result.copyOverrides=structuredClone(committed.copyOverrides);
  else delete result.copyOverrides;
  return result;
}
export const PROJECT_TABS={plan:'Plan',screens:'Ekrany i flow',copy:'Teksty',learning:'Postępy i nagrody',test:'Test i dane',release:'Wersje i wydanie'};
export const ELEMENT_TYPES={title:'Tytuł',subtitle:'Podtytuł',hint:'Podpowiedź',numberText:'Numer + tekst',button:'Przycisk jelly',jelly:'Jelly · opcje',image:'Ilustracja',progress:'Postęp',stats:'Wyniki',map:'Mapa odkryć',trophies:'Puchary',blueprint:'Element z buildera'};
export const ACTIONS={none:'Bez akcji',navigate:'Otwórz ekran',reveal:'Odkryj fragment',skin:'Wybierz skórkę',answer:'Odpowiedz poprawnie',wrong:'Odpowiedz błędnie'};
export const TRIGGERS={memory:'Punkt pamięci',trophy:'Nowy puchar',combo:'Bonus combo',correct:'Poprawna odpowiedź',wrong:'Pomyłka'};
export const projectTriggers=p=>p.triggers||{memory:p.screens.some(s=>s.id==='memory-reward')?'memory-reward':''};
export function triggerTarget(p,events,answerKind){const links=projectTriggers(p),kind=['memory','trophy','combo',answerKind].find(k=>k&&links[k]&&(events.some(e=>e.kind===k)||k===answerKind));return links[kind]||'';}
function validateTriggers(p){if(p.triggers&&(typeof p.triggers!=='object'||Array.isArray(p.triggers)||Object.entries(p.triggers).some(([k,v])=>!TRIGGERS[k]||(v!==''&&!id(v)))))throw Error('Sprawdź ekrany przypisane do zdarzeń.');}
export function optionAction(e,i){const a=e.optionActions?.[i];return a&&a.kind!=='inherit'?a:e.action;}
export function screenActions(s){return s.elements.flatMap(e=>e.type==='jelly'?e.options.map((text,i)=>({...optionAction(e,i),text,condition:e.condition})):[{...e.action,text:e.text,condition:e.condition}]).filter(a=>a.kind!=='none');}
const id=v=>typeof v==='string'&&/^[a-z][a-z0-9-]{0,79}$/.test(v);
const text=(v,max=600)=>typeof v==='string'&&v.length<=max&&!/[<>\u0000-\u001f]/.test(v);
const int=(v,min,max)=>Number.isInteger(v)&&v>=min&&v<=max;
const asset=v=>/^assets\/[a-zA-Z0-9_./-]+\.(png|jpe?g|webp|avif|svg)$/.test(v)&&!v.split('/').includes('..');
export const newId=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
export function safeProject(value){
  const scan=(v,depth=0)=>{if(depth>20)throw Error('Projekt jest zbyt zagnieżdżony.');if(v&&typeof v==='object')for(const[k,n]of Object.entries(v)){if(['__proto__','prototype','constructor'].includes(k))throw Error('Niebezpieczny klucz projektu.');scan(n,depth+1);}};scan(value);
  if(JSON.stringify(value).length>1500000)throw Error('Projekt przekracza 1,5 MB. Usuń stare próbne wersje.');
}
export function validateScreen(s){
  if(!id(s?.id)||!text(s.name,80)||!s.name.trim()||!['spelling','english','flags','reading','math'].includes(s.mode)||!int(s.padding,0,48)||!int(s.gap,0,40))throw Error('Sprawdź nazwę, tryb i odstępy ekranu.');
  if(s.asset&&!asset(s.asset))throw Error('Wybierz ilustrację z katalogu.');
  if(!Array.isArray(s.elements)||s.elements.length>32)throw Error('Ekran mieści do 32 elementów.');const ids=new Set();
  for(const e of s.elements){
    if(!id(e.id)||ids.has(e.id)||!ELEMENT_TYPES[e.type]||!text(e.text)||!int(e.height,0,240)||!int(e.width,0,390)||!int(e.padding,0,48)||!int(e.gap,0,40)||!['visible','hidden','removed'].includes(e.visibility)||!['initial','correct','wrong','disabled'].includes(e.state))throw Error('Sprawdź wymiary, stan i treść elementu.');ids.add(e.id);
    if(!ACTIONS[e.action?.kind]||!text(e.action.target||'',80)||!text(e.action.value||'',160)||!['always','has-memory','no-memory','all-map','has-trophy'].includes(e.condition))throw Error('Sprawdź funkcję i warunek elementu.');
    if(e.type==='jelly'&&(!Array.isArray(e.options)||e.options.length<2||e.options.length>4||e.options.some(v=>!text(v,40)||!v.trim())))throw Error('Jelly wymaga od 2 do 4 nazw opcji.');
    if(e.optionActions&&(!Array.isArray(e.optionActions)||e.type!=='jelly'||e.optionActions.length!==e.options.length||e.optionActions.some(a=>!a||(!ACTIONS[a.kind]&&a.kind!=='inherit')||!text(a.target||'',80)||!text(a.value||'',160))))throw Error('Sprawdź funkcje opcji jelly.');
    if(e.asset&&!asset(e.asset))throw Error('Wybierz asset z katalogu.');
    if(e.blueprint)validateBlueprint(e.blueprint);
  }
  return s;
}
export function validateCopy(rows){
  if(!Array.isArray(rows)||rows.length>200)throw Error('Zapisz do 200 zmian tekstu.');const ids=new Set();
  for(const r of rows){if(!id(r.viewId)||!id(r.id)||ids.has(r.viewId+':'+r.id)||!['h1','h2','h3','p','span','button','label','legend','strong'].includes(r.tag)||!text(r.original)||!r.original.trim()||!text(r.text))throw Error('Nieprawidłowe przypisanie tekstu.');ids.add(r.viewId+':'+r.id);}
  return rows;
}
export function validateSnapshot(v){
  if(!v||!text(v.name,80)||!Array.isArray(v.screens)||v.screens.length>20||!id(v.entry))throw Error('Sprawdź zestaw ekranów i ekran początkowy.');
  const ids=new Set();for(const s of v.screens){validateScreen(s);if(ids.has(s.id))throw Error('Powtórzony ekran.');ids.add(s.id);}if(!ids.has(v.entry))throw Error('Brak ekranu początkowego.');
  validateDiscoveryRules(v.rules);validateCopy(v.copy||[]);validateTriggers(v);return v;
}
export function validateProject(p){
  safeProject(p);if(p?.schemaVersion!==1||!id(p.id)||!text(p.name,80)||!Array.isArray(p.tasks)||p.tasks.length>60||!Array.isArray(p.screens)||p.screens.length>20||!Array.isArray(p.releases)||p.releases.length>16)throw Error('Nieprawidłowy projekt.');
  validateDiscoveryRules(p.rules);validateCopy(p.copy);validateTriggers(p);const ids=new Set();for(const s of p.screens){validateScreen(s);if(ids.has(s.id))throw Error('Powtórzony ekran.');ids.add(s.id);}
  if(!/^\d{4}-\d{2}-\d{2}$/.test(p.startDate)||!Number.isFinite(Date.parse(p.startDate))||!(p.targetDate===''||/^\d{4}-\d{2}-\d{2}$/.test(p.targetDate)))throw Error('Wybierz daty projektu.');
  if(p.designDraft){if(Object.keys(p.designDraft).some(k=>!DESIGN_FIELDS.includes(k)))throw Error('Nieprawidłowe pola szkicu wyglądu.');validateTokens(p.designDraft.tokens);}
  const taskIds=new Set();for(const t of p.tasks){if(!id(t.id)||taskIds.has(t.id)||!text(t.title,120)||!t.title.trim()||!['critical','high','normal','later'].includes(t.priority)||!['todo','doing','review','done'].includes(t.status)||!int(t.days,1,30)||!Array.isArray(t.depends)||t.depends.length>20||t.depends.some(v=>!id(v))||t.depends.includes(t.id)||!text(t.screen||'',80)||!(t.deadline===''||/^\d{4}-\d{2}-\d{2}$/.test(t.deadline)))throw Error('Sprawdź zadanie, termin i zależności.');taskIds.add(t.id);}
  if(p.tasks.some(t=>t.depends.some(d=>!taskIds.has(d))))throw Error('Zależność wskazuje usunięte zadanie.');
  const releases=new Set();for(const r of p.releases){if(!id(r.id)||releases.has(r.id)||!text(r.name,80)||!Number.isFinite(Date.parse(r.at))||!['test','approved','published'].includes(r.status))throw Error('Sprawdź wersję testową.');releases.add(r.id);validateSnapshot(r.snapshot);if(r.fingerprint!==fingerprint(r.snapshot))throw Error('Treść zapisanej wersji uległa zmianie. Zapisz nową próbę.');if(!r.checks||['flow','learning','content','mobile'].some(k=>typeof r.checks[k]!=='boolean')||Object.keys(r.checks).length!==4)throw Error('Wersja wymaga czterech kontroli.');if(!Array.isArray(r.reviews)||r.reviews.length>60||r.reviews.some(c=>!text(c.text,1200)||!['open','addressed'].includes(c.status)))throw Error('Sprawdź listę uwag.');if(r.status==='approved')approveRelease(r);}
  if(p.activeRelease&&!p.releases.some(r=>r.id===p.activeRelease&&r.status==='published'))throw Error('Wydanie musi wskazywać zatwierdzoną wersję.');
  return p;
}
export function emptyProject(){return {schemaVersion:1,id:'next-phase',name:'Następny etap Małej Nauki',startDate:'2026-10-05',targetDate:'',entry:'',tasks:[],screens:[],copy:[],rules:structuredClone(DISCOVERY_RULES),releases:[],activeRelease:null};}
export function newElement(type='button'){
  if(!ELEMENT_TYPES[type])throw Error('Wybierz komponent.');return {id:newId('element'),type,text:({title:'Małe odkrycia',subtitle:'Każdy mały krok pomaga.',hint:'Pomyłki są częścią nauki.',numberText:'1 · Wybierz przygodę',button:'Dalej',jelly:'Wybierz świat'})[type]||ELEMENT_TYPES[type],height:0,width:0,padding:0,gap:12,visibility:'visible',state:'initial',condition:'always',action:{kind:'none',target:'',value:''},options:type==='jelly'?['Las','Ocean','Kosmos']:[],asset:''};
}
export function newScreen(name='Nowy ekran'){return {id:newId('screen'),name,mode:'spelling',padding:20,gap:16,asset:'',elements:[newElement('title'),newElement('subtitle'),newElement('button')]};}
export function discoveryProject(){
  const p=emptyProject();p.name='Wyspa małych odkrywców';
  const setup=newScreen('Wybierz przygodę'),reward=newScreen('Punkt pamięci'),map=newScreen('Mapa odkryć'),progress=newScreen('Moje małe kroki');
  setup.id='discovery-start';reward.id='memory-reward';map.id='discovery-map';progress.id='discovery-progress';
  const element=(type,text,kind='none',target='')=>({...newElement(type),text,action:{kind,target,value:''}});
  setup.elements=[element('title','Małe odkrycia'),element('subtitle','Ćwicz w swoim tempie. Każdy powrót pomaga.'),element('jelly','Wybierz świat','skin'),element('button','Zobacz swoje kroki','navigate',progress.id),element('button','Otwórz mapę','navigate',map.id)];
  reward.elements=[element('title','Mały krok, nowe odkrycie!'),element('subtitle','{memoryEvery} samodzielnych odpowiedzi otwiera kolejny fragment.'),element('stats','Punkt pamięci'),element('button','Odkryj mapę','navigate',map.id),element('button','Ćwiczę dalej','navigate',setup.id)];
  map.elements=[element('title','Twoja mapa odkryć'),element('subtitle','Odkrywaj po kawałku. Nic nie znika po pomyłce.'),element('map','Mapa'),element('button','Odkryj fragment','reveal'),element('button','Moje postępy','navigate',progress.id)];map.elements[3].condition='has-memory';
  progress.elements=[element('title','Twoje małe kroki'),element('stats','Postępy'),element('progress','Do kolejnego punktu pamięci'),element('trophies','Twoje puchary'),element('button','Wracam do przygody','navigate',setup.id)];
  p.screens=[setup,reward,map,progress];p.entry=setup.id;
  const tasks=[['Zasady punktu pamięci',2,'critical'],['Ekran nagrody',2,'high'],['Mapa i skórki',3,'high'],['Test 6 → 7 odpowiedzi',1,'critical'],['Uwagi i poprawki',2,'normal'],['Zatwierdzenie pilota',1,'critical']];
  p.tasks=tasks.map(([title,days,priority],i)=>({id:'task-'+i,title,days,priority,status:'todo',deadline:'',screen:[progress.id,reward.id,map.id,reward.id,'',setup.id][i],depends:i===0?[]:i===1||i===2?['task-0']:i===3?['task-1','task-2']:['task-'+(i-1)]}));
  return validateProject(p);
}
export function projectSnapshot(p,config){return {name:p.name,entry:p.entry,screens:structuredClone(p.screens),triggers:structuredClone(projectTriggers(p)),rules:structuredClone(p.rules),copy:structuredClone(p.copy),design:{schemaVersion:config.schemaVersion,revision:config.revision,...designFields(config)}};}
export function fingerprint(value){let h=2166136261;const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;for(const c of JSON.stringify(canonical(value))){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
const addDays=(date,n)=>new Date(Date.parse(date+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
export function planSchedule(p){
  const rows=new Map(p.tasks.map(t=>[t.id,t])),visiting=new Set(),memo=new Map(),errors=[];
  const visit=key=>{if(memo.has(key))return memo.get(key);if(visiting.has(key)){errors.push('Zależności tworzą pętlę.');return {start:0,end:0,path:[]};}visiting.add(key);const t=rows.get(key);let best={end:0,path:[]};for(const d of t.depends){const v=visit(d);if(v.end>best.end)best=v;}const v={start:best.end,end:best.end+(t.status==='done'?0:t.days),path:[...best.path,key]};visiting.delete(key);memo.set(key,v);return v;};
  for(const id of rows.keys())visit(id);const last=[...memo.values()].sort((a,b)=>b.end-a.end)[0]||{end:0,path:[]};
  return {days:last.end,end:addDays(p.startDate,last.end),critical:last.path,errors:[...new Set(errors)],rows:p.tasks.map(t=>({...t,...memo.get(t.id),estimatedEnd:addDays(p.startDate,memo.get(t.id).end),blocked:t.depends.some(d=>rows.get(d).status!=='done'),late:Boolean(t.deadline&&addDays(p.startDate,memo.get(t.id).end)>t.deadline)}))};
}
export function projectIssues(p,assets){
  const issues=[];const add=(level,text,screen='')=>issues.push({level,text,screen});const ids=new Set(p.screens.map(s=>s.id));
  if(!p.screens.length)add('error','Dodaj przynajmniej jeden ekran.');if(!ids.has(p.entry))add('error','Wybierz ekran początkowy.');
  for(const e of planSchedule(p).errors)add('error',e);
  const known=new Set(assets?.assets?.map(a=>a.path)||[]);
  const referenced=new Set([p.entry]);
  for(const s of p.screens)for(const a of screenActions(s))if(a.kind==='navigate'){referenced.add(a.target);if(!ids.has(a.target))add('error',`${s.name}: „${a.text}” nie ma ekranu docelowego.`,s.id);}
  for(const s of p.screens){for(const e of s.elements){if(e.action.kind==='navigate'){referenced.add(e.action.target);if(!ids.has(e.action.target))add('error',`${s.name}: „${e.text}” nie ma ekranu docelowego.`,s.id);}if(['button','jelly'].includes(e.type)&&e.action.kind==='none'&&!e.optionActions?.some(a=>a.kind!=='none'&&a.kind!=='inherit'))add('warning',`${s.name}: „${e.text}” nie ma jeszcze funkcji.`,s.id);if(e.asset&&assets&&!known.has(e.asset)&&!assets.aliases?.[e.asset])add('error',`${s.name}: ilustracja nie występuje w katalogu.`,s.id);}if(s.asset&&assets&&!known.has(s.asset)&&!assets.aliases?.[s.asset])add('error',`${s.name}: brak ilustracji tła.`,s.id);}
  for(const[k,target]of Object.entries(projectTriggers(p)))if(target&&!ids.has(target))add('error',`${TRIGGERS[k]}: brak ekranu zdarzenia.`);
  const reachable=new Set([p.entry,...Object.values(projectTriggers(p))]);let changed=true;while(changed){changed=false;for(const s of p.screens.filter(s=>reachable.has(s.id)))for(const a of screenActions(s))if(a.kind==='navigate'&&ids.has(a.target)&&!reachable.has(a.target)){reachable.add(a.target);changed=true;}}
  for(const s of p.screens)if(!reachable.has(s.id))add('warning',`${s.name}: ekran nie jest osiągalny z początku ani nagrody.`,s.id);
  if(p.rules.comboBonus>0)add('info','Combo wpływa na wynik rundy, nigdy na opanowanie materiału.');
  for(const s of planSchedule(p).rows)if(s.late)add('warning',`${s.title}: termin jest krótszy od obecnego planu.`);
  if(p.targetDate&&planSchedule(p).end>p.targetDate)add('warning','Ścieżka krytyczna kończy się po terminie etapu.');
  return issues;
}
export function makeRelease(p,config,name='Wersja testowa',assets){
  const snapshot=projectSnapshot(p,config);validateSnapshot(snapshot);
  if(projectIssues(p,assets).some(i=>i.level==='error'))throw Error('Najpierw usuń blokujące problemy w walidacji.');
  return {id:newId('release'),name,at:new Date().toISOString(),status:'test',fingerprint:fingerprint(snapshot),snapshot,reviews:[],checks:{flow:false,learning:false,content:false,mobile:false}};
}
export function approveRelease(release){
  if(['flow','learning','content','mobile'].some(k=>release.checks?.[k]!==true)||release.reviews.some(r=>r.status==='open'))throw Error('Zakończ cztery kontrole i rozwiąż otwarte uwagi.');return {...release,status:'approved'};
}
export function publishRelease(p,id){const r=p.releases.find(r=>r.id===id);if(!r||!['approved','published'].includes(r.status))throw Error('Najpierw zatwierdź wersję testową.');return {...p,activeRelease:id,releases:p.releases.map(r=>r.id===id?{...r,status:'published'}:r)};}
