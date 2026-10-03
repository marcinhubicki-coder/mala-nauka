import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createJellyV4, JELLY_V4_DEFAULTS } from '../shared/jelly-v4.mjs';

test('jelly ink retains its delayed handoff while the blob moves', () => {
  const originalMatchMedia = globalThis.matchMedia;
  const originalStyle = globalThis.getComputedStyle;
  globalThis.matchMedia = () => ({ matches: false });
  globalThis.getComputedStyle = () => ({ getPropertyValue: name => name === '--jelly-active-ink' ? '#fff' : '#515c98' });
  const animations = [];
  const classes = () => ({ add() {}, remove() {}, toggle() {} });
  const style = () => ({ setProperty() {} });
  const animate = (frames, timing) => {
    const animation = { frames, timing, finished: new Promise(() => {}), cancel() {} };
    animations.push(animation);
    return animation;
  };
  const spans = [0, 1].map(() => ({ classList: classes(), animate }));
  const labels = spans.map((span, index) => ({ classList: classes(), querySelector: () => span, getBoundingClientRect: () => ({ left: index * 100, right: (index + 1) * 100 }) }));
  const node = { classList: classes(), style: style(), animate, getBoundingClientRect: () => ({ left: 4, right: 96 }) };
  const container = { classList: classes(), style: style(), dataset: { activeIndex: '0' }, querySelector: () => node, querySelectorAll: () => labels, getBoundingClientRect: () => ({ left: 0, right: 200, width: 200 }) };
  try {
    createJellyV4({ indicatorSelector: '.indicator' }).update(container, 1);
    const incoming = animations.find(animation => animation.timing.delay === JELLY_V4_DEFAULTS.text.delay);
    assert.equal(incoming.timing.delay, 440);
    assert.equal(incoming.timing.fill, 'both');
    assert.equal(incoming.frames[0].color, '#515c98');
    assert.equal(incoming.frames.at(-1).color, '#fff');
    assert.ok(animations.some(animation => animation.frames.some(frame => frame.left)));
  } finally {
    globalThis.matchMedia = originalMatchMedia;
    globalThis.getComputedStyle = originalStyle;
  }
});

test('theme colors cannot override the animated ink with important declarations', async () => {
  const css = await readFile(new URL('../shared/jelly-v4.css', import.meta.url), 'utf8');
  assert.doesNotMatch(css, /color:\s*var\(--jelly-(?:active|idle)-ink\)\s*!important/);
  assert.match(css, /#app\[data-mode\]\[data-view\].*jelly-v4-text-active/);
});

test('a captured tap commits its original label once and cancellation leaves the choice unchanged', () => {
  const classes = () => ({ add() {}, remove() {}, toggle() {}, contains: () => true });
  const style = () => ({ setProperty() {} });
  const handlers = new Map(), captures = [], commits = [], suppressions = [];
  const buffer = {
    classList: classes(),
    addEventListener: (name, handler) => handlers.set(name, handler),
    setPointerCapture: id => captures.push(id), releasePointerCapture() {}
  };
  const labels = [0, 1].map(index => ({
    classList: classes(), querySelector: () => ({ classList: classes() }),
    getBoundingClientRect: () => ({ left: index * 100, right: (index + 1) * 100 })
  }));
  const node = { classList: classes(), style: style(), getBoundingClientRect: () => ({ left: 4, right: 96 }) };
  const container = {
    parentElement: buffer, classList: classes(), style: style(), dataset: { activeIndex: '0' },
    querySelector: () => node, querySelectorAll: () => labels,
    getBoundingClientRect: () => ({ left: 0, right: 200, width: 200 })
  };
  createJellyV4({ indicatorSelector: '.indicator' }).setupDrag(container, {
    getActiveIndex: () => 0, commitIndex: index => commits.push(index),
    suppressClick: ms => suppressions.push(ms)
  });
  const down = id => ({ button: 0, pointerId: id, clientX: 150, clientY: 20, target: { closest: () => labels[1] } });
  handlers.get('pointerdown')(down(1));
  assert.deepEqual(commits, []);
  handlers.get('pointerup')({ pointerId: 1 });
  handlers.get('pointerup')({ pointerId: 1 });
  assert.deepEqual(captures, [1]);
  assert.deepEqual(commits, [1]);
  assert.equal(suppressions.length, 1);
  handlers.get('pointerdown')(down(2));
  handlers.get('pointercancel')({ pointerId: 2 });
  handlers.get('pointerup')({ pointerId: 2 });
  assert.deepEqual(commits, [1]);
  assert.equal(container.dataset.activeIndex, '0');
});
