// One owner for input suspension across loaders, transitions and navigation.
// Releasing an older transition never restores a stale inert=true snapshot.
const active=new WeakMap();
export function acquireInputLock(node,source='transition'){
 if(!node)return ()=>{};
 let state=active.get(node);
 if(!state){state={initial:Boolean(node.inert),leases:new Set()};active.set(node,state);}
 const token=Symbol(source);state.leases.add(token);node.inert=true;
 let released=false;
 return ()=>{
  if(released)return;released=true;
  state.leases.delete(token);
  if(state.leases.size)node.inert=true;
  else{active.delete(node);node.inert=state.initial;}
 };
}
export function inputLockCount(node){return active.get(node)?.leases.size||0;}
