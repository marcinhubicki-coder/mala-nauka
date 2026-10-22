import test from 'node:test';
import assert from 'node:assert/strict';
import {planRouteEdit,inspectRoute} from '../tools/studio-engine.mjs';
import {resolveRoute,validateNavigation} from '../shared/navigation.mjs';

test('Navigation editor changes existing nonfixed edges and runtime resolves that exact map',()=>{
 const initial={navigation:{routes:{}}};
 const input={from:'players',action:'enter-player',to:'progress'};
 assert.equal(inspectRoute(initial,input).current,'home');
 const changed=planRouteEdit(initial,input);
 assert.equal(changed.change.path,'navigation.routes.players--enter-player');
 assert.equal(resolveRoute(changed.config,'players','enter-player','spelling'),'progress');
 validateNavigation(changed.config.navigation);
 assert.deepEqual(initial.navigation.routes,{});
 const reset=planRouteEdit(changed.config,{...input,reset:true});
 assert.equal(resolveRoute(reset.config,'players','enter-player','spelling'),'home');
});
test('Navigation schema refuses bypassing mandatory PIN and unsafe destinations',()=>{
 const initial={};
 assert.throws(()=>planRouteEdit(initial,{from:'player-pin',action:'pin-mode',to:'home'}),/Fixed/);
 assert.throws(()=>planRouteEdit(initial,{from:'players',action:'enter-player',to:'not-real'}),/Destination not allowed/);
 assert.throws(()=>planRouteEdit(initial,{from:'home',action:'invented-event',to:'settings'}),/not in the explicitly supported/);
});
