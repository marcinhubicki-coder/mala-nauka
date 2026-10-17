import test from 'node:test';
import assert from 'node:assert/strict';
import {supportsAmbientTouchBurst} from '../spelling/response-effects.mjs';
test('mobile WebKit skips ambient touch bursts that can stall rendering',()=>{
 const iphone='Mozilla/5.0 (iPhone; CPU iPhone OS 26_6) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1';
 const iosChrome='Mozilla/5.0 (iPhone; CPU iPhone OS 26_6) AppleWebKit/605.1.15 CriOS/140 Mobile/15E148';
 const ipadDesktop='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/26.0 Safari/605.1.15';
 const macSafari='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/26.0 Safari/605.1.15';
 const android='Mozilla/5.0 (Linux; Android 16) AppleWebKit/537.36 Chrome/150 Mobile Safari/537.36';
 assert.equal(supportsAmbientTouchBurst(iphone,5),false);
 assert.equal(supportsAmbientTouchBurst(iosChrome,5),false);
 assert.equal(supportsAmbientTouchBurst(ipadDesktop,5),false);
 assert.equal(supportsAmbientTouchBurst(macSafari,0),true);
 assert.equal(supportsAmbientTouchBurst(android,5),true);
 assert.equal(supportsAmbientTouchBurst('',0),true);
});
