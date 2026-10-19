// One timing source for the isolated scenic variant, also used by visual QA.
export const SCENIC = Object.freeze({
  seconds: 166, memoryMs: 3900, openMs: 880, closeMs: 860, inkDrawMs: 2100, inkEraseMs: 1050,
  sandMs: 1700, sandFall: .34, sandSettle: .49, grainsPerLetter: 30,
  // Cloth anchors to the mast painted in the single full-screen scene.
  mast: Object.freeze({imageWidth:852,imageHeight:1846,zoom:1.12,attachX:245,attachY:470}),
  atlas: Object.freeze({compassGap:12,answerGap:10,viewMs:520}),
  neighbors: Object.freeze({rows:3,rowHeight:33,gap:6}),
  feedback: Object.freeze({ribbonMs:480,staggerMs:85,exitDelayMs:300,exitMs:420}),
  flagTimeoutMs: 5000, mapTimeoutMs: 6000, maxDpr: 2
});
export const seedOf = value => [...String(value)].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,13579);
export function randomFrom(seed) {
  return () => ((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
}
