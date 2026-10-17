import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {projectContract,designFields} from '../design-system/project-model.mjs';
import {optimizedTestConfig} from '../design-system/pwa-test-build.mjs';
import {validateConfig} from '../design-system/model.mjs';
const base=JSON.parse(await readFile(new URL('../design-system/config.json',import.meta.url)));
test('Git, runtime and PWA export retain visibility, order, element motion and panel preferences',()=>{
 const local=structuredClone(base);
 local.elementOverrides={...local.elementOverrides,home:{example:{visibility:'removed',animation:'float',animationDuration:900,animationDistance:8}}};
 local.elementOrder={home:{'layout-root':['second','first']}};
 local.studioPreferences={panelWidth:360,compact:true,hiddenSections:['audit']};
 const saved=projectContract(local,base),decoded=JSON.parse(JSON.stringify(saved)),{config}=optimizedTestConfig(decoded);
 assert.doesNotThrow(()=>validateConfig(config));
 assert.deepEqual(designFields(config),designFields(saved));
 assert.deepEqual(config.elementOrder,local.elementOrder);
 assert.equal(config.elementOverrides.home.example.visibility,'removed');
 assert.equal(config.project?.designDraft,undefined);
 assert.deepEqual(config.studioPreferences,local.studioPreferences);
});
test('invalid order and unbounded element animations cannot enter the shared contract',()=>{
 const value=structuredClone(base);value.elementOrder={home:{root:['same','same']}};assert.throws(()=>validateConfig(value));
 delete value.elementOrder;value.elementOverrides={home:{example:{animationDuration:999999}}};assert.throws(()=>validateConfig(value));
 value.elementOverrides={home:{example:{animation:'unregistered'}}};assert.throws(()=>validateConfig(value));
});
