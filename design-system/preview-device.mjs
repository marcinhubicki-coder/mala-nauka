// Device choice is a local preview preference, separate from the saved design.
export const PREVIEW_DEVICES=Object.freeze({
 iphone:Object.freeze({id:'iphone',name:'iPhone',width:414,height:876,screenWidth:390,screenHeight:844}),
 desktop:Object.freeze({id:'desktop',name:'Desktop',width:1464,height:948,screenWidth:1440,screenHeight:900})
});
const KEY='mala-nauka-studio-preview-device-v2';
let selected='iphone';
try{const value=globalThis.localStorage?.getItem(KEY);if(Object.hasOwn(PREVIEW_DEVICES,value))selected=value;}catch{}
export function previewDevice(id=selected){return PREVIEW_DEVICES[id]||PREVIEW_DEVICES.iphone;}
export function selectPreviewDevice(id){
 if(!Object.hasOwn(PREVIEW_DEVICES,id)||id===selected)return false;
 selected=id;try{globalThis.localStorage?.setItem(KEY,id);}catch{}
 globalThis.document?.dispatchEvent(new CustomEvent('mala-nauka:preview-device',{detail:{device:id}}));
 return true;
}

export function setupPreviewDevices(){
 const root=document.documentElement,picker=document.getElementById('studio-preview-device');
 if(!picker)return;
 let pending=false;
 function sync(){
  pending=false;const device=previewDevice();root.dataset.previewDevice=device.id;
  for(const input of picker.querySelectorAll('input'))input.checked=input.value===device.id;
  picker.querySelector('output').textContent=device.screenWidth+' × '+device.screenHeight;
  root.style.setProperty('--preview-frame-width',device.width+'px');root.style.setProperty('--preview-frame-height',device.height+'px');
  root.style.setProperty('--preview-screen-width',device.screenWidth+'px');root.style.setProperty('--preview-screen-height',device.screenHeight+'px');
  for(const frame of document.querySelectorAll('.device-frame,.motion-phone iframe,.effect-phone iframe,#test-preview-frame')){
   if(frame.width!==String(device.screenWidth))frame.width=String(device.screenWidth);
   if(frame.height!==String(device.screenHeight))frame.height=String(device.screenHeight);
   if(frame.id==='test-preview-frame'){
    const holder=frame.parentElement,scale=Math.min(1,holder.clientWidth/device.screenWidth);
    frame.style.width=device.screenWidth+'px';frame.style.height=device.screenHeight+'px';frame.style.transform='scale('+scale+')';
    holder.style.height=device.screenHeight*scale+'px';
   }
  }
  const caption=device.screenWidth+' × '+device.screenHeight+' · '+(device.id==='iphone'?'iPhone 13 Pro':'Web desktop');
  for(const note of document.querySelectorAll('.phone-note'))if(note.textContent!==caption)note.textContent=caption;
 }
 const schedule=()=>{if(!pending){pending=true;requestAnimationFrame(sync);}};
 picker.addEventListener('change',event=>{if(event.target.matches('input[type=radio]'))selectPreviewDevice(event.target.value);});
 document.addEventListener('mala-nauka:preview-device',schedule);
 new MutationObserver(schedule).observe(document.getElementById('workspace'),{childList:true,subtree:true});
 new ResizeObserver(schedule).observe(document.getElementById('workspace'));
 sync();
}
