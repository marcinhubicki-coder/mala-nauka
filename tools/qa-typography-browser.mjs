// Optional browser acceptance gate. Run against an already served local dist.
// This module is NOT included in the game's imports or automatic Vercel build.
import assert from 'node:assert/strict';
const {chromium}=await import('playwright');
const base=process.argv[2]||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const studio=await browser.newPage({viewport:{width:1365,height:900}});
 const errors=[];studio.on('pageerror',error=>errors.push(error.message));
 await studio.goto(base+'/design-system/',{waitUntil:'domcontentloaded'});
 await studio.getByRole('button',{name:'Typografia'}).first().click();
 assert.equal(await studio.locator('[data-type-scale-role][data-type-scale-field=size]').count(),10);
 const h2=studio.locator('[data-type-scale-role=h2][data-type-scale-field=size]').first();
 await h2.fill('40');await h2.dispatchEvent('change');await studio.waitForTimeout(160);
 assert.equal(await studio.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--ds-type-h2-size').trim()),'40px');
 await studio.getByRole('button',{name:'Biblioteka klocków v2'}).first().click();
 assert.match(await studio.locator('.block-library-heading').innerText(),/13 typów atomów · 60 wspólnych klocków/);
 const shared=await studio.locator('.block-catalog-row').count();
 await studio.locator('[data-block-details]').selectOption('all');
 const detailed=await studio.locator('.block-catalog-row').count();
 assert.ok(detailed>shared&&shared>0);
 assert.deepEqual(errors,[]);
 await studio.close();

 const game=await browser.newPage({viewport:{width:390,height:844}});
 const gameErrors=[];game.on('pageerror',error=>gameErrors.push(error.message));
 await game.goto(base+'/?studio=1&mode=spelling&screen=home&state=initial&viewId=home',{waitUntil:'domcontentloaded'});
 await game.waitForTimeout(250);
 const data=await game.evaluate(async()=>{
  const mod=await import('/shared/design-runtime.mjs');
  const node=id=>document.querySelector('[data-ds-element="'+id+'"]');
  const size=id=>getComputedStyle(node(id)).fontSize;
  const before={headline:size('home-headline'),subtitle:size('home-subtitle')};
  const config=structuredClone(mod.currentDesign());
  config.elementOverrides??={};config.elementOverrides.home??={};
  config.elementOverrides.home['home-headline']={typeStyle:'h2'};
  config.typeScale={...(config.typeScale||{}),h2:{size:40}};
  mod.applyDesign(config);
  await new Promise(resolve=>setTimeout(resolve,160));
  return {before,after:{headline:size('home-headline'),subtitle:size('home-subtitle')}};
 });
 assert.notEqual(data.before.headline,data.after.headline);
 assert.equal(data.before.subtitle,data.after.subtitle);
 assert.equal(data.after.headline,'40px');
 assert.deepEqual(gameErrors,[]);
 await game.close();
 console.log(JSON.stringify({ok:true,sharedLibraryRows:shared,detailedLibraryRows:detailed,home:data}));
}finally{await browser.close();}
