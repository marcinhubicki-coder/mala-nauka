// The approved drawing is also the source of its custom static lettering.
// The atlas is shared by the decorative backdrop and five real, accessible buttons.
// Coordinates use the design's 853 × 1844 canvas; iOS draws its own system bars.
import {iconSVG} from './shared/element-system.mjs';
const ART='assets/home/home-retina.webp';
const WIDTH=853, HEIGHT=1844, TOP=100, CONTENT_HEIGHT=1670;
const SETTINGS=[709,122,103,103], STATS=[10,940,833,210];
const TILES={
 spelling:[26,1240,269,260],
 math:[295,1240,266,260],
 english:[560,1240,267,260],
 flags:[26,1499,398,262],
 reading:[428,1499,399,262]
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
   <div class="home-stat" data-ds-key="home-today" data-ds-label="Dziś rozwiązane"><span class="home-icon" data-ds-key="home-target" style="color:#fa438f">${iconSVG('target')}</span><div><strong class="home-stat-value">${escape(today)}</strong><span class="home-stat-label">Dziś rozwiązane</span></div></div>
   <div class="home-stat" data-ds-key="home-last" data-ds-label="Ostatni wynik"><span class="home-icon" data-ds-key="home-star" style="color:#ffc400">${iconSVG('star')}</span><div><strong class="home-stat-value">${escape(lastScore)}</strong><span class="home-stat-label">${escape(lastLabel)}</span></div></div>
   <button type="button" class="home-progress-arrow" data-action="history" data-ds-key="home-progress-arrow" aria-label="Moje postępy"><span class="home-icon" data-ds-key="home-arrow-icon">${iconSVG('arrow')}</span></button>
  </section>
  <section class="home-adventures" style="${position([26,1162,801,68])}"><h2 id="home-modes-title">Wybierz swoją przygodę</h2><p>5 trybów</p></section>
  <nav class="home-game-buttons" aria-labelledby="home-modes-title">${modeIds.map(mode=>`<button type="button" class="home-game-button home-art-button" data-action="choose-mode" data-mode="${mode}" style="${position(TILES[mode])};--tile-color:${({spelling:'#f72487',math:'#06b4f2',english:'#ffc900',flags:'#16c258',reading:'#783aff'})[mode]}"><span class="home-tile-art">${slice(TILES[mode])}</span><span class="home-tile-name">${escape(modes[mode].name)}</span></button>`).join('')}</nav>
 </section>`;
}
