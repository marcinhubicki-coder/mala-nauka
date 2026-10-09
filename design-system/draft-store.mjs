// Binary uploads and edited packs survive reloads. No credentials are stored.
const open=()=>new Promise((resolve,reject)=>{
 const request=indexedDB.open('mala-nauka-design-drafts',1);
 request.onupgradeneeded=()=>request.result.createObjectStore('drafts');
 request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);
});
export async function contentDraft(value,key='content'){
 const db=await open();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction('drafts',value===undefined?'readonly':'readwrite'),store=tx.objectStore('drafts');
  const request=value===undefined?store.get(key):store.put(value,key);
  let result;request.onsuccess=()=>{result=request.result;};
  tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });}finally{db.close();}
}
