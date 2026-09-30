// One viewport for every screen. iOS standalone can under-report 100dvh by
// the status-bar height while still drawing beneath that translucent bar.
(() => {
  const style = document.documentElement.style;
  function syncViewport() {
    const portrait = window.innerWidth < window.innerHeight;
    const width = portrait ? Math.min(screen.width, screen.height) : Math.max(screen.width, screen.height);
    const height = portrait ? Math.max(screen.width, screen.height) : Math.min(screen.width, screen.height);
    const fullScreen = navigator.standalone === true && Math.abs(width - window.innerWidth) < 2;
    const viewport = window.visualViewport;
    const editing = document.activeElement?.matches('input, textarea, [contenteditable="true"]');
    const keyboard = editing && viewport && viewport.height < height * .75;
    if (fullScreen) style.setProperty('--app-viewport-height', `${keyboard ? viewport.height : height}px`);
    else style.removeProperty('--app-viewport-height');
  }
  syncViewport();
  window.addEventListener('resize', syncViewport, { passive: true });
  window.addEventListener('pageshow', syncViewport);
  window.visualViewport?.addEventListener('resize', syncViewport, { passive: true });
  document.addEventListener('focusin', syncViewport);
  document.addEventListener('focusout', () => requestAnimationFrame(syncViewport));
})();
