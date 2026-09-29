const DB_NAME='malaNauka.local.v1';
const DB_VERSION=1;
const SESSION_KEY='malaNauka.sessionPlayerId';
const FALLBACK_KEY='malaNauka.localProfilesFallback.v1';

const now=()=>new Date().toISOString();
const makeId=()=>globalThis.crypto?.randomUUID?.()||`player-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
const cleanNickname=value=>String(value||'').trim().replace(/\s+/g,' ').slice(0,20);
const validPin=pin=>/^\d{4}$/.test(String(pin||''));
const publicPlayer=player=>player?{id:player.id,nickname:player.nickname,createdAt:player.createdAt,updatedAt:player.updatedAt}:null;

function fallbackHash(text){
 let hash=2166136261;
 for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
 return `fallback-${(hash>>>0).toString(16).padStart(8,'0')}`;
}
async function sha256(text){
 try{
  const bytes=new TextEncoder().encode(text);
  const digest=await crypto.subtle.digest('SHA-256',bytes);
  return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('');
 }catch{return fallbackHash(text);}
}
function randomSalt(){
 try{
  const bytes=new Uint8Array(16);crypto.getRandomValues(bytes);
  return [...bytes].map(byte=>byte.toString(16).padStart(2,'0')).join('');
 }catch{return `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;}
}

function readFallback(){
 try{
  const value=JSON.parse(localStorage.getItem(FALLBACK_KEY)||'null');
  if(value&&typeof value==='object')return {players:Array.isArray(value.players)?value.players:[],progress:value.progress&&typeof value.progress==='object'?value.progress:{},meta:value.meta&&typeof value.meta==='object'?value.meta:{}};
 }catch{}
 return {players:[],progress:{},meta:{}};
}
function writeFallback(value){
 try{localStorage.setItem(FALLBACK_KEY,JSON.stringify(value));return true;}catch{return false;}
}

function openDb(){
 return new Promise((resolve,reject)=>{
  if(!('indexedDB'in globalThis)){reject(new Error('IndexedDB unavailable'));return;}
  const request=indexedDB.open(DB_NAME,DB_VERSION);
  request.onupgradeneeded=()=>{
   const db=request.result;
   if(!db.objectStoreNames.contains('players'))db.createObjectStore('players',{keyPath:'id'});
   if(!db.objectStoreNames.contains('progress'))db.createObjectStore('progress',{keyPath:'playerId'});
   if(!db.objectStoreNames.contains('meta'))db.createObjectStore('meta',{keyPath:'key'});
  };
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||new Error('IndexedDB open failed'));
 });
}
function requestResult(request){
 return new Promise((resolve,reject)=>{
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||new Error('IndexedDB request failed'));
 });
}
function txDone(tx){
 return new Promise((resolve,reject)=>{
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error||new Error('IndexedDB transaction failed'));
  tx.onabort=()=>reject(tx.error||new Error('IndexedDB transaction aborted'));
 });
}

class LocalPlayerService{
 constructor(){this.db=null;this.fallback=false;this.ready=null;}
 async init(){
  if(this.ready)return this.ready;
  this.ready=(async()=>{
   try{this.db=await openDb();this.fallback=false;}
   catch{this.db=null;this.fallback=true;}
   return this;
  })();
  return this.ready;
 }
 async listPlayers(){
  await this.init();
  let players;
  if(this.fallback)players=readFallback().players;
  else{
   const tx=this.db.transaction('players','readonly');
   players=await requestResult(tx.objectStore('players').getAll());
  }
  return players.sort((a,b)=>String(a.createdAt).localeCompare(String(b.createdAt))).map(publicPlayer);
 }
 async getPlayer(id){
  await this.init();
  if(!id)return null;
  let player;
  if(this.fallback)player=readFallback().players.find(item=>item.id===id)||null;
  else{
   const tx=this.db.transaction('players','readonly');
   player=await requestResult(tx.objectStore('players').get(id));
  }
  return publicPlayer(player);
 }
 async getPrivatePlayer(id){
  await this.init();
  if(!id)return null;
  if(this.fallback)return readFallback().players.find(item=>item.id===id)||null;
  const tx=this.db.transaction('players','readonly');
  return await requestResult(tx.objectStore('players').get(id))||null;
 }
 async createPlayer({nickname,pin}){
  await this.init();
  const safeName=cleanNickname(nickname);
  if(safeName.length<2)throw new Error('Nick powinien mieć co najmniej 2 znaki.');
  if(!validPin(pin))throw new Error('PIN musi mieć 4 cyfry.');
  const salt=randomSalt();
  const stamp=now();
  const player={id:makeId(),nickname:safeName,pinSalt:salt,pinHash:await sha256(`${salt}:${pin}`),createdAt:stamp,updatedAt:stamp};
  if(this.fallback){
   const data=readFallback();data.players.push(player);
   if(!writeFallback(data))throw new Error('Nie udało się zapisać profilu.');
  }else{
   const tx=this.db.transaction('players','readwrite');
   tx.objectStore('players').add(player);await txDone(tx);
  }
  return publicPlayer(player);
 }
 async verifyPin(id,pin){
  if(!validPin(pin))return false;
  const player=await this.getPrivatePlayer(id);
  if(!player)return false;
  return player.pinHash===await sha256(`${player.pinSalt}:${pin}`);
 }
 async unlockPlayer(id,pin){
  if(!(await this.verifyPin(id,pin)))return null;
  const player=await this.getPlayer(id);
  try{sessionStorage.setItem(SESSION_KEY,id);}catch{}
  await this.setMeta('lastPlayerId',id);
  return player;
 }
 async useCreatedPlayer(id){
  const player=await this.getPlayer(id);
  if(!player)return null;
  try{sessionStorage.setItem(SESSION_KEY,id);}catch{}
  await this.setMeta('lastPlayerId',id);
  return player;
 }
 async getSessionPlayer(){
  let id='';
  try{id=sessionStorage.getItem(SESSION_KEY)||'';}catch{}
  if(!id)return null;
  const player=await this.getPlayer(id);
  if(!player){this.lockSession();return null;}
  return player;
 }
 lockSession(){try{sessionStorage.removeItem(SESSION_KEY);}catch{}}
 async getProgress(playerId){
  await this.init();
  if(!playerId)return null;
  if(this.fallback)return readFallback().progress[playerId]??null;
  const tx=this.db.transaction('progress','readonly');
  const row=await requestResult(tx.objectStore('progress').get(playerId));
  return row?.value??null;
 }
 async saveProgress(playerId,value){
  await this.init();
  if(!playerId)throw new Error('Missing player id');
  const row={playerId,value,updatedAt:now()};
  if(this.fallback){
   const data=readFallback();data.progress[playerId]=value;
   if(!writeFallback(data))throw new Error('Nie udało się zapisać postępu.');
   return;
  }
  const tx=this.db.transaction('progress','readwrite');
  tx.objectStore('progress').put(row);await txDone(tx);
 }
 async migrateLegacyProgress(playerId,value){
  if(!playerId||!value)return false;
  const migrated=await this.getMeta('legacyProgressMigrated');
  if(migrated)return false;
  const existing=await this.getProgress(playerId);
  if(existing){await this.setMeta('legacyProgressMigrated',true);return false;}
  await this.saveProgress(playerId,value);
  await this.setMeta('legacyProgressMigrated',true);
  return true;
 }
 async getMeta(key){
  await this.init();
  if(this.fallback)return readFallback().meta[key]??null;
  const tx=this.db.transaction('meta','readonly');
  const row=await requestResult(tx.objectStore('meta').get(key));
  return row?.value??null;
 }
 async setMeta(key,value){
  await this.init();
  if(this.fallback){
   const data=readFallback();data.meta[key]=value;writeFallback(data);return;
  }
  const tx=this.db.transaction('meta','readwrite');
  tx.objectStore('meta').put({key,value});await txDone(tx);
 }
}

export const playerService=new LocalPlayerService();
