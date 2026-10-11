// The approved drawing supplies the hero and its static headline only.
// Controls are composed from live text, vector atoms and CSS surfaces.
// Coordinates use the design's 853 × 1844 canvas; iOS draws its own system bars.
import {homeTileSurface,homeDecorationAtoms,HOME_TILE_SIZES,homeBadgeSurface,homeModeGlyph,homeStatSymbol,homeStatBacking} from './shared/home-atoms.mjs';
const ART='assets/home/home-retina.webp';
const WIDTH=853, HEIGHT=1844, TOP=100, CONTENT_HEIGHT=1670;
const SETTINGS=[709,122,103,103], STATS=[22,954,810,184];
const TILES={
 spelling:[32,1248,257,245],
 math:[301,1248,253,245],
 english:[566,1248,255,245],
 flags:[32,1505,386,250],
 reading:[434,1505,386,250]
};
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const position=([x,y,w,h])=>`left:${x/WIDTH*100}%;top:${(y-TOP)/CONTENT_HEIGHT*100}%;width:${w/WIDTH*100}%;height:${h/CONTENT_HEIGHT*100}%`;
const image=()=>`<image href="${ART}" x="0" y="0" width="${WIDTH}" height="${HEIGHT}" preserveAspectRatio="none"/>`;
const slice=rect=>`<svg class="home-art-slice" viewBox="${rect.join(' ')}" aria-hidden="true" focusable="false">${image()}</svg>`;

const homeRecipes={'home-tile-surface':'icon-home-tile-surface','home-badge-surface':'icon-home-badge-surface','home-mode-glyph':'icon-home-mode-glyph','home-stat-backing':'icon-home-stat-backing','home-stat-symbol':'icon-home-stat-symbol'};
const vector=(key,label,art,cls='home-vector')=>`<span class="${cls}" data-ds-recipe="${homeRecipes[cls]||'icon-home-chevron'}" aria-hidden="true" data-ds-vector="true" data-ds-key="${key}" data-ds-kind="icon" data-ds-label="${label}">${art}</span>`;
export const renderHomeStatIcon=kind=>`<span class="home-icon home-stat-icon" data-ds-recipe="container-home-stat-icon" aria-hidden="true" data-ds-key="home-${kind}" data-ds-kind="container" data-ds-label="${kind==='target'?'Tarcza i podkład':'Gwiazda i podkład'}">${vector(`home-${kind}-backing`,'Okrągły podkład',homeStatBacking(kind),'home-stat-backing')}${vector(`home-${kind}-symbol`,kind==='target'?'Tarcza ze strzałą':'Złota gwiazda',homeStatSymbol(kind),'home-stat-symbol')}</span>`;
export function renderHomeProgress({today,lastScore,lastLabel},style=''){
 return `<section class="home-stats" data-ds-recipe="container-home-stats" data-ds-key="home-stats" data-ds-kind="container" data-ds-label="Moje postępy · grupa" style="${style}">
  <span class="home-stats-outer" data-ds-recipe="background-home-stats-outer" aria-hidden="true" data-ds-key="home-stats-outer" data-ds-kind="background" data-ds-label="Podkład zewnętrzny"></span>
  <span class="home-stats-inner" data-ds-recipe="background-home-stats-inner" aria-hidden="true" data-ds-key="home-stats-inner" data-ds-kind="background" data-ds-label="Podkład wewnętrzny"></span>
  <div class="home-stat" data-ds-kind="container" data-ds-recipe="container-home-stat" data-ds-key="home-today" data-ds-label="Dziś rozwiązane">${renderHomeStatIcon('target')}<div><strong class="home-stat-value" data-ds-kind="text" data-ds-recipe="text-home-stat-value" data-ds-key="home-today-value">${escape(today)}</strong><span class="home-stat-label" data-ds-kind="text" data-ds-recipe="text-home-stat-label" data-ds-key="home-today-label">Dziś rozwiązane</span></div></div>
  <div class="home-stat" data-ds-kind="container" data-ds-recipe="container-home-stat" data-ds-key="home-last" data-ds-label="Ostatni wynik">${renderHomeStatIcon('star')}<div><strong class="home-stat-value" data-ds-kind="text" data-ds-recipe="text-home-stat-value" data-ds-key="home-last-value">${escape(lastScore)}</strong><span class="home-stat-label" data-ds-kind="text" data-ds-recipe="text-home-stat-label" data-ds-key="home-last-label">${escape(lastLabel)}</span></div></div>
  <button type="button" class="home-progress-arrow" data-ds-kind="button" data-ds-recipe="button-home-progress" data-action="history" data-ds-key="home-progress-arrow" aria-label="Moje wyniki">${vector('home-arrow-icon','Chevron · moje wyniki',homeStatSymbol('chevron'),'home-icon')}</button>
 </section>`;
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

export function renderHomeScreen({nickname,today,lastScore,lastLabel,modes,modeIds}){
 // Extend the exact first sky row into the system safe area. Keeping this
 // separate from the canvas leaves the logo and hit targets below the notch.
 return `<svg class="home-sky-bleed" viewBox="0 ${TOP} ${WIDTH} 1" preserveAspectRatio="none" aria-hidden="true" focusable="false">${image()}</svg>
 <svg class="home-ground-bleed" viewBox="0 ${TOP+CONTENT_HEIGHT-1} ${WIDTH} 1" preserveAspectRatio="none" aria-hidden="true" focusable="false">${image()}</svg>
 <section class="home-canvas" aria-label="Mała Nauka">
  <svg class="home-art-backdrop" viewBox="0 ${TOP} ${WIDTH} ${CONTENT_HEIGHT}" aria-hidden="true" focusable="false">
   <defs><mask id="home-background-mask"><rect x="0" y="0" width="853" height="1844" fill="white"/><rect x="26" y="102" width="180" height="140" fill="black"/><rect x="709" y="122" width="103" height="103" fill="black"/><rect x="0" y="940" width="853" height="904" fill="black"/></mask></defs><g mask="url(#home-background-mask)">${image()}</g>
  </svg>
  <!-- Continue only the last clean scene row beneath the live plates. The
       embedded raster results panel stays masked out of the illustration. -->
  <span class="home-hero-underlap" aria-hidden="true" data-ds-kind="image" data-ds-key="home-hero-underlap" data-ds-label="Ilustracja · zakładka pod wynikami" style="${position([22,939,810,87])}"><svg viewBox="22 939 810 1" preserveAspectRatio="none" aria-hidden="true" focusable="false">${image()}</svg></span>
  <header class="home-header">
   <span class="home-logo-art" data-ds-kind="image" data-ds-label="Logo Mała Nauka" style="${position([26,102,180,140])}">${slice([26,102,180,140])}</span>
   <button type="button" class="home-settings-button home-art-button" data-action="settings" aria-label="Ustawienia" style="${position(SETTINGS)}">${slice(SETTINGS)}</button>
  </header>
  <div class="home-greeting-live"><span>Hej&nbsp;</span><span class="home-nickname">${escape(nickname)}</span><span>!</span></div>
  <h1 class="home-sr-only" tabindex="-1">sprawdź swoje postępy.</h1>
  <p class="home-sr-only">Świetnie Ci idzie, co dalej?</p>
  ${renderHomeProgress({today,lastScore,lastLabel},position(STATS))}
  <section class="home-adventures" style="${position([26,1162,801,68])}"><h2 id="home-modes-title">Wybierz swoją przygodę</h2><p>5 trybów</p></section>
  <nav class="home-game-buttons" aria-labelledby="home-modes-title" data-ds-key="home-modes" data-ds-label="Tryby gry · grupa">${modeIds.map(mode=>renderHomeModeCard(mode,modes[mode].name,position(TILES[mode]))).join('')}</nav>
 </section>`;
}
