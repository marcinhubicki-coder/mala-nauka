// Studio uses the actual PWA document and styles, with a separate simulated state.
import {applyDesign} from './design-runtime.mjs';
import {campaignMarkupReady,mountCampaignScene,animateCampaignToken,departCampaignTraveller} from './campaign-scene.mjs';
import {snapCampaignPoint} from './campaign-layout.mjs';
export function installCampaignLab(root,words){
 let epoch=0,state,drag;
 const send=data=>parent.postMessage({channel:'mala-nauka-campaign',...data},location.origin);
 root.addEventListener('click',async e=>{const button=e.target.closest('button');if(!button)return;e.preventDefault();e.stopImmediatePropagation();if(button.disabled)return;if(button.dataset.campaignSelect)send({type:'select',step:button.dataset.campaignSelect});else if(button.dataset.campaignRealm)send({type:'realm',realm:button.dataset.campaignRealm});else if(button.dataset.campaignPortal){const index=Number(root.querySelector('.campaign-map')?.dataset.revealIndex);if(state?.tester&&index<15)send({type:'position',index:15});else{const run=epoch;button.disabled=true;await departCampaignTraveller(root,state?.design?.adventure);if(run!==epoch)return;send({type:'portal',index:Number(button.dataset.campaignPortal)});}}else if(button.dataset.campaignStart)send({type:'select',step:button.dataset.campaignStart});},true);
 root.addEventListener('keydown',e=>{if(!state?.editing||e.target.closest('input,textarea,select'))return;if(e.key==='Escape'||(e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();send({type:'layout-key',action:e.key==='Escape'?'cancel':e.shiftKey?'redo':'undo'});}});
 root.addEventListener('pointerdown',e=>{const node=e.target.closest('[data-campaign-step-handle]');if(!state?.editing||!node)return;e.preventDefault();e.stopImmediatePropagation();drag={node,rect:node.closest('.campaign-map').getBoundingClientRect(),x:e.clientX,y:e.clientY};node.setPointerCapture(e.pointerId);});
 root.addEventListener('pointermove',e=>{if(!drag||Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<3)return;drag.point=snapCampaignPoint(Math.max(.05,Math.min(.95,(e.clientX-drag.rect.x)/drag.rect.width)),Math.max(.1,Math.min(.94,(e.clientY-drag.rect.y)/drag.rect.height)));drag.node.style.left=drag.point.x*100+'%';drag.node.style.top=drag.point.y*100+'%';});
 const end=e=>{if(!drag)return;const d=drag;drag=null;if(e.type==='pointerup'&&d.point)send({type:'move',step:d.node.dataset.campaignStepHandle,index:Number(d.node.dataset.routeIndex),point:d.point});else send({type:'refresh'});};root.addEventListener('pointerup',end);root.addEventListener('pointercancel',end);
 window.addEventListener('message',async e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.channel!=='mala-nauka-campaign'||e.data.type!=='render')return;const data=e.data,run=++epoch;state=data;try{
 applyDesign(data.design);document.documentElement.style.setProperty('--app-safe-top',data.device==='iphone'?'47px':'0px');document.documentElement.style.setProperty('--app-safe-bottom',data.device==='iphone'?'34px':'0px');root.dataset.view='campaign';root.dataset.mode='spelling';
 const config=data.design.adventure,html=await campaignMarkupReady(data.progress,words,{realmId:data.realm,config,player:data.player,editor:data.editing,grid:data.grid,tester:data.tester,selectedStep:data.step,fromIndex:data.from?.index});if(run!==epoch)return;
 root.innerHTML=html;const controller=await mountCampaignScene(root,data.progress,config,{fromIndex:data.from?.index,grid:data.puzzleGrid});if(run!==epoch)return;
 send({type:'painted',id:data.id,index:root.querySelector('.campaign-token')?.dataset.stepIndex});
 if(data.from)await animateCampaignToken(root,data.progress,config,data.from,controller);if(run!==epoch)return;send({type:'settled',id:data.id});
 }catch(error){send({type:'error',id:data.id,message:error.message});}});
 send({type:'ready'});
}
