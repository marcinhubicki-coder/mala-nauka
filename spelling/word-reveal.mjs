function letters(text) {
  return [...text].map(char => {
    const span = document.createElement('span'); span.className = 'ink-letter'; span.textContent = char; return span;
  });
}
export function createWord(masked) {
  const word = document.createElement('div'); word.className = 'word'; word.setAttribute('aria-hidden', 'true');
  const [before, after] = masked.split('_');
  const gap = document.createElement('span'); gap.className = 'gap';
  gap.innerHTML = '<span class="bubble-glass"></span><i class="word-spark star-a"></i><i class="word-spark star-b"></i><i class="word-spark star-c"></i><i class="word-spark star-d"></i>';
  word.append(...letters(before), gap, ...letters(after)); return word;
}
export function revealWord(word, answer, reduced) {
  const gap = word.querySelector('.gap'); if (!gap) return;
  // Keep the gap geometry until the word washes away, even for CH / DZI.
  const text = document.createElement('span'); text.className = 'revealed-chunk'; text.textContent = answer;
  text.style.setProperty('--answer-length', String([...answer].length)); gap.append(text); gap.classList.add('is-revealed');
  if (!reduced) flowInk([text], 'in').forEach(animation => animation.finished.then(() => animation.cancel()).catch(() => {}));
}
export function flowInk(elements, direction) {
  const entering = direction === 'in';
  return elements.map((element, index) => {
    const delay = 24 + Math.random() * 130 + (index % 4) * 24;
    const clear = { opacity: 1, filter: 'blur(0px)', transform: 'translate(0, 0) scale(1)', maskSize: '280% 280%' };
    const dissolved = { opacity: 0, filter: 'blur(5px)', transform: `translate(${Math.random() * 3 - 1.5}px, ${entering ? 3 : -3}px) scale(1.025)`, maskSize: '1% 1%' };
    const mist = { opacity: entering ? .42 : .3, filter: 'blur(2px)', transform: 'translate(0, 1px) scale(1.01)', maskSize: '120% 130%', offset: entering ? .5 : .65 };
    return element.animate(entering ? [dissolved, mist, clear] : [clear, mist, dissolved], {
      duration: entering ? 760 : 520, delay, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'both',
    });
  });
}
