// Coalesce expensive draft serialization; flush before the page is suspended.
export function deferredWriter(write,{schedule=setTimeout,cancel=clearTimeout,delay=180}={}){
 let timer=null;
 const flush=()=>{if(timer===null)return;cancel(timer);timer=null;write();};
 return {request(){if(timer===null)timer=schedule(flush,delay);},flush};
}
export function rememberDisclosure(workspace,getPage){
 const states=new Map();
 const keyFor=details=>{const chain=[];let node=details;while(node&&node!==workspace){if(node.tagName==='DETAILS'){const label=node.querySelector(':scope > summary')?.textContent.trim()||'';const peers=[...node.parentElement.children].filter(p=>p.tagName==='DETAILS'&&p.querySelector(':scope > summary')?.textContent.trim()===label);chain.unshift(node.id||label+'@'+peers.indexOf(node));}node=node.parentElement;}return getPage()+'|'+chain.join('/');};
 workspace.addEventListener('toggle',event=>{if(event.target.tagName==='DETAILS'&&workspace.contains(event.target))states.set(keyFor(event.target),event.target.open);},true);
 const observer=new MutationObserver(()=>{for(const details of workspace.querySelectorAll('details')){const key=keyFor(details);if(states.has(key)&&details.open!==states.get(key))details.open=states.get(key);}});
 observer.observe(workspace,{childList:true,subtree:true});return ()=>observer.disconnect();
}
