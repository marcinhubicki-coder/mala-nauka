// Atoms own text rhythm. Existing component families keep surfaces and interaction.
export const ATOMS={
 title:{name:'Tytuł ekranu',selector:'.page-head h1,.player-title h1',parents:['layout','profile','card'],role:'display',size:25,weight:700},
 subtitle:{name:'Podtytuł',selector:'.wizard-intro p,.result-subtitle,.player-title p',parents:['layout','card','profile'],role:'body',size:16,weight:600},
 section:{name:'Nagłówek sekcji',selector:'.rule-explanation h3,.progress-section-title',parents:['card','popup'],role:'ui',size:20,weight:800},
 numberText:{name:'Numer + tekst',selector:'fieldset legend,.field-title',parents:['card'],role:'ui',size:20,weight:800},
 emphasis:{name:'Wyróżnik',selector:'.result-word,.collection-word-name',parents:['flashcard','card'],role:'display',size:24,weight:700},
 hint:{name:'Podpowiedź / treść zasady',selector:'.rule-explanation>p,.spelling-hint-description',parents:['popup','flashcard'],role:'body',size:17,weight:600},
 popupHeading:{name:'Nagłówek popupu',selector:'.result-rule-dialog h2,.spelling-hint-sheet h2,.pause-dialog h2',parents:['popup'],role:'display',size:24,weight:700},
 buttonLabel:{name:'Etykieta przycisku',selector:'.start-button,.player-continue,.result .primary,.math-start-button,.math-result-again',parents:['button'],role:'ui',size:24,weight:800}
};
export const DEFAULT_RECIPES=Object.fromEntries(Object.entries(ATOMS).map(([id,a])=>[id,{enabled:false,size:a.size,weight:a.weight,lineHeight:1.2,gap:8,padding:0,role:a.role}]));
const number=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
export function validateRecipes(value){
 if(!value||Array.isArray(value)||Object.keys(value).length!==Object.keys(ATOMS).length)throw Error('Niepełne przepisy atomów.');
 for(const [id,r]of Object.entries(value))if(!Object.hasOwn(ATOMS,id)||!r||typeof r.enabled!=='boolean'||!number(r.size,10,48)||!number(r.weight,300,900)||!number(r.lineHeight,1,2)||!number(r.gap,0,40)||!number(r.padding,0,24)||!['body','ui','display','flag'].includes(r.role)||Object.keys(r).some(k=>!['enabled','size','weight','lineHeight','gap','padding','role'].includes(k)))throw Error('Nieprawidłowy przepis atomu.');
 return value;
}
export function recipeStyle(r,unit='1px'){
 return `font-family:var(--ds-font-${r.role});font-size:calc(${r.size} * ${unit});font-weight:${r.weight};line-height:${r.lineHeight};gap:calc(${r.gap} * ${unit});padding:calc(${r.padding} * ${unit});`;
}
export function recipesCSS(value){
 if(!value)return '';validateRecipes(value);
 return Object.entries(value).filter(([,r])=>r.enabled).map(([id,r])=>`#app[data-ds] :is(${ATOMS[id].selector}){${recipeStyle(r,'var(--ds-u,1px)').replaceAll(';','!important;')}}`).join('');
}
export function atomViews(id,registry){return registry.views.filter(v=>v.components.some(p=>ATOMS[id]?.parents.includes(p)));}
const TYPES=['canvas','surface','group','button',...Object.keys(ATOMS)];
export function validateBlueprint(value){
 if(!value||!/^blueprint-[a-z0-9-]{1,70}$/.test(value.id)||typeof value.name!=='string'||!value.name.trim()||value.name.length>60||/[<>\u0000-\u001f]/.test(value.name))throw Error('Nadaj elementowi nazwę.');
 const ids=new Set();let total=0;
 const walk=(node,depth)=>{
  if(!node||depth>4||++total>24||!/^node-[a-z0-9-]{1,60}$/.test(node.id)||ids.has(node.id)||!TYPES.includes(node.type)||typeof node.text!=='string'||node.text.length>140||!['visible','reserve','reflow'].includes(node.visibility)||!number(node.width,0,390)||!number(node.height,0,500)||!number(node.padding,0,40)||!number(node.gap,0,40)||!Array.isArray(node.children)||Object.keys(node).some(k=>!['id','type','text','visibility','width','height','padding','gap','children'].includes(k)))throw Error('Nieprawidłowa warstwa elementu.');
  ids.add(node.id);if(!['canvas','surface','group','button'].includes(node.type)&&node.children.length)throw Error('Atom nie może zawierać innych warstw.');node.children.forEach(n=>walk(n,depth+1));
 };
 walk(value.root,0);if(value.root.type!=='canvas')throw Error('Element musi mieć płótno.');return value;
}
export function validateBlueprints(value){if(!Array.isArray(value)||value.length>40)throw Error('Zapisz do 40 próbnych elementów.');const ids=new Set();for(const row of value){validateBlueprint(row);if(ids.has(row.id))throw Error('Powtórzona nazwa techniczna elementu.');ids.add(row.id);}return value;}
const node=(type,text,children=[])=>({id:'node-'+type.toLowerCase()+'-'+Math.random().toString(36).slice(2,9),type,text,visibility:'visible',width:0,height:0,padding:['surface','canvas'].includes(type)?16:0,gap:12,children});
export function blueprintTemplate(type='card'){
 let inner;
 if(type==='popup')inner=node('surface','Popup',[node('popupHeading','Mała podpowiedź'),node('hint','Przyjrzyj się zapisowi słowa. Każdy krok pomaga.'),node('button','Rozumiem',[node('buttonLabel','Rozumiem')])]);
 else if(type==='flashcard')inner=node('surface','Fiszka',[node('emphasis','brzuch'),node('subtitle','Jedno hasło · trzy kategorie'),node('button','Sprawdź odpowiedź',[node('buttonLabel','Sprawdź odpowiedź')])]);
 else if(type==='button')inner=node('button','Zaczynamy!',[node('buttonLabel','Zaczynamy!')]);
 else inner=node('surface','Kafel',[node('numberText','1 · Co ćwiczymy?'),node('title','Małe odkrycia'),node('subtitle','Wybierz kategorię i ruszamy.'),node('button','Zaczynamy!',[node('buttonLabel','Zaczynamy!')])]);
 return {id:'blueprint-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),name:type==='popup'?'Próbny popup':type==='flashcard'?'Próbna fiszka':type==='button'?'Próbny przycisk':'Próbny kafel',root:node('canvas','Płótno',[inner])};
}
export const flattenBlueprint=root=>[root,...root.children.flatMap(flattenBlueprint)];
export function newLayer(type){if(!TYPES.includes(type)||type==='canvas')throw Error('Wybierz typ warstwy.');return node(type,ATOMS[type]?.name||(type==='button'?'Przycisk':type==='surface'?'Podkład':'Sekcja'),type==='button'?[node('buttonLabel','Zaczynamy!')]:[]);}
