// The approved drawing supplies the hero and its static headline only.
// Controls are composed from live text, vector atoms and CSS surfaces.
// Coordinates use the design's 853 × 1844 canvas; iOS draws its own system bars.
import {homeTileSurface,homeTileDecoration,homeBadgeSurface,homeModeGlyph,homeStatIcon} from './shared/home-atoms.mjs';
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

export function renderHomeScreen({nickname,today,lastScore,lastLabel,modes,modeIds}){
 // Extend the exact first sky row into the system safe area. Keeping this
 // separate from the canvas leaves the logo and hit targets below the notch.
 return `<svg class="home-sky-bleed" viewBox="0 ${TOP} ${WIDTH} 1" preserveAspectRatio="none" aria-hidden="true" focusable="false">${image()}</svg>
 <svg class="home-ground-bleed" viewBox="0 ${TOP+CONTENT_HEIGHT-1} ${WIDTH} 1" preserveAspectRatio="none" aria-hidden="true" focusable="false">${image()}</svg>
 <section class="home-canvas" aria-label="Mała Nauka">
  <svg class="home-art-backdrop" viewBox="0 ${TOP} ${WIDTH} ${CONTENT_HEIGHT}" aria-hidden="true" focusable="false">
   <defs><mask id="home-background-mask"><rect x="0" y="0" width="853" height="1844" fill="white"/><rect x="26" y="102" width="180" height="140" fill="black"/><rect x="709" y="122" width="103" height="103" fill="black"/><rect x="0" y="940" width="853" height="904" fill="black"/></mask></defs><g mask="url(#home-background-mask)">${image()}</g>
  </svg>
  <header class="home-header">
   <span class="home-logo-art" data-ds-kind="image" data-ds-label="Logo Mała Nauka" style="${position([26,102,180,140])}">${slice([26,102,180,140])}</span>
   <button type="button" class="home-settings-button home-art-button" data-action="settings" aria-label="Ustawienia" style="${position(SETTINGS)}">${slice(SETTINGS)}</button>
  </header>
  <div class="home-greeting-live"><span>Hej&nbsp;</span><span class="home-nickname">${escape(nickname)}</span><span>!</span></div>
  <h1 class="home-sr-only" tabindex="-1">sprawdź swoje postępy.</h1>
  <p class="home-sr-only">Świetnie Ci idzie, co dalej?</p>
  <section class="home-stats" data-ds-label="Kafel moich postępów" style="${position(STATS)}">
   <div class="home-stat" data-ds-key="home-today" data-ds-label="Dziś rozwiązane"><span class="home-icon" data-ds-key="home-target" data-ds-kind="icon" data-ds-label="Tarcza ze strzałą">${homeStatIcon('target')}</span><div><strong class="home-stat-value">${escape(today)}</strong><span class="home-stat-label">Dziś rozwiązane</span></div></div>
   <div class="home-stat" data-ds-key="home-last" data-ds-label="Ostatni wynik"><span class="home-icon" data-ds-key="home-star" data-ds-kind="icon" data-ds-label="Złota gwiazda na podkładzie">${homeStatIcon('star')}</span><div><strong class="home-stat-value">${escape(lastScore)}</strong><span class="home-stat-label">${escape(lastLabel)}</span></div></div>
   <button type="button" class="home-progress-arrow" data-action="history" data-ds-key="home-progress-arrow" aria-label="Moje wyniki"><span class="home-icon" data-ds-key="home-arrow-icon">${homeStatIcon('chevron')}</span></button>
  </section>
  <section class="home-adventures" style="${position([26,1162,801,68])}"><h2 id="home-modes-title">Wybierz swoją przygodę</h2><p>5 trybów</p></section>
  <nav class="home-game-buttons" aria-labelledby="home-modes-title">${modeIds.map(mode=>`<button type="button" class="home-game-button home-art-button" data-action="choose-mode" data-mode="${mode}" data-ds-key="home-mode-${mode}" style="${position(TILES[mode])}"><span class="home-tile-surface" aria-hidden="true" data-ds-key="home-${mode}-surface" data-ds-kind="container" data-ds-label="Podkład · ${escape(modes[mode].name)}">${homeTileSurface(mode)}</span><span class="home-tile-decoration" aria-hidden="true" data-ds-key="home-${mode}-decoration" data-ds-kind="icon" data-ds-label="Tło wektorowe · ${escape(modes[mode].name)}">${homeTileDecoration(mode)}</span><span class="home-mode-badge" data-ds-key="home-${mode}-badge" data-ds-kind="container" data-ds-label="Podkład ikony · ${escape(modes[mode].name)}"><span class="home-badge-surface" aria-hidden="true" data-ds-key="home-${mode}-badge-surface" data-ds-kind="icon" data-ds-label="Powierzchnia ikony">${homeBadgeSurface(mode)}</span>${mode==='spelling'||mode==='math'?`<span class="home-mode-symbol" data-ds-key="home-${mode}-symbol">${mode==='spelling'?'abc':'1+2'}</span>`:`<span class="home-mode-glyph" aria-hidden="true" data-ds-key="home-${mode}-glyph" data-ds-kind="icon" data-ds-label="${({english:'Flaga Wielkiej Brytanii',flags:'Mapa świata',reading:'Otwarta książka'})[mode]}">${homeModeGlyph(mode)}</span>`}</span><span class="home-tile-name" data-ds-key="home-${mode}-name">${escape(modes[mode].name)}</span></button>`).join('')}</nav>
 </section>`;
}
