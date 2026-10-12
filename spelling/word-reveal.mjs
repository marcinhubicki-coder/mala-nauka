const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function wordMarkup(masked){
 const [before,after]=String(masked).split('_');
 return `<div class="word" data-ds-kind="text" data-ds-recipe="text-spelling-word" data-ds-atomic="true" aria-hidden="true"><span class="word-side word-before">${escape(before)}</span><span class="gap"><span class="bubble-glass"></span><i class="word-spark star-a"></i><i class="word-spark star-b"></i><i class="word-spark star-c"></i><i class="word-spark star-d"></i></span><span class="word-side word-after">${escape(after)}</span></div>`;
}
export function createWord(masked) {
 const template=document.createElement('template');template.innerHTML=wordMarkup(masked);
 return template.content.firstElementChild;
}

export function revealWord(word, answer, reduced) {
  const gap = word.querySelector('.gap');
  if (!gap || gap.classList.contains('is-revealed')) return Promise.resolve();

  const text = document.createElement('span');
  text.className = 'revealed-chunk';
  text.textContent = answer;
  gap.append(text);

  const startWidth = gap.getBoundingClientRect().width;
  text.style.visibility = 'hidden';
  text.style.position = 'absolute';
  const targetWidth = Math.max(18, Math.ceil(text.getBoundingClientRect().width + 2));
  text.style.removeProperty('visibility');
  text.style.removeProperty('position');

  gap.style.width = `${startWidth}px`;
  gap.style.flexBasis = `${startWidth}px`;

  // One simple text box: reveal the answer and let flexbox move both word sides.
  void gap.offsetWidth;
  gap.classList.add('is-revealed');

  if (reduced) {
    gap.style.width = `${targetWidth}px`;
    gap.style.flexBasis = `${targetWidth}px`;
    return Promise.resolve();
  }

  return new Promise(resolve => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      gap.removeEventListener('transitionend', onEnd);
      gap.style.width = `${targetWidth}px`;
      gap.style.flexBasis = `${targetWidth}px`;
      resolve();
    };
    const onEnd = event => {
      if (event.target === gap && (event.propertyName === 'width' || event.propertyName === 'flex-basis')) finish();
    };
    gap.addEventListener('transitionend', onEnd);
    requestAnimationFrame(() => {
      gap.style.width = `${targetWidth}px`;
      gap.style.flexBasis = `${targetWidth}px`;
    });
    setTimeout(finish, 320);
  });
}

export function flowInk(elements, direction) {
  const entering = direction === 'in';
  return elements.map(element => element.animate(
    entering
      ? [{ opacity: 0, transform: 'translateY(3px)' }, { opacity: 1, transform: 'translateY(0)' }]
      : [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-3px)' }],
    {
      duration: entering ? 180 : 140,
      easing: 'ease-out',
      fill: 'both',
    }
  ));
}
