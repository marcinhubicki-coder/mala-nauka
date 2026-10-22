// The game loads only this tiny module. Heavy Studio inspection is optional.
if(new URLSearchParams(location.search).has('studio')){
 import('./studio-bridge.mjs').catch(error=>console.error('[studio-bridge]',error));
}
