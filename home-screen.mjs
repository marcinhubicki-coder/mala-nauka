import {homePlayStyleMarkup} from './shared/home-play-style.mjs';
// The hero is an illustration; text, controls and surfaces remain editable.
// Coordinates use the design's 853 × 1844 canvas; iOS draws its own system bars.
import {homeTileSurface,homeDecorationAtoms,HOME_TILE_SIZES,homeBadgeSurface,homeModeGlyph,homeStatSymbol,homeStatIcon} from './shared/home-atoms.mjs';
import {composeTemplate} from './shared/structure-model.mjs';
import {compileViewMarkup} from './shared/view-contracts.mjs';
import {assetUrl} from './shared/asset-loader.mjs';
import {HOME_SETTINGS as SETTINGS,HOME_STATS as STATS,HOME_TILES as TILES,homePosition} from './shared/home-layout.mjs';
export {HOME_MODES_BOUNDS,HOME_WELCOME_BOUNDS} from './shared/home-layout.mjs';
const layout=()=>globalThis.__MALA_NAUKA_DESIGN__||{};
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

const homeRecipes={'home-tile-surface':'icon-home-tile-surface','home-badge-surface':'icon-home-badge-surface','home-mode-glyph':'icon-home-mode-glyph'};
const vector=(key,label,art,cls='home-vector')=>`<span class="${cls}" data-ds-recipe="${homeRecipes[cls]||'icon-home-chevron'}" aria-hidden="true" data-ds-vector="true" data-ds-key="${key}" data-ds-kind="icon" data-ds-label="${label}">${art}</span>`;
export const renderHomeStatIcon=kind=>`<span class="home-icon home-stat-icon" data-ds-recipe="icon-home-${kind==='target'?'target':'star'}" data-ds-atomic="true" data-ds-vector="true" aria-hidden="true" data-ds-key="home-${kind}" data-ds-kind="icon" data-ds-label="${kind==='target'?'Tarcza ze strzałą':'Złota gwiazda'}">${homeStatIcon(kind)}</span>`;
export function renderHomeToday(today=0){return `<div class="home-stat home-stat-today" data-ds-kind="container" data-ds-recipe="container-home-stat" data-ds-key="home-today" data-ds-label="Dziś rozwiązane">${renderHomeStatIcon('target')}<div data-ds-ignore="true"><strong class="home-stat-value" data-ds-kind="text" data-ds-recipe="text-home-stat-value" data-ds-key="home-today-value">${escape(today)}</strong><span class="home-stat-label" data-ds-kind="text" data-ds-recipe="text-home-stat-label" data-ds-key="home-today-label">Dziś rozwiązane</span></div></div>`;}
export function renderHomeLast(lastScore='0 pkt',lastLabel='Zagraj pierwszą rundę'){return `<div class="home-stat home-stat-last" data-ds-kind="container" data-ds-recipe="container-home-last" data-ds-key="home-last" data-ds-label="Ostatni wynik i moje wyniki">${renderHomeStatIcon('star')}<div data-ds-ignore="true"><strong class="home-stat-value" data-ds-kind="text" data-ds-recipe="text-home-stat-value" data-ds-key="home-last-value">${escape(lastScore)}</strong><span class="home-stat-label" data-ds-kind="text" data-ds-recipe="text-home-stat-label" data-ds-key="home-last-label">${escape(lastLabel)}</span></div><button type="button" class="home-progress-arrow" data-ds-atomic="true" data-ds-kind="button" data-ds-recipe="button-home-progress" data-action="history" data-ds-key="home-progress-arrow" aria-label="Moje wyniki">${homeStatSymbol('chevron')}</button></div>`;}
export function renderHomeProgress({today,lastScore,lastLabel},style=''){
 return `<section class="home-stats" data-ds-recipe="container-home-stats" data-ds-key="home-stats" data-ds-kind="container" data-ds-label="Moje postępy" style="${style}">
  <span class="home-stats-outer" data-ds-recipe="background-home-stats-outer" aria-hidden="true" data-ds-key="home-stats-outer" data-ds-kind="background" data-ds-label="Podkład zewnętrzny"></span>
  <span class="home-stats-inner" data-ds-recipe="background-home-stats-inner" aria-hidden="true" data-ds-key="home-stats-inner" data-ds-kind="background" data-ds-label="Podkład wewnętrzny"></span>
  ${renderHomeToday(today)}
  <span class="home-stat-divider" data-ds-kind="background" data-ds-recipe="background-home-stat-divider" data-ds-key="home-stat-divider" aria-hidden="true"></span>
  ${renderHomeLast(lastScore,lastLabel)}
 </section>`;
}
export function renderHomeLogo(style=''){return `<img class="home-logo-art" data-ds-kind="image" data-ds-atomic="true" data-ds-recipe="image-home-logo-art" data-ds-key="home-logo" data-ds-label="Małe logo" style="${style}" src="${escape(assetUrl('assets/brand/home-mark.png'))}" width="128" height="127" alt="Mała Nauka">`;}
export function renderHomeSettings(style=''){
 return `<button type="button" class="home-settings-button home-art-button" data-ds-recipe="button-home-settings" data-ds-kind="button" data-ds-atomic="true" data-ds-key="home-settings" data-action="settings" aria-label="Ustawienia" style="${style}"><svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="home-gear-metal" x2=".7" y2="1"><stop stop-color="#a4a0b8"/><stop offset=".5" stop-color="#77748e"/><stop offset="1" stop-color="#46445f"/></linearGradient></defs><g fill="url(#home-gear-metal)" stroke="#6b6983" stroke-width="2"><path d="m44 19 12 0 3 10 7 4 10-2 6 10-7 8 0 8 7 8-6 10-10-2-7 4-3 10H44l-3-10-7-4-10 2-6-10 7-8v-8l-7-8 6-10 10 2 7-4Z"/><circle cx="50" cy="53" r="19" fill="#434157"/></g><circle cx="50" cy="53" r="13" fill="#eeeefd" stroke="#9896aa" stroke-width="4"/><circle cx="50" cy="53" r="6" fill="#fff"/></svg></button>`;
}
export function renderHomeHero(nickname='Odkrywco',style=''){
 return `<section class="home-hero" data-ds-recipe="container-home-hero" data-ds-kind="container" data-ds-key="home-hero" style="${style}">
 <span class="home-hero-backing" data-ds-recipe="background-home-hero" data-ds-kind="background" data-ds-key="home-hero-backing" aria-hidden="true"></span>
 <img class="home-hero-photo" data-ds-recipe="image-home-hero" data-ds-kind="image" data-ds-key="home-hero-photo" src="assets/brand/home-adventure-3d.webp" alt="" width="1205" height="1306">
 <div class="home-greeting-live" data-ds-recipe="text-home-greeting" data-ds-kind="text" data-ds-atomic="true" data-ds-key="home-greeting"><span>Hej&nbsp;</span><span class="home-nickname">${escape(nickname)}</span><span>!</span></div>
 <h1 class="home-headline" data-ds-recipe="text-home-headline" data-ds-kind="text" data-ds-atomic="true" data-ds-key="home-headline">sprawdź swoje <strong>postępy<span>.</span></strong></h1>
 <p class="home-hero-copy" data-ds-recipe="text-home-subtitle" data-ds-kind="text" data-ds-key="home-subtitle">Świetnie Ci idzie, co dalej?</p></section>`;
}
export function renderHomeAdventures(style=''){
 return `<section class="home-adventures" data-ds-recipe="container-home-adventures" data-ds-kind="container" data-ds-key="home-adventures" style="${style}"><h2 id="home-modes-title" data-ds-kind="text" data-ds-recipe="text-home-adventure-title" data-ds-key="home-adventure-title">Poćwicz swobodnie</h2><p data-ds-kind="text" data-ds-recipe="text-home-mode-count" data-ds-key="home-mode-count">5 trybów</p></section>`;
}
export function renderHomeDecoration(mode){
 const [w,h]=HOME_TILE_SIZES[mode];
 const decorations=homeDecorationAtoms(mode).map(a=>`<span class="home-decoration-atom" data-ds-recipe="icon-home-decoration-${a.id.split('-')[0]}" aria-hidden="true" data-ds-vector="true" data-ds-key="home-${mode}-${a.id}" data-ds-kind="icon" data-ds-label="${a.label}" style="left:${a.x/w*100}%;top:${a.y/h*100}%;width:${a.width/w*100}%;height:${a.height/h*100}%">${a.svg}</span>`).join('');
 return `<span class="home-tile-decoration" data-ds-recipe="container-home-decoration" aria-hidden="true" data-ds-key="home-${mode}-decoration" data-ds-kind="container" data-ds-label="Dekoracje tła">${decorations}</span>`;
}
export function renderHomeBadge(mode){
 return `<span class="home-mode-badge" data-ds-recipe="container-home-badge" data-ds-key="home-${mode}-badge" data-ds-kind="container" data-ds-label="Ikona i podkład">
  ${vector(`home-${mode}-badge-surface`,'Podkład ikony',homeBadgeSurface(mode),'home-badge-surface')}
  ${mode==='spelling'||mode==='math'?`<span class="home-mode-symbol" data-ds-kind="text" data-ds-recipe="text-home-mode-symbol" data-ds-key="home-${mode}-symbol">${mode==='spelling'?'abc':'1+2'}</span>`:vector(`home-${mode}-glyph`,({english:'Flaga Wielkiej Brytanii',flags:'Mapa świata',reading:'Otwarta książka'})[mode],homeModeGlyph(mode),'home-mode-glyph')}
 </span>`;
}
export function renderHomeModeCard(mode,name,style=''){
 return `<button type="button" class="home-game-button home-art-button" data-ds-kind="button" data-ds-recipe="button-home-card" data-action="choose-mode" data-mode="${mode}" data-ds-key="home-mode-${mode}" data-ds-label="Kafel · ${escape(name)}" style="${style}">
  ${vector(`home-${mode}-surface`,'Podkład kafla',homeTileSurface(mode),'home-tile-surface')}
  ${renderHomeDecoration(mode)}${renderHomeBadge(mode)}
  <span class="home-tile-name" data-ds-kind="text" data-ds-recipe="text-mode-name" data-ds-key="home-${mode}-name">${escape(name)}</span>
 </button>`;
}
export function renderHomeModes(modes,modeIds=Object.keys(TILES),style=''){
 return `<nav class="home-game-buttons" aria-labelledby="home-modes-title" data-ds-kind="container" data-ds-recipe="family-home-modes" data-ds-key="home-modes" data-ds-label="Pięć przygód" style="${style}">${modeIds.map(mode=>renderHomeModeCard(mode,modes[mode].name,homePosition(layout(),'home-mode-'+mode))).join('')}</nav>`;
}
// Retained as an isolated library sample; the free homescreen uses the mode switch.
export function renderHomeCampaign(campaignStarted=false,style=''){
 const sparks=[[12,33,5,-1.2],[20,73,3,-3.4],[32,17,4,-2.1],[48,85,3,-.4],[67,18,5,-4.1],[81,76,4,-2.9],[90,39,5,-.8],[73,58,2,-3.7],[23,49,2,-2.5],[57,31,2,-1.7]];
 return `<button type="button" class="home-campaign-cta" data-action="campaign" aria-label="${campaignStarted?'Twoja kampania':'Rozpocznij kampanię'}" data-ds-key="home-campaign" data-ds-kind="button" data-ds-recipe="button-campaign" data-ds-atomic="true" style="${style}"><span class="home-campaign-aura" aria-hidden="true" data-mn-decoration="true"></span><span class="home-campaign-film" aria-hidden="true" data-mn-decoration="true"></span><span class="home-campaign-sparks" aria-hidden="true" data-mn-decoration="true">${sparks.map(([x,y,size,delay],i)=>`<i class="${i<7?'is-star':''}" style="left:${x}%;top:${y}%;--spark-size:${size};--spark-delay:${delay}s"></i>`).join('')}</span><span class="home-campaign-label">${campaignStarted?'Twoja':'Rozpocznij'}<br>kampani${campaignStarted?'a':'ę'}</span></button>`;
}
export function renderHomeWelcome({nickname='Odkrywco',today=0,lastScore='0 pkt',lastLabel='Zagraj pierwszą rundę',campaignStarted=false}={},style=''){
 return `<section class="home-welcome" data-ds-kind="container" data-ds-recipe="family-home-welcome" data-ds-key="home-welcome" style="${style}">${renderHomeHero(nickname,homePosition(layout(),'home-hero'))}${renderHomeProgress({today,lastScore,lastLabel},homePosition(layout(),'home-stats'))}</section>`;
}

export function renderHomeScreen({nickname,today,lastScore,lastLabel,modes,modeIds,campaignStarted=false}){
 const slots={
 'background-home':'',
 'image-home-logo-art':'',
 'button-home-settings':'',
 'family-home-welcome':renderHomeWelcome({nickname,today,lastScore,lastLabel,campaignStarted},homePosition(layout(),'home-welcome')),
 'container-home-adventures':renderHomeAdventures(homePosition(layout(),'home-adventures')),
 'family-home-modes':renderHomeModes(modes,modeIds,homePosition(layout(),'home-modes'))
 };
 return compileViewMarkup('home',`<section class="home-canvas" data-ds-ignore="true" data-ds-template="template:home" aria-label="Mała Nauka"><span class="home-background" data-ds-kind="background" data-ds-recipe="background-home" data-ds-key="home-background" aria-hidden="true"></span>${renderHomeLogo(homePosition(layout(),'home-logo'))}${renderHomeSettings(homePosition(layout(),'home-settings'))}<div class="home-play-content"><div class="home-free-content">${composeTemplate('home',slots,{exclude:['background-home','image-home-logo-art','button-home-settings','control-jelly']})}</div></div>${homePlayStyleMarkup('free')}</section>`);
}
