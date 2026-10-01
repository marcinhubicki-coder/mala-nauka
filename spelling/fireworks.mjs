// A finite burst of transforms and opacity, with no canvas, polling or loop.
export function burstFireworks(host) {
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.hidden)return () => {};
  const burst=document.createElement('div');burst.className='spelling-fireworks';burst.setAttribute('aria-hidden','true');
  const colors=['#ff4ca0','#934dff','#ffc82f','#52ce9a','#4cafff'];
  burst.innerHTML=Array.from({length:30},(_,i)=>{
    const angle=(i%10)*Math.PI/5;
    const distance=38+(i%4)*15;
    return '<i class="'+(i%4===0?'firework-star':'firework-dot')+'" style="--burst-left:'+([22,52,80][Math.floor(i/10)])+'%;--burst-top:'+([72,88,68][Math.floor(i/10)])+'%;--burst-x:'+Math.cos(angle)*distance+'px;--burst-y:'+Math.sin(angle)*distance+'px;--burst-color:'+colors[i%5]+';--burst-delay:'+(Math.floor(i/10)*70)+'ms;--burst-turn:'+((i%2?1:-1)*120)+'deg"></i>';
  }).join('');
  host.append(burst);
  const timer=setTimeout(()=>burst.remove(),1100);
  return ()=>{clearTimeout(timer);burst.remove();};
}
