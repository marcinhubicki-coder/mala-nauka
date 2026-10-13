// E2E gate: five screenshot references are imported once, mapped to correct
// views and persisted in IndexedDB without touching GitHub or production.
import assert from 'node:assert/strict';
const {chromium}=await import('playwright');
const base=process.argv[2]||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[];
let page;
try{
 page=await browser.newPage({viewport:{width:1300,height:1000},deviceScaleFactor:1});
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto(base+'/design-system/#components',{waitUntil:'domcontentloaded'});
 const fileInput=page.locator('#reference-upload');
 await fileInput.waitFor({timeout:18000});
 // Generate a valid 390x844 PNG to exercise real image decoding and IndexedDB.
 const data=await page.evaluate(async()=>{
  const canvas=document.createElement('canvas');canvas.width=390;canvas.height=844;
  const context=canvas.getContext('2d');context.fillStyle='#72c4ff';context.fillRect(0,0,390,844);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
  return [...new Uint8Array(await blob.arrayBuffer())];
 });
 const buffer=Buffer.from(data);
 const names=['IMG_2946.png','IMG_2947.png','IMG_2948.png','IMG_2949.png','IMG_2950.png'];
 await fileInput.setInputFiles(names.map(name=>({name,mimeType:'image/png',buffer})));
 await page.locator('#reference-status').filter({hasText:'Wzorzec wyrównany do telefonu'}).waitFor({timeout:16000});
 await page.locator('.preview-tile .studio-reference-image').first().waitFor();
 const dimensions=await page.locator('.studio-reference-image').first().evaluate(image=>{
  const overlay=image.getBoundingClientRect();
  const display=image.closest('.phone-outer').querySelector('.phone-inner').getBoundingClientRect();
  return {offsetX:overlay.left-display.left,offsetY:overlay.top-display.top,width:overlay.width,screenWidth:display.width,opacity:getComputedStyle(image).opacity};
 });
 assert.ok(Math.abs(dimensions.offsetX)<1,'Screenshot must align horizontally to iPhone screen');
 assert.ok(Math.abs(dimensions.offsetY)<1,'Screenshot must align vertically to iPhone screen');
 assert.ok(Math.abs(dimensions.width-dimensions.screenWidth)<1,'Screenshot must match iPhone width');
 assert.equal(dimensions.opacity,'0.5');
 // The two submitted gameplay screenshots show TWO slider positions after
 // a wrong answer, not question-before-answer. Never overwrite the latter.
 const stored=await page.evaluate(async()=>{
  const request=indexedDB.open('mala-nauka-v2-reference-screens',1);
  const db=await new Promise((resolve,reject)=>{request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});
  const names=await new Promise((resolve,reject)=>{const tx=db.transaction('screens','readonly'),r=tx.objectStore('screens').getAllKeys();r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  db.close();return names;
 });
 assert.ok(stored.includes('spelling-wrong'));
 assert.ok(stored.includes('spelling-wrong-complete'));
 assert.ok(!stored.includes('spelling-initial'),'Approved gesture image was incorrectly assigned as the question state');
 await page.reload({waitUntil:'domcontentloaded'});
 await page.locator('#reference-status').filter({hasText:'Wzorzec wyrównany do telefonu'}).waitFor({timeout:16000});
 assert.equal(await page.locator('.preview-tile .studio-reference-image').count(),1);
 // Compare mode uses the *real* slider renderer at 50% and 90%.
 for(const percentage of [50,90]){
  await page.goto(base+'/ortografia/?studio=1&mode=spelling&screen=game&state=wrong&viewId=spelling-wrong&sliderProgress='+percentage,{waitUntil:'domcontentloaded'});
  const rail=page.locator('#app[data-state="feedback-wrong"] .spelling-continue-rail');
  await rail.waitFor({timeout:16000});
  await page.waitForFunction(p=>document.querySelector('.spelling-continue-rail')?.getAttribute('aria-valuenow')===String(p),percentage,{timeout:10000});
  assert.equal(await rail.getAttribute('aria-valuenow'),String(percentage));
 }
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({ok:true,imported:names.length,persisted:true,aligned:true,pageErrors:0}));
}finally{await page?.close();await browser.close();}
