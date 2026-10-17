// Atoms own text rhythm. Existing component families keep surfaces and interaction.
import {ICONS} from './element-system.mjs';
import {ATOMS} from './structure-model.mjs';
export {ATOMS};
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
const TYPES=['canvas','surface','group','button','jelly','icon','image','spacer',...Object.keys(ATOMS)];
export function validateBlueprint(value){
 if(!value||!/^blueprint-[a-z0-9-]{1,70}$/.test(value.id)||typeof value.name!=='string'||!value.name.trim()||value.name.length>60||/[<>\u0000-\u001f]/.test(value.name))throw Error('Nadaj elementowi nazwę.');
 const ids=new Set();let total=0;
 const walk=(node,depth)=>{
  if(!node||depth>6||++total>48||!/^node-[a-z0-9-]{1,60}$/.test(node.id)||ids.has(node.id)||!TYPES.includes(node.type)||typeof node.text!=='string'||node.text.length>140||!['visible','reserve','reflow'].includes(node.visibility)||!number(node.width,0,780)||!number(node.height,0,844)||!number(node.padding,0,120)||!number(node.gap,0,120)||node.radius!==undefined&&!number(node.radius,0,200)||!Array.isArray(node.children)||Object.keys(node).some(k=>!['id','type','text','visibility','width','height','padding','gap','radius','children','background','textColor','asset','icon','layout','columns','opacity','fit','imageScale','imageX','imageY','originX','originY','offsetX','offsetY','overflow'].includes(k)))throw Error('Nieprawidłowa warstwa elementu.');
  for(const k of ['background','textColor'])if(node[k]&&!/^#[0-9a-f]{6}$/i.test(node[k]))throw Error('Nieprawidłowy kolor szkicu.');
  if(node.asset&&(!/^assets\/[a-zA-Z0-9._/-]+$/.test(node.asset)||node.asset.includes('..')))throw Error('Nieprawidłowa grafika szkicu.');
  if(node.icon&&!Object.hasOwn(ICONS,node.icon))throw Error('Nieprawidłowa ikona szkicu.');
  if(node.opacity!==undefined&&!number(node.opacity,0,1)||node.imageScale!==undefined&&!number(node.imageScale,.25,3)||node.imageX!==undefined&&!number(node.imageX,0,100)||node.imageY!==undefined&&!number(node.imageY,0,100)||node.originX!==undefined&&!number(node.originX,0,100)||node.originY!==undefined&&!number(node.originY,0,100)||node.offsetX!==undefined&&!number(node.offsetX,-390,390)||node.offsetY!==undefined&&!number(node.offsetY,-844,844)||node.fit&&!['cover','contain'].includes(node.fit)||node.overflow&&!['visible','clip'].includes(node.overflow))throw Error('Nieprawidłowe ustawienia grafiki lub położenia.');
  if(node.layout&&!['column','row','grid'].includes(node.layout)||node.columns!==undefined&&!number(node.columns,1,5))throw Error('Nieprawidłowy układ szkicu.');
  ids.add(node.id);if(!['canvas','surface','group','button','jelly'].includes(node.type)&&node.children.length)throw Error('Atom nie może zawierać innych warstw.');node.children.forEach(n=>walk(n,depth+1));
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
 else if(type==='jelly')inner=node('jelly','Przełącznik jelly',[node('buttonLabel','Opcja 1'),node('buttonLabel','Opcja 2'),node('buttonLabel','Opcja 3')]);
 else if(type==='icon'){inner=node('icon','Ikona');inner.icon='star';inner.width=40;inner.height=40;}
 else if(type==='number-icon'){inner=node('group','Ikona z numerem',[node('numberText','1')]);inner.width=48;inner.height=48;inner.padding=8;inner.radius=24;inner.background='#315af2';inner.textColor='#ffffff';}
 else inner=node('surface','Kafel',[node('numberText','1 · Co ćwiczymy?'),node('title','Małe odkrycia'),node('subtitle','Wybierz kategorię i ruszamy.'),node('button','Zaczynamy!',[node('buttonLabel','Zaczynamy!')])]);
 return {id:'blueprint-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6),name:type==='popup'?'Próbny popup':type==='flashcard'?'Próbna fiszka':type==='button'?'Próbny przycisk':type==='jelly'?'Próbne jelly · 3 opcje':type==='icon'?'Próbna ikona':type==='number-icon'?'Ikona z numerem':'Próbny kafel',root:node('canvas','Płótno',[inner])};
}
export const flattenBlueprint=root=>[root,...root.children.flatMap(flattenBlueprint)];
export function newLayer(type){if(!TYPES.includes(type)||type==='canvas')throw Error('Wybierz typ warstwy.');const value=node(type,ATOMS[type]?.name||(type==='button'?'Przycisk':type==='surface'?'Podkład':type==='icon'?'Ikona':type==='image'?'Grafika':type==='jelly'?'Jelly':type==='spacer'?'Spacer':'Sekcja'),type==='button'?[node('buttonLabel','Zaczynamy!')]:[]);if(type==='spacer'){value.height=24;value.gap=0;}return value;}
export function blueprintMarkdown(value){validateBlueprint(value);const lines=[`# ${value.name}`,'','Szkic Małej Nauki. Zachowaj hierarchię, czytelność i edukacyjny charakter.','Docelowy ekran: iPhone 13 Pro, 390 × 844, Retina 3×.','Kolejność listy jest kolejnością warstw od góry do dołu; tło pełnoekranowe pozostaje na spodzie.',''];const walk=(n,d=0)=>{lines.push(`${'  '.repeat(d)}- ${n.type}: ${n.text||'Warstwa'}; ${n.width||'auto'} × ${n.height||'auto'}; padding ${n.padding}; odstępy ${n.gap}; ${n.visibility}${n.radius!==undefined?'; promień '+n.radius:''}${n.background?'; tło '+n.background:''}${n.asset?'; grafika '+n.asset:''}${n.fit?'; kadr '+n.fit:''}${n.opacity!==undefined?'; opacity '+n.opacity:''}${n.offsetX||n.offsetY?`; pozycja ${n.offsetX||0}, ${n.offsetY||0}`:''}${n.overflow?'; overflow '+n.overflow:''}`);n.children.forEach(c=>walk(c,d+1));};walk(value.root);lines.push('','## Instrukcja do mockupu','','Zaproponuj spójną skórkę i ilustracje dla tego szkieletu. Zachowaj hierarchię, kolejność, spacery i funkcje kontrolek. Przygotuj grafiki jako osobne assety z czytelnym kadrem i punktem skalowania. Zachowaj duże pola dotykowe, kontrast tekstów i miejsce pod notchem.');return lines.join('\n');}
