// Edge cues are event driven. They disappear at the end of the content and do
// not mask the initial three complete rows of a round summary.
export function watchScrollEdges(shell, scroll, { initialBottom = false } = {}) {
  const update = () => {
    const top = scroll.scrollTop > 2;
    const more = scroll.scrollHeight - scroll.clientHeight - scroll.scrollTop > 2;
    shell.classList.toggle('has-scroll-top', top);
    shell.classList.toggle('has-scroll-more', more && (initialBottom || top));
  };
  scroll.addEventListener('scroll', update, { passive: true });
  const observer = new ResizeObserver(update);
  observer.observe(scroll);
  [...scroll.children].forEach(child => observer.observe(child));
  update();
  return () => { scroll.removeEventListener('scroll', update); observer.disconnect(); };
}
