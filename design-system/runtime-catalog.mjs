// Read every registered fixture through the same bridge used by Edit Screen.
export class RuntimeCatalog {
 constructor(owner){this.owner=owner;this.pending=[];this.done=new Set();this.failures=new Map();this.listeners=new Set();window.addEventListener('message',e=>this.receive(e));}
 subscribe(fn){this.listeners.add(fn);return()=>this.listeners.delete(fn);}
 notify(){for(const fn of this.listeners)fn();}
 start(){if(this.started)return;this.started=true;this.pending=this.owner.registry.views.map(v=>v.id);this.next();}
 url(view){const url=new URL(view.route,location.origin);url.search=new URLSearchParams({studio:'1',mode:view.mode,screen:view.screen,state:view.state,viewId:view.id});return url.href;}
 next(){
  clearTimeout(this.timeout);this.frame?.remove();this.frame=null;
  const id=this.pending.shift();if(!id){this.current=null;this.notify();return;}
  this.current=this.owner.registry.views.find(v=>v.id===id);
  const frame=document.createElement('iframe');this.frame=frame;frame.className='runtime-catalog-frame';frame.title='Odczyt klocków: '+this.current.name;frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');frame.src=this.url(this.current);
  frame.addEventListener('load',()=>{this.send('design',this.owner.getDesign());this.send('inspect',{enabled:false,highlight:false});this.send('inventory-request');});document.body.append(frame);
  this.timeout=setTimeout(()=>{this.failures.set(id,'Ekran nie zakończył odczytu.');this.notify();this.next();},18000);this.notify();
 }
 send(type,data={}){this.frame?.contentWindow?.postMessage({channel:'mala-nauka-studio',type,...data},location.origin);}
 receive(event){
  if(event.origin!==location.origin||event.source!==this.frame?.contentWindow||event.data?.channel!=='mala-nauka-studio')return;
  const m=event.data,v=this.current;if(!v)return;
  if(m.type==='ready'){this.send('design',this.owner.getDesign());this.send('inspect',{enabled:false,highlight:false});this.send('inventory-request');}
  if(m.type!=='inventory'||!m.rendered||m.viewId!==v.id||m.screen!==v.screen)return;
  this.owner.acceptInventory(v.id,m.items||[]);this.done.add(v.id);this.failures.delete(v.id);this.next();
 }
 retry(){this.pending=[...this.failures.keys()];this.failures.clear();if(!this.frame)this.next();}
 get complete(){return this.done.size===this.owner.registry.views.length;}
}
