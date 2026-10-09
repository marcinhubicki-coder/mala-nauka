import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {PARTS,PART_BY_ID,structureCatalog} from '../shared/structure-model.mjs';
import {partSample} from '../shared/part-samples.mjs';
import {partRecipeDefaults} from '../shared/part-recipes.mjs';
import {profileAvatar,pinModeMarkup,pinDotsMarkup,pinKeypadMarkup} from '../shared/profile-parts.mjs';
import {visualValue,elementCSS} from '../shared/element-system.mjs';
const config=JSON.parse(await readFile(new URL('../design-system/config.json',import.meta.url)));
const registry=JSON.parse(await readFile(new URL('../design-system/registry.json',import.meta.url)));

test('all declared parts construct immediately from code, with real locally available image assets',async()=>{
 const catalog=structureCatalog(registry);let images=0;
 for(const p of PARTS){
  const markup=partSample(p.id,{catalog,assetURL:path=>path});
  assert.ok(markup.length>40,p.id);assert.match(markup,/data-ds-recipe=/);
  assert.doesNotMatch(markup,/iframe|isolation-target|Otwórz użycie/);
  for(const match of markup.matchAll(/(?:src|href)="(assets\/[^"]+)"|url\('(assets\/[^']+)'\)/g)){await access(new URL('../'+(match[1]||match[2]),import.meta.url));images++;}
 }
 assert.ok(images>=6);
});
test('PIN is a composed jelly variant; changing mode replaces only its fields and keeps profile and selector',()=>{
 assert.equal(PART_BY_ID['control-pin'].level,'group');assert.ok(PART_BY_ID['control-pin'].children.includes('control-jelly'));
 const pin=partSample('container-pin-card',{pin:true}),noPin=partSample('container-pin-card',{pin:false});
 for(const markup of [pin,noPin]){assert.match(markup,/data-ds-recipe="image-player-avatar-art"/);assert.match(markup,/data-ds-recipe="control-pin"/);assert.match(markup,/data-ds-recipe="container-pin-fields"/);}
 assert.match(pin,/class="pin-keypad"/);assert.doesNotMatch(noPin,/class="pin-keypad"/);assert.match(noPin,/Bez PIN-u/);
 assert.match(pinModeMarkup(false),/value="none" checked/);assert.match(pinModeMarkup(true),/value="pin" checked/);
});
test('production keyboard and library use the same four-digit completion gate and accessible keys',()=>{
 for(let count=0;count<=4;count++){
  const keyboard=pinKeypadMarkup(count,'Wejdź do profilu'),sample=partSample('container-pin-keypad',{pinDigits:count});
  for(const markup of [keyboard,sample]){assert.equal([...markup.matchAll(/data-digit=/g)].length,10);const submit=markup.match(/<button[^>]*data-action="submit-pin"[^>]*>/)[0];assert.equal(submit.includes('disabled'),count!==4);assert.match(markup,/Usuń ostatnią cyfrę/);}
  assert.equal([...pinDotsMarkup(count).matchAll(/class="filled"/g)].length,count);
 }
});
test('one to three player examples compose avatars, names and selection instead of requiring inventory',()=>{
 for(let count=1;count<=3;count++){
  const markup=partSample('container-player-grid',{playerCount:count,selectedPlayer:count-1});
  assert.equal([...markup.matchAll(/data-sample-player=/g)].length,count);assert.equal([...markup.matchAll(/aria-pressed="true"/g)].length,1);
  assert.equal([...markup.matchAll(/data-ds-recipe="text-nickname"/g)].length,count);
 }
 assert.equal(PART_BY_ID['input-player-name'].kind,'input');
 const dot=partSample('icon-step-dot');assert.match(dot,/>1<\/span>/);assert.doesNotMatch(dot,/Co ćwiczymy/);
 assert.doesNotMatch(partSample('container-card'),/step-dot|part-text/);
});
test('shared recipe overrides propagate into composed children, retaining local PIN and palette exceptions',()=>{
 const c={tokens:config.tokens,elementStyles:{'control-jelly':{radius:30,background:'#abcdef'},'control-pin':{radius:22},'text-nickname':{fontSize:28}},familyStyles:{reading:{'text-nickname':{textColor:'#665599'}}}};
 assert.deepEqual(visualValue(c,'',{id:'sample',kind:'toggle',recipe:'control-pin',mode:'default'}),{radius:22,background:'#abcdef'});
 assert.equal(visualValue(c,'',{id:'sample',kind:'text',recipe:'text-nickname',mode:'reading'}).textColor,'#665599');
 assert.match(elementCSS(c),/ds-component-stage.*data-ds-recipe="control-pin"/);
 assert.equal(partRecipeDefaults(PART_BY_ID['control-jelly'],c).height,config.tokens.jelly.height);
 assert.equal(partRecipeDefaults(PART_BY_ID['icon-step-dot'],c).width,31);
 assert.equal(partRecipeDefaults(PART_BY_ID['container-pin-card'],c).height,0,'composed cards size to their contents');
});
test('newly mapped groups are built recursively and avatars preserve the production sprite coordinates',()=>{
 const catalog=[{id:'group-extra',kind:'container',name:'Nowa grupa',children:['icon-step-dot','text-field-label']},...PARTS];
 assert.match(partSample('group-extra',{catalog}),/data-ds-recipe="icon-step-dot"/);
 assert.match(partSample('group-extra',{catalog}),/Co ćwiczymy/);
 assert.match(profileAvatar({avatarId:'l'}),/viewBox="960 650 320 320"/);
 assert.doesNotMatch(profileAvatar({avatarId:'ab'}),/data-avatar="ab"/);
});
