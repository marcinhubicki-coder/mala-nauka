// Compatibility entry point: there is no separate mock game renderer.
location.replace(new URL('../?studio=1&mode=spelling&screen=game&state=initial&effectLab=1',import.meta.url).href);
