// The thumb adapts to typed values; the safety bound never changes.
export function dynamicRange(value,saved,min,softMax,hardMax=softMax){const next=Math.max(softMax,value,saved);return[min,Math.min(hardMax,next>softMax?Math.ceil(next*1.15):softMax)];}
export function expandRange(input,value,saved,min,softMax,hardMax){const [a,b]=dynamicRange(value,saved,min,softMax,hardMax);input.min=a;input.max=b;input.value=value;return[a,b];}
