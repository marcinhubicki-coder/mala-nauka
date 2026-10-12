import {structureCatalog} from '../shared/structure-model.mjs';
export const ATOMIC_LEVELS=[
 {id:'atom',name:'Atomy',note:'Samodzielne teksty, ikony i kontrolki. Wewnętrzne ścieżki SVG są częścią atomu.'},
 {id:'molecule',name:'Grupy',note:'Elementy złożone z atomów, np. ikona na kaflu lub etykieta z numerem.'},
 {id:'organism',name:'Rodziny',note:'Sekcje złożone z grup, np. powitanie i postępy lub pięć przygód.'},
 {id:'template',name:'Szablony',note:'Nazwane, uporządkowane sloty sekcji ekranu, wspólne dla jego stanów.'},
 {id:'page',name:'Widoki',note:'Szablon wypełniony treścią i stanem konkretnego scenariusza gry.'}
];
export function atomicCatalog(registry,inventories=new Map()){
 return structureCatalog(registry,inventories).filter(p=>!p.discovered).map(p=>({...p,atomicLevel:({atom:'atom',group:'molecule',family:'organism',template:'template',page:'page'})[p.level]}));
}
