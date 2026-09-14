(() => {
  const nativeAnimate = Element.prototype.animate;

  Element.prototype.animate = function patchedAnimate(keyframes, options) {
    const isDemoPointer = this.classList?.contains('demo-finger');
    const isExpectedTimeline = Array.isArray(keyframes)
      && Number(options?.duration) === 2200
      && keyframes.length >= 6;

    if (!isDemoPointer || !isExpectedTimeline) {
      return nativeAnimate.call(this, keyframes, options);
    }

    const frames = keyframes.map((frame) => ({ ...frame }));
    const first = frames[0];
    const enter = frames[1];
    const clickEnd = frames[2];
    const rowEnd = frames[3];
    const final = frames[4];
    const fade = frames[5];

    // Ten układ czasowy pokrywa się z momentami zapalania pól w app.js:
    // pierwszy rząd kończy się ok. 0.94 s, następnie jest krótki oddech,
    // a zejście w dół kończy się ok. 1.94 s. Całość nadal trwa dokładnie 2.2 s.
    const synchronizedFrames = [
      { ...first, offset: 0, easing: 'ease-out' },
      { ...enter, offset: .055, easing: 'ease-out' },
      { ...clickEnd, offset: .12, easing: 'linear' },
      { ...rowEnd, offset: .41, easing: 'linear' },
      { ...rowEnd, offset: .44, easing: 'linear' },
      { ...final, offset: .88, easing: 'linear' },
      { ...fade, offset: 1, easing: 'ease-out' },
    ];

    return nativeAnimate.call(this, synchronizedFrames, {
      ...options,
      easing: 'linear',
    });
  };
})();
