(() => {
  const MARKERS = Object.freeze({
    europe: Object.freeze({
      ad: [176.0, 397.0],
      li: [263.0, 342.0],
      mc: [251.0, 384.0],
      sm: [298.0, 389.0],
      va: [290.0, 407.0],
      mt: [303.0, 488.0]
    })
  });

  const original = window.MalaNaukaContinentMap;
  if (!original?.mount) return;

  function addInteractiveHandlers(svg, options) {
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

  async function mount(target, options = {}) {
    const result = await original.mount(target, options);
    if (result?.found) return result;

    const continent = String(options.continent || '').toLowerCase();
    const countryId = String(options.countryId || '').toLowerCase();
    const point = MARKERS[continent]?.[countryId];
    const svg = target?.querySelector('svg');
    if (!point || !svg) return result;

    const ns = 'http://www.w3.org/2000/svg';
    const marker = document.createElementNS(ns, 'circle');
    marker.setAttribute('class', 'country small-country is-highlighted');
    marker.setAttribute('data-country', countryId);
    marker.setAttribute('cx', String(point[0]));
    marker.setAttribute('cy', String(point[1]));
    marker.setAttribute('r', '4.1');
    marker.setAttribute('vector-effect', 'non-scaling-stroke');
    (svg.querySelector('g') || svg).append(marker);

    target.classList.remove('is-loading', 'is-unavailable');
    delete target.dataset.error;

    if (options.interactive) addInteractiveHandlers(svg, options);

    return { found: true, svg, active: marker, continent, fallbackMarker: true };
  }

  const api = Object.freeze({ ...original, mount, microstateMarkers: MARKERS });
  window.MalaNaukaContinentMap = api;
  window.MalaNaukaEuropeMap = api;
})();
