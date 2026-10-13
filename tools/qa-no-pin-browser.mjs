// Browser acceptance test for the PIN-free profile path. Optional Playwright.
import assert from 'node:assert/strict';
const {chromium}=await import('playwright');
const base=process.argv[2]||'http://127.0.0.1:8765';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,reducedMotion:'reduce'});
const errors=[];
page.on('pageerror',error=>errors.push(error.message));
try{
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});
 await page.locator('[data-action="add-player"]').click();
 await page.locator('#app[data-view="player-create"]').waitFor();
 assert.equal(await page.locator('#app [data-ds-contract="v2"]').count(),25);
 await page.locator('[data-action=choose-avatar][data-avatar="j"]').click();
 await page.locator('#player-nickname').fill('BezPinu');
 await page.locator('#player-create-form button[type=submit]').click();
 await page.locator('#app[data-view="player-pin"]').waitFor();
 assert.equal(await page.locator('#app [data-ds-contract="v2"]').count(),8,'No-PIN flow must compile same PIN shell');
 const noPinShell=await page.locator('#app [data-ds-element=pin-fields]').elementHandle();
 assert.equal(await page.locator('.pin-keypad [data-action=submit-pin]').isDisabled(),true);
 const avatar=page.locator('.pin-profile .player-avatar-art');
 assert.equal(await avatar.getAttribute('data-avatar'),'j');
 await page.locator('.pin-mode label').filter({hasText:'Bez PIN-u'}).click();
 await page.locator('.pin-card.pin-no-code').waitFor({timeout:10000});
 assert.equal(await page.locator('#app [data-ds-contract="v2"]').count(),8,'PIN/none switch must keep eight shell blocks');
 assert.equal(await page.evaluate(element=>element.isConnected&&document.querySelector('[data-ds-element="pin-fields"]')===element,noPinShell),true,'PIN toggle discarded PIN family');
 assert.equal(await page.locator('.pin-keypad').count(),0);
 assert.equal(await page.locator('.pin-profile .player-avatar-art').getAttribute('data-avatar'),'j');
 await page.locator('.pin-fields [data-action=submit-pin]').click();
 await page.locator('#app[data-view=home]').waitFor({timeout:15000});
 await page.locator('[data-action=settings]').click();
 await page.locator('#app[data-view=settings]').waitFor();
 assert.equal(await page.locator('.settings-avatar').getAttribute('data-avatar'),'j');
 assert.deepEqual(errors,[]);
 console.log(JSON.stringify({ok:true,scenario:'new profile without PIN, avatar and settings',errors:0}));
}finally{await page.close();await browser.close();}
