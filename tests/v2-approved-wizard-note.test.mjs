import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const get=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('approved Ortografia note is visible in the shared Studio model, never through a CSS override',()=>{
 const model=JSON.parse(get('design-system/config.json'));
 assert.notEqual(model.elementStyles?.['text-wizard-note']?.visibility,'removed');
 assert.ok(model.revision>=31,'Visual model revision must advance so old drafts require recovery');
 assert.equal(model.elementOverrides?.['spelling-settings']?.['spelling-start']?.offsetY,3);
 assert.doesNotMatch(get('ortografia/wizard-retina.css'),/\.wizard-note:not\(\[hidden\]\)\s*\{[\s\S]*?display:block!important/);
 assert.match(get('app.js'),/Po pomyłce czas czeka, aż poznasz odpowiedź\./);
});
