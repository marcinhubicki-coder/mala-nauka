// Shared, code-backed vocabulary for the library, view map and element inspector.
// Palettes are independent of families: a family is a complete view.
export const ATOMS={
 title:{name:'Tytuł ekranu',selector:'.page-head h1,.player-title h1',parents:['layout','profile','card'],role:'display',size:25,weight:700},
 subtitle:{name:'Podtytuł',selector:'.wizard-intro p,.result-subtitle,.player-title p',parents:['layout','card','profile'],role:'body',size:16,weight:600},
 section:{name:'Nagłówek sekcji',selector:'.rule-explanation h3,.progress-section-title',parents:['card','popup'],role:'ui',size:20,weight:800},
 numberText:{name:'Etykieta sekcji (tekst)',selector:'fieldset legend,.field-title',parents:['card'],role:'ui',size:20,weight:800},
 emphasis:{name:'Wyróżnik',selector:'.result-word,.collection-word-name',parents:['flashcard','card'],role:'display',size:24,weight:700},
 hint:{name:'Podpowiedź / treść zasady',selector:'.rule-explanation>p,.spelling-hint-description',parents:['popup','flashcard'],role:'body',size:17,weight:600},
 popupHeading:{name:'Nagłówek popupu',selector:'.result-rule-dialog h2,.spelling-hint-sheet h2,.pause-dialog h2',parents:['popup'],role:'display',size:24,weight:700},
 buttonLabel:{name:'Etykieta przycisku',selector:'.start-button,.player-continue,.result .primary,.math-start-button,.math-result-again',parents:['button'],role:'ui',size:24,weight:800}
};
const atom=(id,name,kind,selector,extra={})=>({id,name,kind,selector,level:'atom',children:[],...extra});
const group=(id,name,selector,children,extra={})=>({id,name,kind:'container',selector,children,level:'group',...extra});
export const PARTS=[
 atom('container-card','Kafel / podkład','container','.setup-card,.settings-card,.card',{block:'card'}),
 atom('icon-step-dot','Numer w kółku','icon','.step-dot'),
 atom('image-player-brand-art','Logo Małej Nauki','image','.player-brand-art',{asset:'assets/brand/player-logo-3d.webp'}),
 atom('image-player-empty-art','Ilustracja pierwszego gracza','image','.player-empty-art img',{asset:'assets/brand/player-empty-3d.webp'}),
 atom('image-player-avatar-art','Avatar gracza','image','.player-avatar-art'),
 atom('image-mission','Ilustracja misji','image','.spelling-mission-art,.english-mission-art,.reading-mission-art'),
 atom('image-mn-soap-picture','Zdjęcie w bańce','image','.mn-production-photo,.mn-soap-picture'),
 atom('image-home-logo-art','Logo na ekranie startowym','image','.home-logo-art'),
 atom('background-home-art-backdrop','Tło ekranu','background','.home-art-backdrop,.spelling-art-layer,.spelling-screen-bg'),
 atom('control-jelly','Przełącznik jelly','toggle','.ds-jelly:not(.pin-mode),.jelly-v4-container:not(.pin-mode)',{block:'jelly'}),
 group('control-pin','PIN / bez PIN-u','.pin-mode',['control-jelly','pin-option'],{kind:'toggle',inherits:'control-jelly',sample:'pin'}),
 atom('control-toggle','Przełącznik czasu / słów','toggle','.compact-toggle',{block:'toggle'}),
 atom('jelly-option','Opcja jelly','text','.jelly-v4-label:not(.pin-mode>label),.category-card,.math-duration-choice'),
 atom('pin-option','Opcja PIN','text','.pin-mode label',{inherits:'jelly-option'}),
 atom('control-pin-key','Klawisz klawiatury PIN','key','.pin-key',{inherits:'button-main',sample:'key'}),
 atom('icon-pin-dot','Cyfra PIN · wskaźnik','icon','.pin-dots>span'),
 atom('input-player-name','Pole imienia','input','.player-name-input',{sample:'input'}),
 atom('button-main','Przycisk główny','button','.primary,.start-button,.player-continue,.math-start-button',{block:'button'}),
 atom('button-answer','Odpowiedź','button','.answer,.math-answer',{block:'answer'}),
 group('button-avatar-choice','Wybór avatara','.avatar-choice',['container-card','image-player-avatar-art'],{kind:'button',inherits:'button-main'}),
 group('button-player-card','Karta wyboru gracza','.player-card',['container-card','image-player-avatar-art','text-nickname','icon-player-select'],{kind:'button',sample:'player'}),
 atom('icon-player-select','Znacznik wybranego gracza','icon','.player-select-mark'),
 group('button-home-card','Kafel trybu gry','[data-action=choose-mode]',['container-card','image-mission','text-mode-name'],{kind:'button'}),
 atom('text-mode-name','Nazwa trybu gry','text','.home-tile-name'),
 atom('button-home-progress','Przycisk wyników','button','.home-progress-arrow',{inherits:'button-main'}),
 atom('button-back','Powrót','button','[data-action=players],[data-action=edit-player],[data-action=home]'),
 atom('text-player-title','Tytuł wyboru gracza','text','.player-title h1'),
 atom('text-nickname','Imię gracza','text','.player-card strong,.pin-profile h2'),
 atom('text-pin-instruction','Instrukcja PIN','text','.pin-instruction'),
 atom('text-player-copy','Opis profilu','text','.player-title p,.player-form-card>p,.pin-fields>p'),
 atom('text-field-label','Etykieta pola','text','label[for=player-nickname],.avatar-label'),
 atom('text-nickname-help','Opis poprawności imienia','text','.nickname-help'),
 atom('result-points-bubble','Bańka punktów','container','.result-points-bubble'),
 group('container-player-title','Powitanie gracza','.player-title',['text-player-title','text-player-copy']),
 group('container-player-grid','Lista graczy','.player-grid',['button-player-card']),
 group('container-player-actions','Akcje wyboru gracza','.player-actions',['button-main','button-back']),
 group('container-player-form-card','Formularz nowego gracza','.player-form-card',['container-card','image-player-avatar-art','input-player-name','text-field-label','text-nickname-help','container-avatar-picker','button-main']),
 group('container-avatar-picker','Lista avatarów','.avatar-picker',['button-avatar-choice','image-player-avatar-art']),
 group('container-pin-profile','Profil nad PIN-em','.pin-profile',['image-player-avatar-art','text-nickname']),
 group('container-pin-dots','Wpisane cyfry PIN','.pin-dots',['icon-pin-dot']),
 group('container-pin-keypad','Klawiatura PIN','.pin-keypad',['control-pin-key']),
 group('container-pin-fields','PIN / informacja bez PIN-u','.pin-fields',['text-pin-instruction','text-player-copy','container-pin-dots','container-pin-keypad','button-main']),
 group('container-pin-card','Kafel ustawienia PIN-u','.pin-card',['container-card','container-pin-profile','control-pin','container-pin-fields']),
 group('container-field-title','Numer + tekst','.field-title,fieldset legend',['icon-step-dot','text-field-label']),
 group('container-mission','Kafel misji','.wizard-intro',['container-card','image-mission','text-player-copy']),
 group('container-result-continue-rail','Slider akcji','.result-continue-rail,.spelling-continue-rail',['container-card','icon-continue-handle','text-continue-copy'],{block:'slider'}),
 atom('icon-continue-handle','Uchwyt slidera','icon','.continue-handle'),
 atom('text-continue-copy','Etykieta slidera','text','.continue-copy'),
 group('container-round-progress','Postęp','.round-progress,.math-round-progress',['container-card','meter-round-progress-fill','text-progress-value'],{block:'progress'}),
 atom('meter-round-progress-fill','Wypełnienie postępu','meter','.round-progress-fill'),
 atom('text-progress-value','Wartość postępu','text','[data-reel=percent]')
];
export const PART_BY_ID=Object.fromEntries(PARTS.map(p=>[p.id,p]));
export function recipeLineage(id){const chain=[],seen=new Set();while(id&&!seen.has(id)){seen.add(id);chain.unshift(id);id=PART_BY_ID[id]?.inherits;}return chain;}
export const LEVEL_NAMES={atom:'Atom',group:'Grupa',family:'Rodzina · widok'};
const types={login:['image-player-brand-art','image-player-empty-art','container-player-title','container-player-grid','container-player-actions'],create:['button-back','container-player-form-card'],pin:['button-back','container-pin-card'],profile:['container-pin-profile','container-avatar-picker','control-pin','button-main'],home:['background-home-art-backdrop','image-home-logo-art','button-home-progress','button-home-card'],settings:['button-back','container-mission','container-card','container-field-title','control-jelly','control-toggle','button-main'],game:['background-home-art-backdrop','image-mn-soap-picture','button-answer','container-round-progress'],results:['background-home-art-backdrop','image-mission','result-points-bubble','container-card','container-round-progress','container-result-continue-rail','button-home-progress','button-back'],progress:['button-back','container-card','container-round-progress']};
export function viewType(view){const s=view?.screen||view?.id||'';return s==='players'?'login':s==='player-create'?'create':s==='player-pin'?'pin':s==='home'?'home':s==='settings'?'profile':s==='wizard'||view?.id?.endsWith('-settings')?'settings':s==='results'?'results':s==='game'?'game':'progress';}
export function partLevel(item,items=[]){return PART_BY_ID[item.recipe]?.level||(items.some(n=>n.parent===item.id)?'group':'atom');}
export function viewParts(view,inventory){
 const items=inventory?.items||[];
 if(items.length){const ids=new Set(items.map(n=>n.id));return items.filter(n=>n.id!=='layout-root'&&(!n.parent||n.parent==='layout-root'||!ids.has(n.parent))).map(n=>inventoryPart(n,items));}
 return (types[viewType(view)]||[]).map(id=>definitionPart(id));
}
function definitionPart(id,seen=new Set()){const p=PART_BY_ID[id];if(!p||seen.has(id))return null;const next=new Set(seen).add(id);return {...p,recipe:p.id,children:p.children.map(child=>definitionPart(child,next)).filter(Boolean)};}
function inventoryPart(item,items,seen=new Set()){if(seen.has(item.id))return null;const next=new Set(seen).add(item.id),meta=PART_BY_ID[item.recipe];return {id:item.id,recipe:item.recipe||item.kind||'container',name:meta?.name||item.label,kind:item.kind,level:partLevel(item,items),selector:`[data-ds-element="${item.id}"]`,children:items.filter(n=>n.parent===item.id).map(n=>inventoryPart(n,items,next)).filter(Boolean)};}
export function structureCatalog(registry,inventories=new Map()){
 const records=new Map(PARTS.map(p=>[p.id,{...p,children:[...p.children],uses:[]} ]));
 const add=(p,view)=>{let record=records.get(p.recipe);if(!record){record={id:p.recipe,name:p.name,recipe:p.recipe,kind:p.kind,selector:p.selector,level:p.level,children:[],uses:[]};records.set(p.recipe,record);}if(!record.uses.some(u=>u.view===view.id))record.uses.push({view:view.id,selector:p.selector});for(const child of p.children){if(record.level!=='atom'&&!record.children.includes(child.recipe))record.children.push(child.recipe);add(child,view);}};
 for(const view of registry.views)for(const p of viewParts(view,inventories.get(view.id)))add(p,view);
 const textAtoms=Object.entries(ATOMS).map(([id,a])=>({id:'text-role-'+id,name:a.name,atom:id,kind:'text',level:'atom',selector:a.selector,children:[],uses:registry.views.filter(v=>a.parents.some(p=>v.components.includes(p))).map(v=>({view:v.id,selector:a.selector}))}));
 return [...records.values(),...textAtoms,...registry.views.map(view=>({id:'view:'+view.id,name:view.name,level:'family',view:view.id,children:viewParts(view,inventories.get(view.id)).map(p=>p.recipe),uses:[{view:view.id}]}))];
}
export function selectionStack(view,selected,items){if(!selected)return[];const chain=[],seen=new Set();let item=items.find(n=>n.id===selected.id)||selected;while(item&&!seen.has(item.id)){seen.add(item.id);if(item.id!=='layout-root')chain.unshift({...item,level:partLevel(item,items)});item=items.find(n=>n.id===item.parent);}return [{id:'view:'+view.id,label:view.name,level:'family'},...chain];}
