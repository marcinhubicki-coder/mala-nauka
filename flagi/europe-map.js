(() => {
  const STYLE_ID = 'continent-map-styles';
  const WORLD_MAP_URL = 'https://cdn.jsdelivr.net/gh/melenaos/Menelabs.VectorAtlas@98bc8b95ee210012c32b02805d21a8de77a04507/dist/world.svg';
  const CONTEXT_IDS = Object.freeze({
    europe: ['xk'],
    asia: ['tw'],
    africa: ['eh'],
    'north-america': ['gl','pr'],
    'south-america': ['fk'],
    oceania: ['nc']
  });
  const LABELS = Object.freeze({
    europe: { pl: 'Europy', en: 'Europe' },
    asia: { pl: 'Azji', en: 'Asia' },
    africa: { pl: 'Afryki', en: 'Africa' },
    'north-america': { pl: 'Ameryki Północnej', en: 'North America' },
    'south-america': { pl: 'Ameryki Południowej', en: 'South America' },
    oceania: { pl: 'Oceanii', en: 'Oceania' }
  });
  let sourcePromise = null;

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
      .continent-map-canvas { width: min(100%, 540px); min-height: 0; display: grid; place-items: center; }
      .continent-map-canvas svg { display: block; width: 100%; height: 180px; overflow: visible; }
      .continent-map-canvas .country {
        fill: #dfe7ef;
        stroke: #fff;
        stroke-width: 1.45;
        stroke-linejoin: round;
        vector-effect: non-scaling-stroke;
        transition: fill .22s ease, opacity .22s ease, filter .22s ease, transform .22s ease;
      }
      .continent-map-canvas .country:not(.is-highlighted) { opacity: .74; }
      .continent-map-canvas .country.is-highlighted {
        fill: #e78a41;
        opacity: 1;
        filter: drop-shadow(0 0 6px rgba(190, 102, 31, .48));
        transform-box: fill-box;
        transform-origin: center;
        animation: continent-country-pulse .56s cubic-bezier(.2,.8,.25,1) both;
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
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  function loadSource() {
    sourcePromise ||= fetch(WORLD_MAP_URL, { cache: 'force-cache' }).then(response => {
      if (!response.ok) throw new Error(`Map unavailable: ${response.status}`);
      return response.text();
    });
    return sourcePromise;
  }

  function supports(countryId, continent) {
    return Boolean(String(countryId || '').trim() && LABELS[continent]);
  }

  function cropToContinent(svg, continentIds) {
    const allowed = new Set(continentIds.map(id => String(id).toLowerCase()));
    svg.querySelectorAll('path[id]').forEach(path => {
      const id = path.id.toLowerCase();
      if (!allowed.has(id)) {
        path.remove();
        return;
      }
      path.classList.add('country');
      path.dataset.country = id;
      path.removeAttribute('style');
    });

    const countries = [...svg.querySelectorAll('.country')];
    if (!countries.length) return false;

    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for (const country of countries) {
      const box = country.getBBox();
      if (!Number.isFinite(box.x) || !Number.isFinite(box.y)) continue;
      minX=Math.min(minX,box.x);
      minY=Math.min(minY,box.y);
      maxX=Math.max(maxX,box.x+box.width);
      maxY=Math.max(maxY,box.y+box.height);
    }
    if (![minX,minY,maxX,maxY].every(Number.isFinite)) return false;

    const width=maxX-minX;
    const height=maxY-minY;
    const padX=Math.max(width*.055,8);
    const padY=Math.max(height*.07,8);
    svg.setAttribute('viewBox',`${minX-padX} ${minY-padY} ${width+padX*2} ${height+padY*2}`);
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');
    return true;
  }

  async function mount(target, options = {}) {
    if (!target) return { found: false, svg: null };
    const countryId = String(options.countryId || '').toLowerCase();
    const countryName = String(options.countryName || '');
    const continent = String(options.continent || '').toLowerCase();
    const continentIds = [...new Set([...(options.continentIds || []), ...(CONTEXT_IDS[continent] || [])])];
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

    if (!supports(countryId, continent) || !continentIds.length) {
      target.classList.remove('is-loading');
      target.classList.add('is-unavailable');
      return { found: false, svg: null };
    }

    try {
      const source = await loadSource();
      const canvas = target.querySelector('.continent-map-canvas');
      if (!canvas || !target.isConnected) return { found: false, svg: null };
      canvas.innerHTML = source;
      const svg = canvas.querySelector('svg');
      if (!svg) throw new Error('Missing SVG root');

      if (!cropToContinent(svg, continentIds)) throw new Error(`Missing continent ${continent}`);
      svg.setAttribute('aria-hidden', interactive ? 'false' : 'true');
      svg.setAttribute('focusable', 'false');

      const active = svg.querySelector(`#${CSS.escape(countryId)}, [data-country="${countryId}"]`);
      if (!active) throw new Error(`Missing country ${countryId} on ${continent}`);
      active.classList.add('country','is-highlighted');
      active.dataset.country = countryId;

      if (interactive) {
        svg.querySelectorAll('.country').forEach(country => {
          country.setAttribute('tabindex', '0');
          country.setAttribute('role', 'button');
        });
        const activate = event => {
          const country = event.target.closest?.('.country');
          if (!country || !svg.contains(country)) return;
          options.onSelect?.(country.dataset.country || country.id, country, event);
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
      console.warn('[flags-map]', error);
      return { found: false, svg: null };
    }
  }

  const api = Object.freeze({ mount, supports, worldMapUrl: WORLD_MAP_URL });
  window.MalaNaukaContinentMap = api;
  window.MalaNaukaEuropeMap = api;
})();
