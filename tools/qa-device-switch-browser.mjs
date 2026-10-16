// Verify real iframe viewports and draft continuity, not just the device labels.
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';
const base=process.argv[2]||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,...(process.env.CHROME_EXECUTABLE?{executablePath:process.env.CHROME_EXECUTABLE}:{})});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];
 page.setDefaultTimeout(20000);page.setDefaultNavigationTimeout(30000);
 page.on('pageerror',error=>{errors.push(error.message);console.error(error.stack||error.message);});
 await page.goto(base+'/design-system/#components');
 await page.locator('#device-frame').waitFor();
 console.log('device-qa: editor ready');
 await page.locator('label:has(input[data-studio-nav="view"][value="spelling-wrong"])').click();
 await page.waitForFunction(()=>{const f=document.querySelector('#device-frame');return f?.dataset.previewView==='spelling-wrong'&&!f.dataset.initializingView;});
 const originalURL=await page.locator('#device-frame').getAttribute('src');
 const gap=page.getByRole('spinbutton',{name:'Odstęp między elementami w pikselach',exact:true});
 const initialGap=Number(await gap.inputValue()),editedGap=String(initialGap<120?initialGap+1:initialGap-1);
 await gap.fill(editedGap);
 await page.waitForFunction(()=>Number.parseInt(document.querySelector('#draft-status').textContent)>0);
 assert.equal(await gap.inputValue(),editedGap);
 assert.ok(await gap.evaluate(e=>document.activeElement===e));
 await gap.press('Tab');
 const changed=await page.locator('#draft-status').innerText();
 console.log('device-qa: draft edited');
 async function select(name,size){
  await page.getByRole('radio',{name,exact:true}).check();
  await page.waitForFunction(([w,h])=>{const f=document.querySelector('#device-frame');return f?.clientWidth===w&&f?.clientHeight===h;},size);
  const viewport=await page.frameLocator('#device-frame').locator('html').evaluate(()=>[innerWidth,innerHeight]);
  assert.deepEqual(viewport,size);
  assert.equal(await page.locator('#device-frame').getAttribute('src'),originalURL);
  assert.equal(await page.locator('#draft-status').innerText(),changed);
  await page.waitForFunction(()=>!document.querySelector('#device-frame')?.dataset.initializingView);
  assert.equal(await page.getByRole('spinbutton',{name:'Odstęp między elementami w pikselach',exact:true}).inputValue(),editedGap);
 }
 await select('Desktop',[1440,900]);
 console.log('device-qa: desktop viewport verified');
 await page.setViewportSize({width:1280,height:720});
 await page.waitForFunction(()=>document.querySelector('#preview-gallery').clientHeight>=360);
 assert.ok(await page.locator('.phone-outer').evaluate(e=>e.getBoundingClientRect().height>=150));
 assert.ok(await page.locator('.preview-column').evaluate(e=>e.scrollHeight>e.clientHeight&&getComputedStyle(e).overflowY==='auto'));
 await page.setViewportSize({width:1440,height:1000});
 assert.equal(await page.locator('#reference-upload').count(),0);
 const output=process.env.V2_SCREENSHOT_DIR;
 if(output){await mkdir(output,{recursive:true});await page.screenshot({path:join(output,'studio-desktop.png')});}
 await select('iPhone',[390,844]);
 console.log('device-qa: iPhone viewport verified');
 await page.locator('#reference-upload').waitFor();
 if(output)await page.screenshot({path:join(output,'studio-iphone.png')});
 await select('Desktop',[1440,900]);await page.reload();
 await page.locator('#device-frame').waitFor();
 assert.equal(await page.getByRole('radio',{name:'Desktop',exact:true}).isChecked(),true);
 assert.equal(await page.locator('#draft-status').innerText(),changed);
 await page.getByRole('button',{name:'Test PWA',exact:true}).click();
 await page.waitForFunction(()=>document.querySelector('#test-preview-frame')?.clientWidth===1440);
 assert.deepEqual(await page.frameLocator('#test-preview-frame').locator('html').evaluate(()=>[innerWidth,innerHeight]),[1440,900]);
 await page.getByRole('radio',{name:'iPhone',exact:true}).check();
 await page.waitForFunction(()=>document.querySelector('#test-preview-frame')?.clientWidth===390);
 await page.setViewportSize({width:390,height:844});
 await page.getByRole('radio',{name:'Desktop',exact:true}).check();
 await page.waitForFunction(()=>document.querySelector('#test-preview-frame')?.clientWidth===1440);
 assert.ok(await page.locator('#test-preview-frame').evaluate(f=>f.getBoundingClientRect().width<=document.documentElement.clientWidth));
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({ok:true,desktop:[1440,900],iphone:[390,844],viewAndStateRetained:true,draftRetained:true,preferenceRetained:true,testPWA:true,mobileHost:true,jsErrors:0}));
}finally{await browser.close();}
