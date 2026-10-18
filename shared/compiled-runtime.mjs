// Small gameplay adapter for statically declared view contracts.
// The costly DOM classifier, shape hashing and element inventory are Studio-only.
import {viewContract,validateViewContract} from './view-contracts.mjs';
import {VIEW_PART_LABELS} from './view-bindings.mjs';
import {mountedViewContract} from './view-contract-mount.mjs';
import {visualValue,iconSVG} from './element-styles.mjs';
import {syncElementMotion} from './element-motion.mjs';
import {syncElementSurface,syncScreenSurface} from './surface-effects.mjs';
import {rememberPresence} from './state-motion.mjs';
import {assetUrl} from './asset-loader.mjs';
import {PART_BY_ID,partStates} from './structure-model.mjs';
const originalOrders=new WeakMap(),ordered=new WeakSet(),artworkStyles=new WeakMap();
function applyOrder(root,mounted,config,view){
 const byId=new Map(mounted.map(item=>[item.id,item]));
 const requests=new Map();
 for(const [parentId,ids]of Object.entries(config.elementOrder?.[view]||{})){
  for(const id of ids){
   const item=byId.get(id),node=item?.node,parent=node?.parentElement;
   if(item?.parent!==parentId||!parent||!root.contains(parent))continue;
   // Layout-only wrappers need no invented contract component. Reorder only
   // declared siblings sharing a real parent; never move a child across groups.
   const list=requests.get(parent)||[];if(!list.includes(node))list.push(node);requests.set(parent,list);
  }
 }
 const parents=new Set([root,...mounted.map(item=>item.node.parentElement)]);
 for(const parent of parents){
  if(!parent)continue;
  const requested=requests.get(parent);
  if(requested&&(!originalOrders.has(parent)||!originalOrders.get(parent).some(node=>node.parentElement===parent)))originalOrders.set(parent,[...parent.children]);
  let sequence;
  if(requested){sequence=[...requested];ordered.add(parent);}
  else if(ordered.has(parent)){sequence=originalOrders.get(parent).filter(node=>node.parentElement===parent);ordered.delete(parent);}
  if(!sequence?.length)continue;
  const selected=new Set(sequence),desired=[...parent.children].map(node=>selected.has(node)?sequence.shift():node);
  desired.forEach((node,i)=>{if(parent.children[i]!==node)parent.insertBefore(node,parent.children[i]||null);});
 }
}
function applyArtwork(node,style){
 const fields=['objectFit','objectPosition','scale','translate','transformOrigin'];
 const active=style.fit!==undefined||style.imageX!==undefined||style.imageY!==undefined||style.imageScale!==undefined;
 if(active){
  if(!artworkStyles.has(node))artworkStyles.set(node,Object.fromEntries(fields.map(key=>[key,node.style[key]])));
  if(style.fit)node.style.objectFit=style.fit;
  if(style.imageX!==undefined||style.imageY!==undefined)node.style.objectPosition=`${style.imageX??50}% ${style.imageY??50}%`;
  if(style.imageScale!==undefined)node.style.scale=String((style.scale??1)*style.imageScale);
  node.style.transformOrigin='center';
 }else if(artworkStyles.has(node)){Object.assign(node.style,artworkStyles.get(node));artworkStyles.delete(node);}
 const vector=node.matches('svg')?node:node.querySelector('svg');
 if(vector){
  if(style.fit){vector.dataset.dsOriginalAspect??=vector.getAttribute('preserveAspectRatio')||'';vector.setAttribute('preserveAspectRatio',style.fit==='contain'?'xMidYMid meet':'xMidYMid slice');}
  else if(vector.dataset.dsOriginalAspect!==undefined){vector.setAttribute('preserveAspectRatio',vector.dataset.dsOriginalAspect);delete vector.dataset.dsOriginalAspect;}
  if(style.imageX!==undefined||style.imageY!==undefined)node.style.translate=`${((style.imageX??50)-50)*2}% ${((style.imageY??50)-50)*2}%`;
 }
}

function partState(node,item){
 const states=partStates(PART_BY_ID[item.recipe]);
 if(states.includes(node.dataset.dsRendererState))return node.dataset.dsRendererState;
 for(const state of ['correct','wrong','dragging','complete','selected','pressed'])if(states.includes(state)&&(node.classList.contains(state)||node.classList.contains('is-'+state)||(state==='selected'&&(node.getAttribute('aria-pressed')==='true'||node.getAttribute('aria-expanded')==='true'||node.matches('label:has(input:checked)')))))return state;
 if(states.includes('disabled')&&node.disabled)return 'disabled';
 return 'default';
}

export function applyCompiledView(root,config,view){
 const contract=viewContract(view);
 validateViewContract(view,contract);
 root.dataset.dsTemplate='template:'+view;
 root.dataset.dsElement='layout-root';
 root.dataset.dsKind='container';
 root.dataset.dsRecipe='layout';
 root.dataset.dsBlock='screen-'+view;
 const mounted=mountedViewContract(root,view);
 const rootStyle=visualValue(config,view,{id:'layout-root',recipe:'layout',blockId:'screen-'+view,kind:'container',mode:root.dataset.mode||view});
 syncElementMotion(root,rootStyle);syncElementSurface(root,rootStyle);rememberPresence(root,rootStyle);
 for(const item of mounted){
  const node=item.node;
  node.dataset.dsParent=item.parent;node.dataset.dsLevel=item.level;
  if(item.kind==='container')node.dataset.dsLabel=VIEW_PART_LABELS[item.id]||PART_BY_ID[item.recipe]?.name||node.dataset.dsLabel||item.id;
  node.dataset.dsState=partState(node,item);
  const style=visualValue(config,view,{id:item.id,aliases:node.dataset.dsLegacyId?[node.dataset.dsLegacyId]:[],recipe:item.recipe,blockId:node.dataset.dsBlock,kind:item.kind,mode:node.dataset.dsMode||view,state:node.dataset.dsState||'default'});
  syncElementMotion(node,style);
  syncElementSurface(node,style);
  rememberPresence(node,style);
  if(item.kind==='icon'){
   if(style.icon&&node.dataset.dsIcon!==style.icon){
    if(node.dataset.dsOriginal===undefined)node.dataset.dsOriginal=node.innerHTML;
    node.innerHTML=iconSVG(style.icon);node.dataset.dsIcon=style.icon;
   }else if(!style.icon&&node.dataset.dsIcon){
    node.innerHTML=node.dataset.dsOriginal||'';delete node.dataset.dsIcon;
   }
  }
  if(style.asset&&['image','background'].includes(item.kind)){
   const img=node.matches('img')?node:node.querySelector('img,image');
   const attr=img?.localName==='image'?'href':'src';
   if(img){img.dataset.dsOriginalSrc??=img.getAttribute(attr)||'';const url=assetUrl(style.asset);if(img.getAttribute(attr)!==url)img.setAttribute(attr,url);}
   else if(node.dataset.dsOriginalBackground===undefined)node.dataset.dsOriginalBackground=node.style.backgroundImage;
   if(!img)node.style.backgroundImage='url("'+assetUrl(style.asset)+'")';
  }else if(['image','background'].includes(item.kind)){
   const img=node.matches('img')?node:node.querySelector('img,image');
   if(img?.dataset.dsOriginalSrc!==undefined){img.setAttribute(img.localName==='image'?'href':'src',img.dataset.dsOriginalSrc);delete img.dataset.dsOriginalSrc;}
   if(node.dataset.dsOriginalBackground!==undefined){node.style.backgroundImage=node.dataset.dsOriginalBackground;delete node.dataset.dsOriginalBackground;}
  }
  const texts=[...node.childNodes].filter(child=>child.nodeType===3&&child.textContent.trim());
  if(['image','background'].includes(item.kind))applyArtwork(node,style);
  if(item.kind==='text'&&texts.length===1){
   const text=texts[0];
   if(style.text!==undefined){node.dataset.dsOriginalText??=text.textContent;text.textContent=style.text;}
   else if(node.dataset.dsOriginalText!==undefined){text.textContent=node.dataset.dsOriginalText;delete node.dataset.dsOriginalText;}
  }
 }
 applyOrder(root,mounted,config,view);syncScreenSurface(root,config,view);
 root.dataset.dsContractReady=view;
 return mounted.length;
}

export function compiledInventory(root,config,view){
 if(root.dataset.dsContractPending||root.querySelector('.loading')||root.dataset.dsContractReady!==view)return [];
 applyCompiledView(root,config,view);
 return mountedViewContract(root,view).map((item,index)=>({...item,
  blockId:'block-'+item.recipe,mode:item.node.dataset.dsMode||view,state:item.node.dataset.dsState||'default',index,
  component:item.kind==='timer'?'game-timer':item.kind==='meter'?'result-progress':item.kind==='toggle'?'pin-toggle':item.kind==='key'?'pin-key':'atom-'+item.kind,
  label:item.node.getAttribute('aria-label')||item.node.getAttribute('alt')||item.node.dataset.dsLabel||(item.node.textContent||'').trim().replace(/\s+/g,' ').slice(0,55)||PART_BY_ID[item.recipe]?.name||item.id
 }));
}
