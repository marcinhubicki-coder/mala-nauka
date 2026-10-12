import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const design=JSON.parse(source('design-system/config.json'));

test('Wariant pilota zachowuje zatwierdzony tekst misji',()=>{
 const live=(design.copyOverrides||[]).filter(row=>row.viewId==='spelling-settings'&&row.original==='Twoja mała misja');
 assert.ok(live.every(row=>row.text==='Twoja mała misja'), 'Nie zmieniaj zatwierdzonej treści bez akceptacji wizualnej');
 assert.ok((design.project?.copy||[]).filter(row=>row.viewId==='spelling-settings').every(row=>row.text==='Twoja mała misja'));
});

test('Home ma jawne źródłowe znaczniki wspólnych części oraz pięć trybów',()=>{
 const home=source('home-screen.mjs');
 for(const key of ['home-logo','home-settings','home-hero','home-headline','home-stats','home-modes']) {
  assert.ok(home.includes('data-ds-key="'+key+'"'), 'Brak jawnego klucza: '+key);
 }
 for(const mode of ['spelling','math','english','flags','reading']) assert.match(home,new RegExp('\\b'+mode+':\\s*\\['));
 assert.match(home,/data-action="choose-mode"/);
});

test('Powrót to jeden atom, akcja nie jest zakodowana w wariancie ikony',()=>{
 const nav=source('shared/navigation-parts.mjs');
 assert.match(nav,/function backButton\(/);
 assert.match(nav,/data-ds-recipe=\\?"button-back\\?"/);
 assert.match(nav,/data-action/);
 assert.match(nav,/pageHeading\(/);
});

test('Ustawienia Ortografii zachowują trzy niezależne sekcje oraz obsługę Jelly',()=>{
 const spelling=source('ortografia/wizard-v2.mjs');
 for(const headline of ['Co ćwiczymy?','Wybierz pulę wyrazów','Ustal misję']) assert.ok(spelling.includes(headline));
 assert.match(spelling,/createJellyV4/);
 assert.match(spelling,/data-segmented="scope"/);
 assert.match(spelling,/data-segmented="level"/);
});
