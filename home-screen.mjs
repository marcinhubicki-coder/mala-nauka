// The approved drawing is also the source of its custom static lettering.
// The atlas is shared by the decorative backdrop and five real, accessible buttons.
// Coordinates use the design's 853 × 1844 canvas; iOS draws its own system bars.
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
 return `<section class="home-canvas" aria-label="Mała Nauka">
  <svg class="home-art-backdrop" viewBox="0 ${TOP} ${WIDTH} ${CONTENT_HEIGHT}" aria-hidden="true" focusable="false">
   ${image()}
  </svg>
  <header class="home-header">
   <span class="home-brand-label home-sr-only" role="img" aria-label="Mała Nauka"></span>
   <button type="button" class="home-settings-button home-art-button" data-action="settings" aria-label="Ustawienia" style="${position(SETTINGS)}">${slice(SETTINGS)}</button>
  </header>
  <div class="home-greeting-live"><span>Hej&nbsp;</span><span class="home-nickname">${escape(nickname)}</span><span>!</span></div>
  <h1 class="home-sr-only" tabindex="-1">sprawdź swoje postępy.</h1>
  <p class="home-sr-only">Świetnie Ci idzie, co dalej?</p>
  <button type="button" class="home-progress-button home-art-button" data-action="history" aria-label="Zobacz swoje wyniki. Dziś rozwiązane: ${escape(today)}. Ostatni wynik: ${escape(lastScore)}. ${escape(lastLabel)}." style="${position(STATS)}">
   ${slice(STATS)}
   <span class="home-today-live">${escape(today)}</span><span class="home-sr-only">Dziś rozwiązane</span>
   <span class="home-score-live">${escape(lastScore)}</span>
   <span class="home-last-live" title="${escape(lastLabel)}">${escape(lastLabel)}</span>
  </button>
  <h2 id="home-modes-title" class="home-sr-only">Wybierz swoją przygodę — 5 trybów</h2>
  <nav class="home-game-buttons" aria-labelledby="home-modes-title">${modeIds.map(mode=>`<button type="button" class="home-game-button home-art-button" data-action="choose-mode" data-mode="${mode}" style="${position(TILES[mode])}">${slice(TILES[mode])}<span class="home-sr-only">${escape(modes[mode].name)}</span></button>`).join('')}</nav>
 </section>`;
}
