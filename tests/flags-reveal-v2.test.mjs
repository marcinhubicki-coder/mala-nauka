import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { focusedViewBox, dissolveDrops } from '../flagi/reveal-v2.mjs';
import { FLAGS } from '../data/flags.mjs';

const get=path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('country zoom remains inside the original map bounds',()=>{
  const source={x:0,y:0,width:540,height:480};
  for(const box of [
    {x:0,y:0,width:6,height:8},
    {x:520,y:440,width:18,height:30},
    {x:210,y:140,width:72,height:68},
    {x:350,y:300,width:2,height:2}
  ]){
    const result=focusedViewBox(source,box,1.28);
    assert.equal(result.length,4);
    assert.ok(result[0]>=source.x&&result[1]>=source.y);
    assert.ok(result[0]+result[2]<=source.width+.1);
    assert.ok(result[1]+result[3]<=source.height+.1);
    assert.ok(result[2]<source.width&&result[3]<source.height);
  }
  assert.equal(focusedViewBox(null,null),null);
  assert.equal(focusedViewBox(source,{x:0,y:0,width:0,height:1}),null);
});

test('dissolve splashes are deterministic and have no interactive controls',()=>{
  const a=dissolveDrops('pl'),b=dissolveDrops('pl'),c=dissolveDrops('np');
  assert.equal(a,b);
  assert.notEqual(a,c);
  assert.equal((a.match(/class="flag-dissolve-drop"/g)||[]).length,9);
  assert.ok(!a.includes('<canvas'));
  assert.ok(!a.includes('onclick'));
});

test('one WebP atlas works for every country and leaves Canvas as fallback',async()=>{
  assert.equal(FLAGS.length,195);
  const code=await get('flagi/flag-on-pole.mjs');
  assert.ok(code.includes("cloth-prebaked/"));
  assert.ok(code.includes('renderFlagCloth(canvas)'));
  const art=await get('flagi/adventure-game.mjs');
  assert.ok(art.includes("focusContinentMap(result"));
  assert.ok(art.includes("dissolveDrops(record.id)"));
  assert.ok(art.includes("flag-reveal-scene"));
  assert.ok(art.includes("setTimeout(ready,760)"));
});

test('all three preview states and their CSS are wired',async()=>{
  const route=await get('adventure-preview.mjs');
  const scene=await get('adventure-preview.html');
  const fixture=await get('flagi/preview-fixture.mjs');
  const css=await get('flagi/reveal-v2.css');
  for(const name of ['flag-question','flag-correct','flag-wrong']){
    assert.ok(route.includes(name)&&scene.includes(name),name);
  }
  assert.ok(fixture.includes("params.get('state')==='correct'"));
  for(const key of ['flag-cloth','flag-pole','flag-adventure-map','flag-dissolve-curtain','flag-adventure-details'])
    assert.ok(css.includes(key),'missing '+key);
  for(const path of ['flagi/index.html','flagi/preview-frame.html']){
    const html=await get(path);
    assert.ok(html.includes('reveal-v2.css?v=2'));
    assert.ok(html.includes('adventure-game.mjs?v=19-atlas-reveal'));
  }
});
