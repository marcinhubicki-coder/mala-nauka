// One timing source for the isolated scenic variant, also used by visual QA.
export const SCENIC = Object.freeze({
  seconds: 166, memoryMs: 3900, openMs: 880, closeMs: 860, inkDrawMs: 2100, inkEraseMs: 1050,
  sandMs: 1550, sandFall: .36, sandSettle: .55, grainsPerLetter: 15,
  // Cloth anchors to the mast painted in the single full-screen scene.
  mast: Object.freeze({attachX:.288, attachY:.283}),
  atlas: Object.freeze({top:.160,height:.434,headerHeight:90,viewMs:520}),
  flagTimeoutMs: 5000, mapTimeoutMs: 6000, maxDpr: 2
});
export const seedOf = value => [...String(value)].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,13579);
export function randomFrom(seed) {
  return () => ((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
}
