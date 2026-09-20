function letters(text) {
  return [...text].map(char => {
    const span = document.createElement('span');
    span.className = 'ink-letter';
    span.textContent = char;
    return span;
  });
}

export function createWord(masked) {
  const word = document.createElement('div');
  word.className = 'word';
  word.setAttribute('aria-hidden', 'true');
  const [before, after] = masked.split('_');

  const left = document.createElement('span');
  left.className = 'word-side word-before';
  left.append(...letters(before));

  const right = document.createElement('span');
  right.className = 'word-side word-after';
  right.append(...letters(after));

  const gap = document.createElement('span');
  gap.className = 'gap';
  gap.innerHTML = '<span class="bubble-glass"></span><i class="word-spark star-a"></i><i class="word-spark star-b"></i><i class="word-spark star-c"></i><i class="word-spark star-d"></i>';

  word.append(left, gap, right);
  return word;
}

export function revealWord(word, answer, reduced) {
  const gap = word.querySelector('.gap');
  if (!gap || gap.classList.contains('is-revealed')) return Promise.resolve();

  const slot = document.createElement('span');
  slot.className = 'revealed-slot';
  const text = document.createElement('span');
  text.className = 'revealed-chunk';
  text.textContent = answer;
  slot.append(text);
  gap.append(slot);

  const startWidth = gap.getBoundingClientRect().width;
  const textWidth = Math.ceil(text.getBoundingClientRect().width + 2);
  const targetWidth = Math.max(18, textWidth);
  gap.style.width = `${startWidth}px`;
  gap.style.flexBasis = `${startWidth}px`;
  gap.classList.add('is-revealed');

  if (reduced) {
    gap.style.width = `${targetWidth}px`;
    gap.style.flexBasis = `${targetWidth}px`;
    return Promise.resolve();
  }

  flowInk([text], 'in').forEach(animation => animation.finished.then(() => animation.cancel()).catch(() => {}));

  const delta = targetWidth - startWidth;
  const overshoot = targetWidth + (delta < 0 ? -2 : 2);
  const settle = targetWidth + (delta < 0 ? 1 : -1);
  const compact = gap.animate([
    {width:`${startWidth}px`,flexBasis:`${startWidth}px`},
    {width:`${overshoot}px`,flexBasis:`${overshoot}px`,offset:.62},
    {width:`${settle}px`,flexBasis:`${settle}px`,offset:.82},
    {width:`${targetWidth}px`,flexBasis:`${targetWidth}px`}
  ], {duration:430,delay:150,easing:'cubic-bezier(.22,.8,.32,1)',fill:'forwards'});

  const left = word.querySelector('.word-before');
  const right = word.querySelector('.word-after');
  [left,right].forEach((side,index)=>{
    if(!side) return;
    const sign=index===0?1:-1;
    const animation=side.animate([
      {transform:'translateX(0) scaleX(1)'},
      {transform:`translateX(${sign*2.4}px) scaleX(.985)`,offset:.55},
      {transform:`translateX(${-sign*.8}px) scaleX(1.008)`,offset:.8},
      {transform:'translateX(0) scaleX(1)'}
    ],{duration:430,delay:150,easing:'cubic-bezier(.22,.8,.32,1)'});
    animation.finished.then(()=>animation.cancel()).catch(()=>{});
  });

  return compact.finished.then(()=>{
    gap.style.width = `${targetWidth}px`;
    gap.style.flexBasis = `${targetWidth}px`;
    compact.cancel();
  }).catch(()=>{});
}

export function flowInk(elements, direction) {
  const entering = direction === 'in';
  return elements.map((element, index) => {
    const delay = 12 + Math.random() * 55 + (index % 4) * 14;
    const clear = { opacity: 1, transform: 'translate3d(0,0,0) scale(1)' };
    const dissolved = { opacity: 0, transform: `translate3d(${Math.random()*2-1}px,${entering?7:-7}px,0) scale(.985)` };
    const middle = { opacity: .58, transform: `translate3d(0,${entering?1.5:-1.5}px,0) scale(1.012)`, offset: .56 };
    return element.animate(entering ? [dissolved,middle,clear] : [clear,middle,dissolved], {
      duration: entering ? 430 : 320,
      delay,
      easing: 'cubic-bezier(.22,.61,.36,1)',
      fill: 'both',
    });
  });
}
