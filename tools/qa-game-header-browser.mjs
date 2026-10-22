// Verify the shared mobile HUD in the actual five mode renderers.
import {chromium} from 'playwright';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';

const base=process.argv[2]||'http://127.0.0.1:8873';
const output=process.env.V2_SCREENSHOT_DIR||'.design-qa/game-header';
await mkdir(output,{recursive:true});
const registry=JSON.parse(await readFile('design-system/registry.json'));
const browser=await chromium.launch();
const context=await browser.newContext({
  viewport:{width:390,height:844},reducedMotion:'reduce',serviceWorkers:'block'
});
const rows=[];
try{
  for(const mode of ['spelling','flags','math','english','reading']){
    const view=registry.views.find(view=>view.id===mode+'-initial');
    const page=await context.newPage();
    const query=new URLSearchParams({studio:'1',mode,screen:'game',viewId:view.id,state:'initial',country:'pl'});
    await page.goto(base+view.route+'?'+query);
    await page.waitForFunction(id=>document.querySelector('#app')?.dataset.dsContractReady===id,view.id);
    const geometry=await page.evaluate(()=>{
      const measure=selector=>{
        const node=document.querySelector(selector);
        if(!node)return null;
        const rect=node.getBoundingClientRect();
        return {x:rect.x,y:rect.y,w:rect.width,h:rect.height,font:getComputedStyle(node).font};
      };
      return {
        exit:measure('[data-action=exit],#back,[data-action=restart]'),
        pause:measure('[data-action=pause],[data-math-pause]'),
        clock:measure('.timer,#scenic-clock'),
        caption:measure('.time-block small,.scenic-timer small')
      };
    });
    rows.push({mode,...geometry});
    await page.close();
  }
  for(const row of rows){
    for(const key of ['exit','pause'])for(const property of ['x','y','w','h']){
      assert(Math.abs(row[key][property]-rows[0][key][property])<.5,row.mode+' '+key+' '+property);
    }
    assert(Math.abs(row.clock.x+row.clock.w/2-195)<.5,row.mode+' timer is centered');
    assert(Math.abs(row.clock.y-rows[0].clock.y)<.5,row.mode+' timer baseline');
  }
  await writeFile(output+'/report.json',JSON.stringify(rows,null,2));
  console.log('Five mode headers share exit/pause rectangles, timer baseline and center');
}finally{
  await browser.close();
}
