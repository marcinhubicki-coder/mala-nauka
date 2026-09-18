(() => {
  const STYLE_ID = 'continent-map-styles';
  const MAP_URLS = Object.freeze({
    europe: 'assets/maps/europe.svg',
    asia: 'assets/maps/asia.svg',
    africa: 'assets/maps/africa.svg',
    'north-america': 'assets/maps/north-america.svg',
    'south-america': 'assets/maps/south-america.svg',
    oceania: 'assets/maps/oceania.svg'
  });
  const VIEWBOX_OVERRIDES = Object.freeze({
    // asia.svg keeps the complete source geometry, but its original 760-wide viewBox
    // has a large empty strip east of Japan. This tighter educational framing keeps
    // Turkey / the Middle East and Japan while giving the continent much more scale.
    asia: '35 0 555 420'
  });
  const LABELS = Object.freeze({
    europe: { pl: 'Europy', en: 'Europe' },
    asia: { pl: 'Azji', en: 'Asia' },
    africa: { pl: 'Afryki', en: 'Africa' },
    'north-america': { pl: 'Ameryki Północnej', en: 'North America' },
    'south-america': { pl: 'Ameryki Południowej', en: 'South America' },
    oceania: { pl: 'Oceanii', en: 'Oceania' }
  });
  const sourcePromises = new Map();

  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .continent-map-host {
        width: 100%;
        min-height: 180px;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        align-items: stretch;
        justify-items: center;
        gap: 2px;
        overflow: hidden;
      }
      .continent-map-host.no-copy { grid-template-rows: minmax(0, 1fr); }
      .continent-map-copy { font-size: 11px; line-height: 1.2; color: #758399; text-align: center; }
      .continent-map-copy strong { color: #8c5b2b; font-weight: 850; }
      .continent-map-canvas { width: min(100%, 560px); min-height: 0; display: grid; place-items: center; }
      .continent-map-canvas svg { display: block; width: 100%; height: 100%; max-height: 430px; overflow: visible; }
      .continent-map-canvas .country {
        fill: #dfe7ef;
        stroke: #fff;
        stroke-width: 1.45;
        stroke-linejoin: round;
        vector-effect: non-scaling-stroke;
        transition: fill .22s ease, opacity .22s ease, filter .22s ease, transform .22s ease;
      }
      .continent-map-canvas .country:not(.is-highlighted) { opacity: .78; }
      .continent-map-canvas .country.is-highlighted {
        fill: #e78a41;
        opacity: 1;
        filter: drop-shadow(0 0 6px rgba(190, 102, 31, .48));
        transform-box: fill-box;
        transform-origin: center;
        animation: continent-country-pulse .56s cubic-bezier(.2,.8,.25,1) both;
      }
      .continent-map-canvas .small-country.is-highlighted {
        stroke: #fff;
        stroke-width: 2.2;
      }
      .continent-map-host.is-loading .continent-map-canvas::before {
        content: '';
        width: 24px;
        height: 24px;
        border: 2px solid #d8e0e9;
        border-top-color: #b2763e;
        border-radius: 50%;
        animation: continent-map-spin .75s linear infinite;
      }
      .continent-map-host.is-unavailable { min-height: 0; }
      .continent-map-host.is-unavailable .continent-map-canvas { display: none; }
      .continent-map-host.is-interactive .country { cursor: pointer; pointer-events: auto; }
      .continent-map-host.is-interactive .country:focus-visible {
        outline: none;
        filter: drop-shadow(0 0 5px rgba(71, 109, 165, .7));
      }
      @keyframes continent-country-pulse {
        0% { transform: scale(.97); }
        58% { transform: scale(1.045); }
        100% { transform: scale(1); }
      }
      @keyframes continent-map-spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) {
        .continent-map-canvas .country,
        .continent-map-host.is-loading .continent-map-canvas::before {
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
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#39;');

  function supports(countryId, continent) {
    return Boolean(String(countryId || '').trim() && MAP_URLS[continent]);
  }

  function loadSource(continent) {
    const url = MAP_URLS[continent];
    if (!url) return Promise.reject(new Error(`Unknown continent: ${continent}`));
    if (!sourcePromises.has(continent)) {
      sourcePromises.set(continent, fetch(url, { cache: 'force-cache' }).then(response => {
        if (!response.ok) throw new Error(`Map unavailable: ${response.status} (${url})`);
        return response.text();
      }));
    }
    return sourcePromises.get(continent);
  }

  async function mount(target, options = {}) {
    if (!target) return { found: false, svg: null };
    const countryId = String(options.countryId || '').toLowerCase();
    const countryName = String(options.countryName || '');
    const continent = String(options.continent || '').toLowerCase();
    const interactive = Boolean(options.interactive);
    const showCopy = options.showCopy !== false;
    const language = options.language === 'en' ? 'en' : 'pl';
    const continentLabel = LABELS[continent]?.[language] || continent;

    target.className = `continent-map-host is-loading${interactive ? ' is-interactive' : ''}${showCopy ? '' : ' no-copy'}`;
    target.dataset.continent = continent;
    target.setAttribute('aria-label', countryName
      ? (language === 'en' ? `Location of ${countryName} on the map of ${continentLabel}` : `Położenie kraju ${countryName} na mapie ${continentLabel}`)
      : (language === 'en' ? `Map of ${continentLabel}` : `Mapa ${continentLabel}`));

    const copy = showCopy
      ? `<div class="continent-map-copy">${language === 'en' ? 'This is' : 'Tu leży'} <strong>${safe(countryName)}</strong></div>`
      : '';
    target.innerHTML = `${copy}<div class="continent-map-canvas" aria-hidden="${interactive ? 'false' : 'true'}"></div>`;

    if (!supports(countryId, continent)) {
      target.classList.remove('is-loading');
      target.classList.add('is-unavailable');
      return { found: false, svg: null };
    }

    try {
      const source = await loadSource(continent);
      const canvas = target.querySelector('.continent-map-canvas');
      if (!canvas || !target.isConnected) return { found: false, svg: null };
      canvas.innerHTML = source;
      const svg = canvas.querySelector('svg');
      if (!svg) throw new Error('Missing SVG root');

      svg.setAttribute('aria-hidden', interactive ? 'false' : 'true');
      svg.setAttribute('focusable', 'false');
      svg.dataset.continent = continent;
      if (VIEWBOX_OVERRIDES[continent]) svg.setAttribute('viewBox', VIEWBOX_OVERRIDES[continent]);

      const active = svg.querySelector(`[data-country="${countryId}"]`);
      if (!active) throw new Error(`Missing country ${countryId} on ${continent}`);
      active.classList.add('is-highlighted');

      if (interactive) {
        svg.querySelectorAll('.country[data-country]').forEach(country => {
          country.setAttribute('tabindex', '0');
          country.setAttribute('role', 'button');
        });
        const activate = event => {
          const country = event.target.closest?.('.country[data-country]');
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
      return { found: true, svg, active, continent };
    } catch (error) {
      target.classList.remove('is-loading');
      target.classList.add('is-unavailable');
      target.dataset.error = error?.message || 'map-error';
      console.warn('[flags-map]', error);
      return { found: false, svg: null, error };
    }
  }

  const api = Object.freeze({ mount, supports, mapUrls: MAP_URLS });
  window.MalaNaukaContinentMap = api;
  window.MalaNaukaEuropeMap = api;
})();
