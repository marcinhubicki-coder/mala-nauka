import {iconSVG} from '../shared/element-system.mjs';

// Studio navigation icons stay separate from the game's editable icon recipes.
const paths={
 users:'M9 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM3 20v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v1',
 home:'m3 11 9-8 9 8M5 9v12h14V9M9 21v-7h6v7',
 trophy:'M8 3h8v7a4 4 0 0 1-8 0V3ZM8 5H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 3v5m-4 2h8',
 book:'M12 5v16M3 4c3-1 6-1 9 1 3-2 6-2 9-1v15c-3-1-6-1-9 2-3-3-6-3-9-2V4Z',
 flag:'M5 21V3m0 1c5-3 9 3 14 0v10c-5 3-9-3-14 0',
 calculator:'M5 3h14v18H5V3Zm3 4h8M8 12h2m4 0h2M8 16h2m4 0h2',
 letters:'m3 18 4-12 4 12M4.5 14h5M14 6h4a3 3 0 0 1 0 6h-4m0-6v12h4a3 3 0 0 0 0-6',
 globe:'M3 12h18M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c-5 5-5 13 0 18 5-5 5-13 0-18Z',
 grid:'M3 3h7v7H3V3Zm11 0h7v7h-7V3ZM3 14h7v7H3v-7Zm11 0h7v7h-7v-7Z',
 palette:'M12 3a9 9 0 0 0 0 18h1a2 2 0 0 0 1-4 2 2 0 0 1 1-4h3a3 3 0 0 0 3-3 9 9 0 0 0-9-7ZM7 9h.01M11 6h.01M16 7h.01M6 14h.01',
 type:'M3 5h12M9 5v15M6 20h6m3-9h6m-3 0v9',
 image:'M3 4h18v16H3V4Zm0 13 6-6 4 4 3-3 5 5M15 8h.01',
 play:'m8 4 12 8-12 8V4Z',
 music:'M9 18V5l11-2v13M9 5l11-2M9 18a3 3 0 1 1-3-3h3m11 1a3 3 0 1 1-3-3h3',
 flow:'M3 4h6v6H3V4Zm12 10h6v6h-6v-6ZM9 7h6a3 3 0 0 1 3 3v4M6 10v7h9',
 code:'m8 6-6 6 6 6m8-12 6 6-6 6m-3-14-2 16',
 history:'M4 10a8 8 0 1 1 2 7M4 10V4m0 6h6m2-3v5l3 2',
 lock:'M6 10h12v11H6V10Zm2 0V7a4 4 0 0 1 8 0v3m-4 5v2',
 atom:'M6 4h12v16H6V4Zm3 4h6m-6 4h6m-6 4h3',
 button:'M6 6h12a6 6 0 0 1 0 12H6A6 6 0 0 1 6 6Zm3 6h6',
 toggle:'M6 7h12a5 5 0 0 1 0 10H6A5 5 0 0 1 6 7Zm8 5a3 3 0 1 0 6 0 3 3 0 0 0-6 0Z',
 clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 4v5l3 2',
 rocket:'M14 4c2-1 4-1 6-1 0 2 0 4-1 6l-8 8-4-4 7-9ZM7 13H3l3-6h5m0 10v4l6-3v-5M4 17l-1 4 4-1m8-12h.01'
};
export function studioIcon(id){return paths[id]?`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[id]}"/></svg>`:iconSVG(id);}
export const NAV_ICONS={project:'rocket',components:'grid',builder:'layers',testing:'play',colors:'palette',fonts:'type',assets:'image',batches:'check',motion:'play',effects:'spark',sound:'music',scoring:'trophy',views:'flow',audit:'code',docs:'book',versions:'history'};
export const MODE_ICONS={spelling:'letters',english:'globe',flags:'flag',reading:'book',math:'calculator'};
export const CATEGORY_ICONS={login:'users',home:'home',results:'trophy',game:'play'};
export function partIcon(part){return part.level==='family'?'screen':part.level==='group'?'layers':({text:'type',image:'image',background:'palette',button:'button',toggle:'toggle',key:'lock',input:'type',timer:'clock',meter:'target',icon:'atom'})[part.kind]||'square';}
export function viewIcon(view){
 const value=[view.id,view.screen,view.state].filter(Boolean).join(' ').toLowerCase();
 if(/setting|wizard/.test(value))return 'gear';
 if(/incorrect|wrong|error/.test(value))return 'sad';
 if(/correct|success/.test(value))return 'smile';
 if(/finish|result|end|summary/.test(value))return 'trophy';
 if(/pause/.test(value))return 'pause';
 if(/rule/.test(value))return 'book';
 if(/hint|help/.test(value))return 'question';
 if(/home/.test(value))return 'home';
 if(/pin/.test(value))return 'lock';
 if(/player|login/.test(value))return 'users';
 return 'play';
}

// Internal labels remain editable through their atom's structure, without
// taking over the primary library list.
const details=new Set(['jelly-option','pin-option','text-mode-name']);
export function librarySections(catalog,level){
 const rows=catalog.filter(p=>p.level===level);
 if(level!=='atom')return [{id:level,name:level==='group'?'Grupy elementów':'Rodziny · widoki',rows}];
 return [
  {id:'objects',name:'Obiekty i sterowanie',rows:rows.filter(p=>!['text','image','background'].includes(p.kind))},
  {id:'graphics',name:'Grafika i tła',rows:rows.filter(p=>['image','background'].includes(p.kind))},
  {id:'text',name:'Tekst i fonty',rows:rows.filter(p=>p.kind==='text'&&!details.has(p.id))},
  {id:'details',name:'Etykiety w kontrolkach',rows:rows.filter(p=>details.has(p.id))}
 ].filter(section=>section.rows.length);
}

export const PREVIEW_DEVICE={width:414,height:876,screenWidth:390,screenHeight:844};
export function previewScale(width,height,{paddingX=24,paddingY=24,columns=1,gap=18}={}){
 const availableWidth=Math.max(0,(width-paddingX-(columns-1)*gap)/columns);
 return Math.min(1,availableWidth/PREVIEW_DEVICE.width,Math.max(0,height-paddingY)/PREVIEW_DEVICE.height);
}
