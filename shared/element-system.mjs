// One visual contract for production DOM, the inspector and imported sketches.
export const ELEMENT_KINDS={container:'Kontener',text:'Tekst',icon:'Ikona',image:'Grafika',button:'Przycisk',background:'Tło',timer:'Zegar gry',meter:'Pasek wyniku',toggle:'Przełącznik PIN',key:'Klawisz PIN'};
export const ICONS={arrow:'Strzałka',star:'Gwiazdka',heart:'Serce',check:'Akceptuj',gear:'Ustawienia',back:'Powrót',spark:'Iskra',target:'Cel'};
const paths={arrow:'M5 12h14m-6-6 6 6-6 6',back:'M19 12H5m6-6-6 6 6 6',star:'m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.6l6.2-.9Z',heart:'M20 5c-3-3-7-1-8 2-1-3-5-5-8-2-5 5 3 11 8 15 5-4 13-10 8-15Z',check:'m5 12 4 4L19 6',gear:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-5 2 3 4-1 1 4 3 3-3 2 1 4-4 1-4 3-2-3-4 1-1-4-3-4 3-2-1-4 4-1Z',spark:'m12 2 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z',target:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0 3v2'};
export const iconSVG=id=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="${['star','heart','spark'].includes(id)?'currentColor':'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${paths[id]||paths.arrow}"/></svg>`;
export const VISUAL_FIELDS={width:[0,780,'Szerokość'],height:[0,844,'Wysokość'],padding:[0,120,'Odstęp wewnątrz'],gap:[0,120,'Odstępy dzieci'],radius:[0,200,'Zaokrąglenie'],fontSize:[6,120,'Rozmiar tekstu'],opacity:[0,1,'Widoczność grafiki'],imageScale:[.25,3,'Powiększenie grafiki'],imageX:[0,100,'Grafika · poziomo'],imageY:[0,100,'Grafika · pionowo']};
export const STYLE_FIELDS=['textColor','background','icon','asset','fit','replacement',...Object.keys(VISUAL_FIELDS)];
export function validateElementStyles(config){
 const check=styles=>{if(!styles||Array.isArray(styles)||typeof styles!=='object')throw Error('Nieprawidłowe style elementów.');for(const [id,row]of Object.entries(styles)){if(!/^[a-z0-9_-]+$/.test(id)||['__proto__','constructor','prototype'].includes(id)||!row||Array.isArray(row))throw Error('Nieprawidłowy element.');for(const [key,value]of Object.entries(row)){if(!STYLE_FIELDS.includes(key))throw Error('Nieznane ustawienie elementu.');if(VISUAL_FIELDS[key]){const [min,max]=VISUAL_FIELDS[key];if(!Number.isFinite(value)||value<min||value>max)throw Error(`Bezpieczny zakres: ${min}–${max}.`);}else if(['background','textColor'].includes(key)){if(!/^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(value))throw Error('Nieprawidłowy kolor elementu.');}else if(key==='icon'){if(!Object.hasOwn(ICONS,value))throw Error('Nieznana ikona.');}else if(key==='fit'){if(!['cover','contain'].includes(value))throw Error('Nieprawidłowe dopasowanie grafiki.');}else if(key==='replacement'){if(!Object.hasOwn(ELEMENT_KINDS,value))throw Error('Nieznany zamiennik.');}else if(!/^assets\/[a-zA-Z0-9._/-]+$/.test(value)||value.includes('..'))throw Error('Nieprawidłowa ścieżka grafiki.');}}};
 if(config.elementStyles)check(config.elementStyles);
 if(config.elementOverrides){for(const [view,rows]of Object.entries(config.elementOverrides)){if(!/^[a-z0-9-]+$/.test(view))throw Error('Nieprawidłowy ekran.');check(rows);}}
}
export function visualValue(config,view,item){return {...config.elementStyles?.[item.kind],...config.elementStyles?.[config.elementOverrides?.[view]?.[item.id]?.replacement],...config.elementOverrides?.[view]?.[item.id]};}
const fieldCSS={width:'width',height:'height',padding:'padding',gap:'gap',radius:'border-radius',fontSize:'font-size',textColor:'color',background:'background',opacity:'opacity'};
function declarations(row){return Object.entries(row||{}).filter(([k])=>fieldCSS[k]).map(([k,v])=>`${fieldCSS[k]}:${typeof v==='number'&&k!=='opacity'?(v===0&&['width','height'].includes(k)?'auto':v+'px'):v}!important;${k==='height'?'min-height:0!important;':''}`).join('');}
export function elementCSS(config){
 validateElementStyles(config);let css='';
 for(const [kind,row]of Object.entries(config.elementStyles||{}))css+=`#app[data-ds] [data-ds-kind="${kind}"]{${declarations(row)}}`;
 for(const [view,rows]of Object.entries(config.elementOverrides||{}))for(const [id,row]of Object.entries(rows)){const style={...config.elementStyles?.[row.replacement],...row};css+=`html[data-ds-view="${view}"] #app[data-ds] [data-ds-element="${id}"]{${declarations(style)}}`;}
 return css;
}
function kindOf(node){
 if(node.dataset.dsKind)return node.dataset.dsKind;
 if(node.matches('.game-clock,.game-timer,.time-pill,.timer,.spelling-timer,.clock,.game-time'))return'timer';
 if(node.matches('progress')&&node.closest('[data-view=game]'))return'timer';if(node.matches('progress,.round-progress,.math-round-progress'))return'meter';
 if(node.matches('.pin-mode'))return'toggle';if(node.matches('.pin-key'))return'key';
 if(node.matches('button'))return'button';if(node.matches('img,.player-avatar-art'))return'image';
 if(node.matches('.home-art-backdrop,.spelling-art-layer,.spelling-art-background,.result-art,.game-background'))return'background';
 if(node.matches('svg,.continue-arrow,.add-icon,.step-dot,.home-icon'))return'icon';
 if(node.matches('.home-art-backdrop,.spelling-art-layer,.spelling-art-background,.result-art,.game-background'))return'background';
 if(node.matches('h1,h2,h3,h4,p,legend,label,strong,small,.home-stat-value,.home-stat-label,.home-tile-name,.pin-dots>span,.field-title,.result-subtitle'))return'text';
 return'container';
}
const candidates='section,header,nav,fieldset,form,dialog,button,h1,h2,h3,h4,p,legend,label,strong,small,img,svg,.home-icon,.home-stat-value,.home-stat-label,.home-tile-name,.player-avatar-art,.pin-dots>span,.jelly-v4-container,.pin-card,.pin-profile,.pin-mode,.pin-fields,.pin-dots,.pin-keypad,.avatar-picker,.create-avatar-preview,.player-title,.player-grid,.player-actions,.settings-card,.setup-card,.game-bar,.answers,.answer-grid,.question-card,.spelling-question-card,.question-block,.round-progress,.math-round-progress,progress,.spelling-continue-rail,.result-continue-rail,.continue-handle,.result-sheet,.result-stats,.result-actions,.result-score,.result-word-groups,.result-wrong,.result-correct,.progress-hero,.progress-hero-copy,.progress-trophies,.home-canvas,.home-stats,.home-stat,.home-adventures,.home-greeting-live,.home-art-backdrop,.spelling-art-layer,.field-title,.game-clock,.time-pill,.timer,.game-time,.spelling-clock,.spelling-time';
export function annotateElements(root,config,view){
 if(!root)return[];const counts=new Map(),nodes=[...root.querySelectorAll(candidates)].filter(n=>!n.closest('svg')||n.matches('svg')&&!n.parentElement.closest('svg'));
 const items=nodes.map(node=>{const kind=kindOf(node),signature=node.dataset.dsKey||node.id||[node.classList[0]||node.tagName.toLowerCase(),node.dataset.action,node.dataset.mode,node.dataset.digit,node.dataset.avatar].filter(Boolean).join('-');const key=signature.toLowerCase().replace(/[^a-z0-9_-]/g,'-'),count=counts.get(key)||0;counts.set(key,count+1);const id=key+(count?'-'+count:'');node.dataset.dsElement=id;node.dataset.dsKind=kind;
  const style=visualValue(config,view,{id,kind});
  if(style.icon&&node.dataset.dsIcon!==style.icon){if(!node.dataset.dsOriginal)node.dataset.dsOriginal=node.innerHTML;node.innerHTML=iconSVG(style.icon);node.dataset.dsIcon=style.icon;}else if(!style.icon&&node.dataset.dsIcon){node.innerHTML=node.dataset.dsOriginal;delete node.dataset.dsIcon;}
  if(kind==='image'){const img=node.matches('img')?node:node.querySelector('img');if(style.asset&&img){img.dataset.dsOriginalSrc||=img.getAttribute('src')||'';if(img.getAttribute('src')!==style.asset)img.src=style.asset;}else if(!style.asset&&img?.dataset.dsOriginalSrc){img.src=img.dataset.dsOriginalSrc;delete img.dataset.dsOriginalSrc;}}
  if(node.matches('img')||kind==='background'){node.style.objectFit=style.fit||'';node.style.objectPosition=style.imageX!==undefined||style.imageY!==undefined?`${style.imageX??50}% ${style.imageY??50}%`:'';node.style.scale=style.imageScale!==undefined?String(style.imageScale):'';node.style.transformOrigin='center';}
  return{id,component:kind==='timer'?'game-timer':kind==='meter'?'result-progress':kind==='toggle'?'pin-toggle':kind==='key'?'pin-key':`atom-${kind}`,kind,node,index:0,label:node.getAttribute('aria-label')||node.getAttribute('alt')||node.dataset.dsLabel||node.textContent?.trim().replace(/\s+/g,' ').slice(0,50)||ELEMENT_KINDS[kind]};
 });
 for(const item of items){let parent=item.node.parentElement;while(parent&&parent!==root&&!parent.dataset.dsElement)parent=parent.parentElement;item.parent=parent?.dataset.dsElement||'layout-root';item.depth=0;for(let n=item.node.parentElement;n&&n!==root;n=n.parentElement)if(n.dataset.dsElement)item.depth++;}
 return items;
}
export function componentCategories(view){if(['players','players-empty','player-create','player-pin'].includes(view.id))return'login';if(['home','settings'].includes(view.id))return'home';if(view.screen==='history')return'results';return'game';}
export const CATEGORIES={login:'Ekran logowania',home:'Ekran główny',results:'Moje wyniki',game:'Tryb gry'};
