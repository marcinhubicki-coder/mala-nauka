(() => {
  const STYLE_ID = 'europe-map-styles';
  const MAP_URL = 'assets/maps/europe.svg';
  const COUNTRY_IDS = new Set([
    'al','at','ba','be','bg','by','ch','cy','cz','de','dk','ee','es','fi','fr','gb','gr','hr','hu','ie','is','it',
    'lt','lu','lv','md','me','mk','nl','no','pl','pt','ro','rs','ru','se','si','sk','tr','ua','xk'
  ]);
  let sourcePromise = null;

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .europe-map-host {
        width: 100%;
        min-height: 138px;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        align-items: stretch;
        justify-items: center;
        gap: 2px;
        overflow: hidden;
      }

      .europe-map-host.no-copy {
        grid-template-rows: minmax(0, 1fr);
      }

      .europe-map-copy {
        font-size: 11px;
        line-height: 1.2;
        color: #758399;
        text-align: center;
      }

      .europe-map-copy strong {
        color: #8c5b2b;
        font-weight: 850;
      }

      .europe-map-canvas {
        width: min(100%, 310px);
        min-height: 0;
        display: grid;
        place-items: center;
      }

      .europe-map-canvas svg {
        display: block;
        width: 100%;
        height: 118px;
        overflow: visible;
      }

      .europe-map-canvas .country {
        fill: #dfe7ef;
        stroke: #fff;
        stroke-width: 1.4;
        stroke-linejoin: round;
        vector-effect: non-scaling-stroke;
        transition: fill .22s ease, opacity .22s ease, filter .22s ease;
      }

      .europe-map-canvas .country:not(.is-highlighted) {
        opacity: .72;
      }

      .europe-map-canvas .country.is-highlighted {
        fill: #e78a41;
        opacity: 1;
        filter: drop-shadow(0 0 5px rgba(190, 102, 31, .42));
        transform-box: fill-box;
        transform-origin: center;
        animation: europe-country-pulse .56s cubic-bezier(.2,.8,.25,1) both;
      }

      .europe-map-host.is-loading .europe-map-canvas::before {
        content: '';
        width: 24px;
        height: 24px;
        border: 2px solid #d8e0e9;
        border-top-color: #b2763e;
        border-radius: 50%;
        animation: europe-map-spin .75s linear infinite;
      }

      .europe-map-host.is-unavailable {
        min-height: 0;
      }

      .europe-map-host.is-unavailable .europe-map-canvas {
        display: none;
      }

      .europe-map-host.is-interactive .country {
        cursor: pointer;
        pointer-events: auto;
      }

      .europe-map-host.is-interactive .country:focus-visible {
        outline: none;
        filter: drop-shadow(0 0 5px rgba(71, 109, 165, .7));
      }

      @keyframes europe-country-pulse {
        0% { transform: scale(.97); }
        58% { transform: scale(1.035); }
        100% { transform: scale(1); }
      }

      @keyframes europe-map-spin { to { transform: rotate(360deg); } }

      @media (prefers-reduced-motion: reduce) {
        .europe-map-canvas .country,
        .europe-map-host.is-loading .europe-map-canvas::before {
          animation: none !important;
          transition: none !important;
        }
      }
    `;
    document.head.append(style);
  }

  const safe = value => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  function loadSource() {
    sourcePromise ||= fetch(MAP_URL, { cache: 'force-cache' }).then(response => {
      if (!response.ok) throw new Error(`Map unavailable: ${response.status}`);
      return response.text();
    });
    return sourcePromise;
  }

  function supports(countryId) {
    return COUNTRY_IDS.has(String(countryId || '').toLowerCase());
  }

  async function mount(target, options = {}) {
    if (!target) return { found: false, svg: null };
    const countryId = String(options.countryId || '').toLowerCase();
    const countryName = String(options.countryName || '');
    const interactive = Boolean(options.interactive);
    const showCopy = options.showCopy !== false;
    const language = options.language === 'en' ? 'en' : 'pl';

    target.className = `europe-map-host is-loading${interactive ? ' is-interactive' : ''}${showCopy ? '' : ' no-copy'}`;
    target.setAttribute('aria-label', countryName
      ? (language === 'en' ? `Location of ${countryName} on the map of Europe` : `Położenie kraju ${countryName} na mapie Europy`)
      : (language === 'en' ? 'Map of Europe' : 'Mapa Europy'));

    const copy = showCopy
      ? `<div class="europe-map-copy">${language === 'en' ? 'This is' : 'Tu leży'} <strong>${safe(countryName)}</strong></div>`
      : '';
    target.innerHTML = `${copy}<div class="europe-map-canvas" aria-hidden="${interactive ? 'false' : 'true'}"></div>`;

    if (!supports(countryId)) {
      target.classList.remove('is-loading');
      target.classList.add('is-unavailable');
      return { found: false, svg: null };
    }

    try {
      const source = await loadSource();
      const canvas = target.querySelector('.europe-map-canvas');
      if (!canvas || !target.isConnected) return { found: false, svg: null };
      canvas.innerHTML = source;
      const svg = canvas.querySelector('svg');
      if (!svg) throw new Error('Missing SVG root');

      svg.setAttribute('aria-hidden', interactive ? 'false' : 'true');
      svg.setAttribute('focusable', 'false');
      const active = svg.querySelector(`[data-country="${countryId}"]`);
      if (!active) throw new Error(`Missing country ${countryId}`);
      active.classList.add('is-highlighted');

      if (interactive) {
        svg.querySelectorAll('[data-country]').forEach(country => {
          country.setAttribute('tabindex', '0');
          country.setAttribute('role', 'button');
        });
        const activate = event => {
          const country = event.target.closest?.('[data-country]');
          if (!country || !svg.contains(country)) return;
          options.onSelect?.(country.dataset.country, country, event);
        };
        svg.addEventListener('click', activate);
        svg.addEventListener('keydown', event => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          activate(event);
        });
      }

      target.classList.remove('is-loading');
      return { found: true, svg, active };
    } catch (error) {
      target.classList.remove('is-loading');
      target.classList.add('is-unavailable');
      console.warn('[flags-map]', error);
      return { found: false, svg: null };
    }
  }

  window.MalaNaukaEuropeMap = Object.freeze({ mount, supports, countryIds: COUNTRY_IDS });
})();
