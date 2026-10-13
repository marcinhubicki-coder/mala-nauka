// Real-browser avatar acceptance gate; Playwright is optional QA-only dependency.
// Usage: npm test && python3 -m http.server 8765 --directory dist &
//        node tools/qa-avatars-browser.mjs http://127.0.0.1:8765
import assert from 'node:assert/strict';
const {chromium}=await import('playwright');
const base=process.argv[2]||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[],failedImages=[];
let page;
try{
 page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3});
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{
  if(response.url().includes('/assets/brand/avatars/')&&!response.ok())
   failedImages.push({url:response.url(),status:response.status()});
 });
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});
 await page.locator('[data-action=add-player]').click();
 await page.locator('.avatar-choice').first().waitFor();
 assert.equal(await page.locator('#app [data-ds-contract="v2"]').count(),25,'New profile must use the complete compiled contract');
 assert.equal(await page.locator('#app [data-ds-element="create-back"][data-action="players"]').count(),1);
 await page.waitForFunction(()=>{
  const images=[...document.querySelectorAll('.avatar-choice .player-avatar-image')];
  return images.length===12&&images.every(img=>img.complete&&img.naturalWidth===384&&img.naturalHeight===384);
 },{timeout:15000});

 const measure=()=>page.evaluate(()=>{
  const get=element=>{
   const box=element.getBoundingClientRect(),image=element.querySelector('img'),ib=image.getBoundingClientRect();
   return {id:element.dataset.avatar,w:box.width,h:box.height,imageW:ib.width,imageH:ib.height,loaded:image.complete&&image.naturalWidth===384&&image.naturalHeight===384,src:image.currentSrc,round:getComputedStyle(element).borderRadius};
  };
  return {
   view:document.querySelector('#app')?.dataset.view,
   choices:[...document.querySelectorAll('.avatar-choice .player-avatar-art')].map(get),
   preview:[...document.querySelectorAll('.create-avatar-preview .player-avatar-art')].map(get),
   pin:[...document.querySelectorAll('.pin-profile .player-avatar-art')].map(get),
   cards:[...document.querySelectorAll('.player-card .player-avatar-art')].map(get),
   settings:[...document.querySelectorAll('.settings-avatar')].map(get)
  };
 });
 const isSquare=(box,label)=>{
  assert.ok(Math.abs(box.w-box.h)<0.3,label+': avatar circle is oval ('+box.w+'x'+box.h+')');
  assert.ok(Math.abs(box.imageW-box.imageH)<0.3,label+': source image is stretched');
  assert.equal(box.round,'50%',label+': round mask missing');
  assert.ok(box.loaded,label+': missing 384px WebP asset');
 };
 const first=await measure();
 assert.equal(first.view,'player-create');
 assert.equal(first.choices.length,12);
 const diameter=first.choices[0].w;
 for(const c of first.choices){
  isSquare(c,'Picker '+c.id);
  assert.ok(Math.abs(c.w-diameter)<0.3,'Inconsistent picker circle diameter: '+c.id);
 }

 const previewSizes=[];
 for(const letter of 'abcdefghijkl'){
  await page.locator('[data-action=choose-avatar][data-avatar='+letter+']').click();
  await page.waitForFunction(expected=>{
   const img=document.querySelector('.create-avatar-preview .player-avatar-image');
   return img&&img.complete&&img.naturalWidth===384&&img.src.includes('/'+expected+'.webp');
  },letter,{timeout:5000});
  const snapshot=await measure(),preview=snapshot.preview[0];
  assert.equal(preview.id,letter);
  isSquare(preview,'Preview '+letter);
  previewSizes.push(preview.w);
 }
 assert.ok(previewSizes.every(value=>Math.abs(value-previewSizes[0])<0.3),'The large avatar preview jumps while selecting other portraits');

 await page.locator('#player-nickname').fill('TestAda');
 await page.locator('#player-create-form button[type=submit]').click();
 await page.locator('#app[data-view=player-pin]').waitFor();
 const pin=(await measure()).pin[0];
 isSquare(pin,'PIN setup');
 assert.equal(pin.id,'l');
 assert.ok(Math.abs(pin.w-previewSizes[0])<0.3,'PIN avatar changed size from the profile preview');

 for(const digit of '1234')await page.locator('[data-action=pin-digit][data-digit="'+digit+'"]').click();
 await page.locator('[data-action=submit-pin]').click();
 await page.locator('#app[data-view=home]').waitFor({timeout:15000});
 await page.locator('[data-action=settings]').click();
 await page.locator('#app[data-view=settings]').waitFor();
 const settingsBefore=(await measure()).settings[0];
 isSquare(settingsBefore,'Settings avatar');
 assert.equal(settingsBefore.id,'l');

 await page.locator('[data-action=edit-profile]').click();
 await page.locator('#app[data-view=player-create]').waitFor();
 assert.equal(await page.locator('#app [data-ds-contract="v2"]').count(),0,'Existing edit renderer remains separate until explicitly migrated');
 assert.equal(await page.locator('#app [data-action="settings"]').count(),1,'Edit profile must return to Settings');
 const editor=await measure();
 assert.equal(editor.choices.length,12);
 for(const item of editor.choices)isSquare(item,'Editing picker '+item.id);
 isSquare(editor.preview[0],'Editing preview');

 await page.locator('[data-action=choose-avatar][data-avatar=e]').click();
 await page.locator('#player-create-form button[type=submit]').click();
 await page.locator('#app[data-view=settings]').waitFor({timeout:10000});
 const afterEdit=(await measure()).settings[0];
 isSquare(afterEdit,'Saved settings avatar');
 assert.equal(afterEdit.id,'e');
 assert.ok(Math.abs(afterEdit.w-settingsBefore.w)<0.3,'Settings avatar size changed after editing');

 assert.deepEqual(errors,[]);
 assert.deepEqual(failedImages,[]);
 console.log(JSON.stringify({
  ok:true,assets:12,pickerDiameter:diameter,
  previewDiameter:previewSizes[0],pinDiameter:pin.w,
  settingsDiameter:afterEdit.w,errors:errors.length,brokenAssets:failedImages.length
 }));
}finally{
 await page?.close();
 await browser.close();
}
