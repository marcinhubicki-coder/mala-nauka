import {applyDesign,designReady} from '../shared/design-runtime.mjs';
import {configureAssets,observeAssets,rewriteAssetNodes} from '../shared/asset-loader.mjs';
const query = new URLSearchParams(location.search);
document.documentElement.dataset.dsView = query.get('viewId') || '';
if(query.has('studio')){
 document.documentElement.style.setProperty('--app-safe-top','47px');
 document.documentElement.style.setProperty('--app-safe-bottom','34px');
 document.documentElement.dataset.studio='true';
}
let registry, inspecting = false, highlight;
function emit(data){if(parent!==window)parent.postMessage({channel:'mala-nauka-studio',...data},location.origin);}
function componentFor(target){return registry?.components.find(component=>{try{return target.closest(component.selector);}catch{return false;}});}
document.addEventListener('click', event=>{
 if(!inspecting)return;
 const component=componentFor(event.target);if(!component)return;
 event.preventDefault();event.stopImmediatePropagation();
 const node=event.target.closest(component.selector), rect=node.getBoundingClientRect();
 highlight ||= Object.assign(document.createElement('div'),{id:'ds-selection'});
 highlight.style.cssText=`position:fixed;pointer-events:none;z-index:2147483647;border:2px solid #315af2;border-radius:8px;background:#315af211;left:${rect.x}px;top:${rect.y}px;width:${rect.width}px;height:${rect.height}px`;
 document.body.append(highlight);
 const style=getComputedStyle(node);
 emit({type:'select',component:component.id,metrics:{width:rect.width,height:rect.height,padding:style.padding,gap:style.gap,font:style.fontFamily,fontSize:style.fontSize}});
},true);
window.addEventListener('message',async event=>{
 if(event.origin!==location.origin||event.source!==parent||event.data?.channel!=='mala-nauka-studio')return;
 const message=event.data;
 if(message.type==='design'){await designReady;applyDesign(message.config);if(message.assets){configureAssets(message.assets,window.__DS_ASSET_ORIGIN__||new URL('../',import.meta.url).href);rewriteAssetNodes();}highlight?.remove();emit({type:'applied',revision:message.config.revision});}
 if(message.type==='inspect'){inspecting=Boolean(message.enabled);if(!inspecting)highlight?.remove();}
 if(message.type==='metrics')emit({type:'metrics',metrics:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,scroll:document.querySelector('#app')?.scrollHeight,viewport:document.querySelector('#app')?.clientHeight,errors:document.documentElement.dataset.dsError||''}});
});
if(query.has('studio')){
 const response=await fetch(new URL('./registry.json',import.meta.url));registry=await response.json();
 await designReady;emit({type:'ready',view:query.get('viewId')});
}
