import {structureCatalog} from '../shared/structure-model.mjs';
export const ATOMIC_LEVELS=[
 {id:'atom',name:'Atomy',note:'Najmniejsze samodzielne elementy: tekst, ikona, pole, przycisk.'},
 {id:'molecule',name:'Molekuły',note:'Prosta grupa elementów wykonująca jedno zadanie, np. numer i etykieta.'},
 {id:'organism',name:'Organizmy',note:'Większa sekcja złożona z elementów i grup, np. formularz gracza.'},
 {id:'template',name:'Szablony',note:'Struktura ekranu niezależna od konkretnego stanu i treści. Tu: grupy widoków o tym samym trybie i ekranie.'},
 {id:'page',name:'Strony',note:'Konkretne ekrany ze stanem i treścią, służące weryfikacji całości.'}
];
// A non-destructive adapter keeps saved recipes and overrides compatible.
// Classification describes composition, not the legacy editor's level labels.
export function atomicCatalog(registry,inventories=new Map()){
 const parts=structureCatalog(registry,inventories).filter(p=>p.level!=='family'),byId=new Map(parts.map(p=>[p.id,p]));
 const classify=(p,seen=new Set())=>{if(!p.children.length)return 'atom';if(seen.has(p.id))return 'organism';const next=new Set(seen).add(p.id);return p.children.some(id=>byId.has(id)&&classify(byId.get(id),next)!=='atom')?'organism':'molecule';};
 const records=parts.map(p=>({...p,atomicLevel:classify(p),legacyLevel:p.level}));
 const templates=new Map();
 for(const v of registry.views){const id=`template:${v.mode||'shared'}:${v.screen||v.id}`;if(!templates.has(id))templates.set(id,{id,name:`${v.mode||'Wspólne'} · ${v.screen||v.name}`,atomicLevel:'template',children:[],uses:[]});const t=templates.get(id);t.children.push('view:'+v.id);t.uses.push({view:v.id});records.push({id:'view:'+v.id,name:v.name,atomicLevel:'page',template:id,view:v.id,children:[],uses:[{view:v.id}]});}
 return [...records,...templates.values()];
}
