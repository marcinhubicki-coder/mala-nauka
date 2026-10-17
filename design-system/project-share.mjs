import {validateSnapshot,safeProject,fingerprint} from './project-model.mjs';
const LIMIT=1500000;
const base64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');};
const bytes=value=>Uint8Array.from(atob(value.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
export async function encodeShare(value){
  safeProject(value);const raw=new TextEncoder().encode(JSON.stringify(value));if(raw.length>LIMIT)throw Error('Podgląd jest zbyt duży. Podziel projekt na mniejsze wersje.');
  let encoded;if(globalThis.CompressionStream){const out=new Uint8Array(await new Response(new Blob([raw]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());encoded='z.'+base64(out);}else encoded='j.'+base64(raw);
  if(encoded.length>250000)throw Error('Link jest zbyt duży. Podziel projekt na mniejsze wersje.');return encoded;
}
export async function decodeShare(value){
  if(typeof value!=='string'||value.length>250000||! /^[zj]\.[a-zA-Z0-9_-]+$/.test(value))throw Error('Link podglądu jest nieprawidłowy lub zbyt duży.');
  const data=bytes(value.slice(2));let out=data;
  if(value.startsWith('z.')){
    if(!globalThis.DecompressionStream)throw Error('Ta przeglądarka nie rozpakowuje linku. Otwórz go w nowszym Safari lub Chrome.');
    const reader=new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();const chunks=[];let length=0;
    for(;;){const r=await reader.read();if(r.done)break;length+=r.value.length;if(length>LIMIT){await reader.cancel();throw Error('Podgląd przekracza limit.');}chunks.push(r.value);}
    out=new Uint8Array(length);let offset=0;for(const c of chunks){out.set(c,offset);offset+=c.length;}
  }
  if(out.length>LIMIT)throw Error('Podgląd przekracza limit.');const parsed=JSON.parse(new TextDecoder().decode(out));safeProject(parsed);return parsed;
}
export function previewLink(encoded,access='',base=globalThis.location?.href){
  const current=new URL(base),url=new URL('./experience.html',current);
  if(access){const incoming=new URL(access);if(incoming.origin!==current.origin||incoming.protocol!=='https:')throw Error('Wklej link dostępu do tego samego preview.');for(const [k,v]of incoming.searchParams)if(k==='_vercel_share')url.searchParams.set(k,v);}
  url.hash='preview='+encoded;return url.href;
}
export function validateEnvelope(value){
  if(value?.kind!=='mala-nauka-preview'||value.schemaVersion!==1||typeof value.releaseId!=='string'||typeof value.fingerprint!=='string')throw Error('To nie jest wersja testowa Małej Nauki.');validateSnapshot(value.snapshot);if(value.fingerprint!==fingerprint(value.snapshot))throw Error('Treść linku zmieniła się. Poproś o nowy podgląd.');return value;
}
export function validateFeedback(value){
  if(value?.kind!=='mala-nauka-feedback'||typeof value.releaseId!=='string'||typeof value.fingerprint!=='string'||!Array.isArray(value.comments)||value.comments.length>60||value.comments.some(c=>typeof c.text!=='string'||!c.text.trim()||c.text.length>1200||typeof c.screen!=='string'))throw Error('Nieprawidłowy pakiet uwag.');return value;
}
