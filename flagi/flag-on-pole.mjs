const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const FLAG_STRIPS=16;
// Every strip samples the same unmodified SVG. Only the cloth geometry moves.
// Nepal retains its transparent double-pennant shape; Switzerland stays square.
export function flagOnPole(record,{label='Flaga do rozpoznania'}={}){
  const source=record.flagSvg,ratio=record.id==='ch'||record.id==='va'?'1':'4 / 3';
  const cloth=record.id==='np'
    ? `<img class="flag-cloth-shape" src="${esc(source)}" alt="" width="240" height="180">`
    : Array.from({length:FLAG_STRIPS},(_,index)=>{
      const phase=index/(FLAG_STRIPS-1),wave=Math.sin(phase*Math.PI*2-.4);
      return `<span class="flag-cloth-strip" style="--strip-left:${index*100/FLAG_STRIPS}%;--strip-position:${index*100/(FLAG_STRIPS-1)}%;--strip-delay:${-index*.09}s;--strip-wave:${wave.toFixed(3)};--strip-shade:${(.055+.055*Math.sin(phase*Math.PI*4)).toFixed(3)}"></span>`;
    }).join('');
  return `<div class="flag-on-pole" role="img" aria-label="${esc(label)}" style="--flag-image:url(&quot;${esc(source)}&quot;);--flag-ratio:${ratio}"><span class="flag-pole" aria-hidden="true"></span><div class="flag-cloth ${record.id==='np'?'preserve-shape':''}" aria-hidden="true">${cloth}</div><span class="flag-clouds" aria-hidden="true"></span></div>`;
}
