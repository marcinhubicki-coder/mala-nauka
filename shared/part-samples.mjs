import {resultStatMarkup,resultStatIcon,resultStatCopy,resultStatSprig} from '../ortografia/result-screen.mjs';
import {progressCollectionMarkup,collectionWordMarkup,collectionFiltersMarkup} from '../progress-screen.mjs';
import {backButton} from './navigation-parts.mjs';
import {wordMarkup} from '../spelling/word-reveal.mjs';
import {missionIllustration} from './mission-parts.mjs';
import {renderHomeModeCard,renderHomeProgress,renderHomeDecoration,renderHomeBadge,renderHomeStatIcon,renderHomeSettings,renderHomeHero,renderHomeAdventures,renderHomeScreen,renderHomeLogo,renderHomeToday,renderHomeLast,renderHomeWelcome,renderHomeModes,HOME_MODES_BOUNDS,HOME_WELCOME_BOUNDS} from '../home-screen.mjs';
import {homeTileSurface,homeBadgeSurface,homeModeGlyph,homeStatSymbol,homeDecorationAtoms,homeDecorationStar,HOME_TILE_SIZES} from './home-atoms.mjs';
import {PART_BY_ID} from './structure-model.mjs';
import {profileAvatar,pinModeMarkup,pinDotMarkup,pinDotsMarkup,pinKeyMarkup,pinKeypadMarkup} from './profile-parts.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const texts={
 'text-mission-title':'Twoja mała misja','text-mission-hint':'Małe kroki, wielkie odkrycia.', 'text-player-title':'Kto dziś odkrywa?', 'text-nickname':'Maja', 'text-pin-instruction':'Ustaw 4 cyfry',
 'text-player-copy':'Małe kroki, wielkie odkrycia.', 'text-player-form-title':'Jak Cię wołamy?', 'text-field-label':'Co ćwiczymy?',
 'text-nickname-help':'Od 3 do 16 znaków.', 'jelly-option':'Podstawowe', 'pin-option':'Ustaw PIN',
 'text-continue-copy':'Przesuń, aby kontynuować', 'text-progress-value':'72%', 'text-mode-name':'Ortografia', 'text-home-mode-symbol':'abc', 'text-home-stat-value':'0 pkt', 'text-home-stat-label':'Zagraj pierwszą rundę'
};
const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const check='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
export function jellyMarkup(labels=['Wszystkie','Podstawowe','Trudne'],selected=0,name='block-jelly'){
 return `<div class="ds-jelly" role="radiogroup" aria-label="Wybór opcji"><i class="live-jelly-indicator" aria-hidden="true"></i>${labels.map((label,i)=>`<label data-ds-recipe="jelly-option" data-ds-kind="text"><input type="radio" name="${esc(name)}" value="${i}" ${i===selected?'checked':''}><span>${esc(label)}</span></label>`).join('')}</div>`;
}
// Every example is a new tree of code primitives. No iframe or DOM extraction.
export function partSample(id,options={}){
 const catalog=options.catalog||Object.values(PART_BY_ID),byId=new Map(catalog.map(p=>[p.id,p])),assetURL=options.assetURL|| (path=>new URL('../'+path,import.meta.url).href);
 const opts={pin:true,pinDigits:0,playerCount:3,selectedPlayer:-1,choice:0,percent:72,mode:'default',...options};
 const stamp=(markup,recipe,kind=byId.get(recipe)?.kind||'container')=>markup.replace(/^<([^>]+)>/,tag=>tag.replace(/ data-ds-(?:recipe|kind)="[^"]*"/g,'')).replace(/^(<\w+)(?=[\s>])/,(tag)=>`${tag} data-ds-recipe="${esc(recipe)}" data-ds-kind="${kind}"`);
 const tag=(name,recipe,cls,body,attrs='')=>`<${name} data-ds-recipe="${esc(recipe)}" data-ds-kind="${byId.get(recipe)?.kind||'container'}" class="${cls}" ${attrs}>${body}</${name}>`;
 const img=(recipe,path)=>tag('img',recipe,'part-image','',`src="${esc(assetURL(path))}" alt="${esc(byId.get(recipe)?.name||'Ilustracja')}"`);
 const avatar=(key='a')=>stamp(profileAvatar({avatarId:key},'',assetURL),'image-player-avatar-art');
 const keys=()=>stamp(pinKeypadMarkup(opts.pinDigits),'container-pin-keypad').replaceAll('class="pin-key', 'data-ds-recipe="control-pin-key" data-ds-kind="key" class="pin-key');
 const dots=()=>stamp(pinDotsMarkup(opts.pinDigits),'container-pin-dots').replaceAll('<span class=', '<span data-ds-recipe="icon-pin-dot" data-ds-kind="icon" class=');
 const mode=()=>stamp(pinModeMarkup(opts.pin,'block-pin'),'control-pin').replaceAll('<label>', '<label data-ds-recipe="pin-option" data-ds-kind="text">');
 const player=(index=0)=>tag('button','button-player-card',`player-card ${opts.selectedPlayer===index?'is-selected':''}`,avatar('abc'[index%3])+tag('strong','text-nickname','', ['Maja','Tomek','Lena'][index%3])+tag('span','icon-player-select','player-select-mark',opts.selectedPlayer===index?`<span class="check">${check}</span>`:'<span class="empty-check"></span>'),`type="button" data-sample-player="${index}" aria-pressed="${opts.selectedPlayer===index}"`);
 const homeMode=HOME_TILE_SIZES[opts.mode]?opts.mode:'spelling';
 const homeNames={spelling:'Ortografia',math:'Matematyka',english:'Angielski',flags:'Flagi',reading:'Czytanie'};
 // Production markup and styles are reused in the standalone library examples.
 const homePreview=(body,width,height)=>`<div class="home-canvas home-part-preview home-game-button" data-mode="${homeMode}" style="aspect-ratio:${width}/${height};--home-design-width:${width};--home-u:calc(853 / ${width} * 1cqw)">${body}</div>`;
 const homeAtom=(recipe,art)=>homePreview(tag('span',recipe,'home-part-atom home-game-button',art,`data-mode="${homeMode}"`),140,140);
 const render=(recipe,seen=new Set())=>{
  if(seen.has(recipe))return '';
  const next=new Set(seen).add(recipe),p=byId.get(recipe)||PART_BY_ID[recipe]||{id:recipe,name:recipe,kind:'container',children:[]};
  const child=childId=>render(childId,next),children=()=>p.children.map(child).join('');
  if(texts[recipe])return tag(recipe==='text-player-title'?'h1':recipe==='text-pin-instruction'?'h3':'span',recipe,'part-text',esc(texts[recipe]));
  switch(recipe){
   case 'family-collection':case 'container-collection-grid':case 'container-collection-word':case 'container-collection-filters':{const word={word:'król',masked:'kr_l',answer:'ó',category:'u/ó'},card=collectionWordMarkup(word,'mastered');return `<div class="progress-canvas collection-part-sample" style="--progress-u:1px">${recipe==='container-collection-word'?card:recipe==='container-collection-filters'?collectionFiltersMarkup():recipe==='family-collection'?`<section data-ds-recipe="family-collection" data-ds-kind="container">${collectionFiltersMarkup()}<div class="collection-word-grid" data-ds-recipe="container-collection-grid" data-ds-kind="container">${card}</div></section>`:`<div class="collection-word-grid" data-ds-recipe="container-collection-grid" data-ds-kind="container">${card}</div>`}</div>`;}
   case 'container-progress-collection':return `<div class="progress-canvas progress-part-sample" style="--progress-u:1px">${progressCollectionMarkup()}</div>`;
   case 'background-progress-collection':return tag('div',recipe,'part-background','',`style="background-image:url('${assetURL('assets/progress/collection-v1.webp')}')"`);
   case 'text-progress-collection':return tag('strong',recipe,'part-text','Moja kolekcja słów');
   case 'container-card':return tag('div',recipe,'part-surface','', 'aria-label="Kafel / podkład"');
   case 'icon-step-dot':return tag('span',recipe,'step-dot','1');
   case 'icon-player-select':return tag('span',recipe,'player-select-mark',`<span class="check">${check}</span>`);
   case 'image-player-avatar-art':return avatar();
   case 'image-player-brand-art':case 'image-player-empty-art':return img(recipe,p.asset);
   case 'image-home-logo-art':return homePreview(renderHomeLogo('inset:0'),180,140);
   case 'image-mission':return `<div class="mission-sample">${missionIllustration(homeMode,assetURL)}</div>`;
   case 'text-spelling-word':return wordMarkup('kr_l');
   case 'image-mn-soap-picture':return img(recipe,opts.photoAsset||'assets/scenes/krol.jpg');
   case 'background-home-art-backdrop':return tag('div',recipe,'part-background','',`style="background:linear-gradient(#eaf5ff,#d9e9ff)" aria-label="Tło scenariusza gry"`);
   case 'control-jelly':return stamp(jellyMarkup(opts.labels,opts.choice),'control-jelly');
   case 'control-pin':return mode();
   case 'control-toggle':return stamp(jellyMarkup(['Czas','Słowa'],opts.choice%2,'block-toggle'),'control-toggle');
   case 'control-pin-key':return stamp(pinKeyMarkup('1'),'control-pin-key');
   case 'icon-pin-dot':return stamp(pinDotMarkup(opts.pinDigits>0),'icon-pin-dot');
   case 'input-player-name':return tag('input',recipe,'player-name-input','', 'type="text" value="Maja" maxlength="16" aria-label="Imię gracza"');
   case 'button-main':case 'button-answer':return tag('button',recipe,recipe==='button-main'?'start-button':'recipe-answer',recipe==='button-main'?'Dalej':'rz','type="button" data-sample-press aria-pressed="false"');
   case 'button-back':return backButton();
   case 'button-avatar-choice':return tag('button',recipe,'avatar-choice',avatar(),'type="button" data-sample-avatar="a" aria-pressed="false"');
   case 'button-player-card':return player();
   case 'button-home-card':{const [w,h]=HOME_TILE_SIZES[homeMode];return homePreview(stamp(renderHomeModeCard(homeMode,homeNames[homeMode],'left:0;top:0;width:100%;height:100%'),recipe),w,h);}
   case 'container-home-decoration':{const [w,h]=HOME_TILE_SIZES[homeMode];return homePreview(stamp(renderHomeDecoration(homeMode),recipe),w,h);}
   case 'container-home-badge':return homePreview(stamp(renderHomeBadge(homeMode).replace('class="home-mode-badge"','class="home-mode-badge home-part-badge"').replace('<span ','<span data-mode="'+homeMode+'" '),recipe),158,158);
   case 'icon-home-target':case 'icon-home-star':return homePreview(renderHomeStatIcon(recipe.endsWith('target')?'target':'star').replace('class="home-icon home-stat-icon"','class="home-icon home-stat-icon home-part-stat-icon"'),100,100);
   case 'container-home-stat':return homePreview(renderHomeToday(),296,140);
   case 'button-home-settings':return homePreview(renderHomeSettings('left:0;top:0;width:100%;height:100%'),103,103);
   case 'container-home-hero':return homePreview(renderHomeHero('Odkrywco','left:0;top:0;width:100%;height:100%'),810,820);
   case 'family-home-welcome':return homePreview(renderHomeWelcome({},'inset:0'),HOME_WELCOME_BOUNDS[2],HOME_WELCOME_BOUNDS[3]);
   case 'family-home-modes':return homePreview(renderHomeModes(Object.fromEntries(Object.entries(homeNames).map(([id,name])=>[id,{name}])) ,undefined,'inset:0'),HOME_MODES_BOUNDS[2],HOME_MODES_BOUNDS[3]);
   case 'container-home-adventures':return homePreview(renderHomeAdventures('inset:0'),801,68);
   case 'container-home-last':return homePreview(renderHomeLast(),453,140);
   case 'background-home':return homePreview(tag('span',recipe,'home-background',''),853,1670);
   case 'background-home-hero':return homePreview(tag('span',recipe,'home-hero-backing',''),810,820);
   case 'image-home-hero':return img(recipe,'assets/brand/home-adventure-3d.webp');
   case 'text-home-greeting':case 'text-home-headline':case 'text-home-subtitle':case 'text-home-adventure-title':case 'text-home-mode-count':return tag('span',recipe,'part-text',({'text-home-greeting':'Hej Odkrywco!','text-home-headline':'sprawdź swoje postępy.','text-home-subtitle':'Świetnie Ci idzie, co dalej?','text-home-adventure-title':'Wybierz swoją przygodę','text-home-mode-count':'5 trybów'})[recipe]);
   case 'background-home-stat-divider':return tag('span',recipe,'home-stat-divider','','style="width:1px;height:40px"');
   case 'container-home-stats':return homePreview(stamp(renderHomeProgress({today:0,lastScore:'0 pkt',lastLabel:'Zagraj pierwszą rundę'},'left:0;top:0;width:100%;height:100%'),recipe),810,184);
   case 'icon-home-tile-surface':return homeAtom(recipe,homeTileSurface(homeMode));
   case 'icon-home-badge-surface':return homeAtom(recipe,homeBadgeSurface(homeMode));
   case 'icon-home-mode-glyph':return homeAtom(recipe,homeModeGlyph(['english','flags','reading'].includes(homeMode)?homeMode:'english'));
   case 'icon-home-decoration-star':return homeAtom(recipe,homeDecorationStar());
   case 'icon-home-decoration-plus':case 'icon-home-decoration-rays':case 'icon-home-decoration-cloud':case 'icon-home-decoration-mountains':{const key=recipe.split('-').at(-1),m={plus:'math',rays:'english',cloud:'english',mountains:'flags'}[key];return homeAtom(recipe,homeDecorationAtoms(m).find(a=>a.id.startsWith(key)).svg);}
   case 'icon-home-chevron':return homeAtom(recipe,homeStatSymbol('chevron'));
   case 'button-home-progress':return homePreview(tag('button',recipe,'home-progress-arrow',homeStatSymbol('chevron'),'type="button" data-sample-press aria-label="Moje wyniki"'),100,100);
   case 'background-home-stats-outer':case 'background-home-stats-inner':return homePreview(tag('span',recipe,recipe.endsWith('outer')?'home-stats-outer':'home-stats-inner','','style="z-index:0"'),810,184);
   case 'container-result-stat':case 'icon-result-stat':case 'text-result-stat':case 'icon-result-sprig':{const key=opts.statKind==='retained'?'retained':'review',label=key==='retained'?'Dziś było pewne':'Do powtórki',markup=recipe==='container-result-stat'?resultStatMarkup(label,3,key,opts.state==='selected'):recipe==='icon-result-stat'?resultStatIcon(key):recipe==='text-result-stat'?resultStatCopy(label,3):resultStatSprig();return `<div class="result-part-sample" data-result="${key}" style="--result-u:1px;--result-ink:#071b56;--result-muted:#8298b7;--result-green:#218b52;--result-rose:#e90a76;width:172px;max-width:100%">${markup}</div>`;}
   case 'result-points-bubble':return tag('div',recipe,'part-points','125');
   case 'container-player-title':return tag('header',recipe,'player-title',children());
   case 'container-player-grid':return tag('div',recipe,`player-grid ${opts.selectedPlayer>=0?'has-selection':''}`,Array.from({length:opts.playerCount},(_,i)=>player(i)).join(''));
   case 'container-player-form-card':return tag('section',recipe,'part-panel player-form-card',avatar()+child('text-player-form-title')+child('text-player-copy')+child('container-player-form'));
   case 'container-player-form':return tag('form',recipe,'player-form',child('text-field-label')+child('input-player-name')+child('text-nickname-help')+child('container-avatar-picker')+child('button-main'));
   case 'container-avatar-picker':return tag('div',recipe,'avatar-picker',Array.from('abcd',key=>tag('button','button-avatar-choice','avatar-choice',avatar(key),`type="button" data-sample-avatar="${key}" aria-pressed="false"`)).join(''));
   case 'container-pin-profile':return tag('div',recipe,'pin-profile',avatar()+tag('h2','text-nickname','','Maja'));
   case 'container-pin-dots':return dots();
   case 'container-pin-keypad':return keys();
   case 'container-pin-fields':return tag('div',recipe,'pin-fields',opts.pin?child('text-pin-instruction')+tag('p','text-player-copy','','PIN służy do przełączania profili.')+dots()+keys():tag('h3','text-pin-instruction','pin-instruction','Bez PIN-u')+tag('p','text-player-copy','','Do tego profilu wejdziesz bez kodu. PIN możesz ustawić później.')+child('button-main'));
   case 'container-pin-card':return tag('section',recipe,`pin-card part-panel ${opts.pin?'':'pin-no-code'}`,child('container-pin-profile')+mode()+child('container-pin-fields'));
   case 'container-setting-field':return tag('fieldset',recipe,'setting-field',tag('legend','container-field-title','live-number-text',child('icon-step-dot')+child('text-field-label'))+child('control-jelly'));
   case 'container-field-title':return tag('div',recipe,'live-number-text',children());
   case 'container-mission':return tag('section',recipe,'mission-card',missionIllustration(homeMode,assetURL)+tag('div','container','',tag('h2','text-mission-title','','Twoja mała misja')+tag('p','text-mission-hint','','Małe kroki, wielkie odkrycia.')));
   case 'icon-continue-handle':return tag('span',recipe,'part-icon-button',arrow);
   case 'meter-round-progress-fill':return tag('span',recipe,'part-meter-fill','',`style="width:${opts.percent}%;height:18px;background:var(--ds-theme-accent)"`);
  }
  // Newly discovered code parts compose known children, instead of relying on screenshots.
  if(p.children?.length)return tag('div',recipe,'part-composition',children());
  if(p.kind==='text')return tag('span',recipe,'part-text',esc(p.name));
  if(p.kind==='image')return img(recipe,p.asset||'assets/brand/player-logo-3d.webp');
  if(p.kind==='background')return tag('div',recipe,'part-background','',`style="background:var(--ds-theme-light)"`);
  if(['button','key'].includes(p.kind))return tag('button',recipe,'part-icon-button',esc(p.name),'type="button" data-sample-press');
  if(p.kind==='icon')return tag('span',recipe,'part-icon-button',check);
  return tag('div',recipe,'part-surface','',`aria-label="${esc(p.name)}"`);
 };
 return render(id);
}
