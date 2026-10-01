// Layout uses measured glyph widths, never character-count guesses or truncation.
export function fitLabel(text, measure, width, {max=23,min=11,lines=2}={}) {
  const words=String(text).trim().split(/\s+/).filter(Boolean);
  if(!words.length)return {size:max,lines:['']};
  for(let size=max;size>=min;size-=.5){
    const joined=words.join(' ');
    if(measure(joined,size)<=width)return {size,lines:[joined]};
    let best=null;
    if(lines>1)for(let split=1;split<words.length;split++){
      const pair=[words.slice(0,split).join(' '),words.slice(split).join(' ')];
      const widths=pair.map(line=>measure(line,size));
      if(Math.max(...widths)>width)continue;
      const score=Math.max(...widths)+Math.abs(widths[0]-widths[1])*.2;
      if(!best||score<best.score)best={size,lines:pair,score};
    }
    if(best)return best;
  }
  return {size:min,lines:[words.join(' ')],scale:Math.min(1,width/Math.max(1,measure(words.join(' '),min)))};
}
