// Small gameplay adapter for statically declared view contracts.
// The costly DOM classifier, shape hashing and element inventory are Studio-only.
import {viewContract,validateViewContract} from './view-contracts.mjs';
import {visualValue,iconSVG} from './element-system.mjs';
import {syncElementMotion} from './element-motion.mjs';
import {syncElementSurface,syncScreenSurface} from './surface-effects.mjs';
import {rememberPresence} from './state-motion.mjs';
import {assetUrl} from './asset-loader.mjs';

export function applyCompiledView(root,config,view){
 const contract=viewContract(view);
 validateViewContract(view,contract);
 root.dataset.dsTemplate='template:'+view;
 root.dataset.dsElement='layout-root';
 root.dataset.dsKind='container';
 root.dataset.dsRecipe='layout';
 root.dataset.dsBlock='screen-'+view;
 const byId=new Map([...root.querySelectorAll('[data-ds-contract="v2"]')].map(node=>[node.dataset.dsElement,node]));
 if(byId.size!==contract.length)throw Error('Compiled view is incomplete: '+view+' ('+byId.size+'/'+contract.length+')');
 for(const item of contract){
  const node=byId.get(item.id);
  if(!node||node.dataset.dsRecipe!==item.recipe||node.dataset.dsBlock!=='block-'+item.recipe)throw Error('Component is out of sync: '+item.id);
  const style=visualValue(config,view,{id:item.id,recipe:item.recipe,blockId:node.dataset.dsBlock,kind:item.kind,mode:node.dataset.dsMode||view,state:node.dataset.dsState||'default'});
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
  if(item.kind==='text'&&texts.length===1){
   const text=texts[0];
   if(style.text!==undefined){node.dataset.dsOriginalText??=text.textContent;text.textContent=style.text;}
   else if(node.dataset.dsOriginalText!==undefined){text.textContent=node.dataset.dsOriginalText;delete node.dataset.dsOriginalText;}
  }
 }
 syncScreenSurface(root,config,view);
 return contract.length;
}
