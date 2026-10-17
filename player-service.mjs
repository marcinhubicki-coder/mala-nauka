import { BACKUP_FORMAT, BACKUP_VERSION, validateBackup } from './profile-backup.mjs?v=1';
const DB_NAME='malaNauka.local.v1';
const DB_VERSION=1;
const SESSION_KEY='malaNauka.sessionPlayerId';
const FALLBACK_KEY='malaNauka.localProfilesFallback.v1';
const GUEST_PROGRESS_KEY='malaNauka.guestProgress.v1';
const guestPlayer=()=>({id:'guest',nickname:'odkrywco',avatarId:'b'});

const now=()=>new Date().toISOString();
const makeId=()=>globalThis.crypto?.randomUUID?.()||`player-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
export const NICKNAME_MAX_LENGTH=8;
export const MAX_PLAYERS=3;
const cleanNickname=value=>String(value||'').normalize('NFC').trim().replace(/\s+/g,' ');
const validPin=pin=>/^\d{4}$/.test(String(pin||''));
export const AVATARS=Object.freeze(['a','b','c','d','e','f','g','h','i','j','k','l']);
const fallbackAvatar=player=>{
 const source=String(player?.id||player?.nickname||'player');
 let total=0;for(let i=0;i<source.length;i++)total=(total+source.charCodeAt(i))%AVATARS.length;
 return AVATARS[total];
};
const cleanAvatar=value=>AVATARS.includes(String(value||''))?String(value):null;
const publicPlayer=player=>player?{id:player.id,nickname:player.nickname,avatarId:cleanAvatar(player.avatarId)||fallbackAvatar(player),hasPin:player.pinEnabled!==false&&Boolean(player.pinHash),createdAt:player.createdAt,updatedAt:player.updatedAt}:null;

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

export class LocalPlayerService{
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
 async createPlayer({nickname,pin,avatarId,pinEnabled=true}){
  await this.init();
  if((await this.listPlayers()).length>=MAX_PLAYERS)throw new Error(`Możesz mieć maksymalnie ${MAX_PLAYERS} profile.`);
  const safeName=cleanNickname(nickname);
  if([...safeName].length<3)throw new Error('Wpisz nick — co najmniej 3 znaki.');
  if([...safeName].length>NICKNAME_MAX_LENGTH)throw new Error(`Nick może mieć maksymalnie ${NICKNAME_MAX_LENGTH} znaków.`);
  if(pinEnabled&&!validPin(pin))throw new Error('PIN musi mieć 4 cyfry.');
  const salt=randomSalt();
  const stamp=now();
  const id=makeId();
  const player={id,nickname:safeName,avatarId:cleanAvatar(avatarId)||fallbackAvatar({id,nickname:safeName}),pinEnabled:pinEnabled!==false,pinSalt:pinEnabled?salt:null,pinHash:pinEnabled?await sha256(`${salt}:${pin}`):null,createdAt:stamp,updatedAt:stamp};
  if(this.fallback){
   const data=readFallback();data.players.push(player);
   if(!writeFallback(data))throw new Error('Nie udało się zapisać profilu.');
  }else{
   const tx=this.db.transaction('players','readwrite');
   tx.objectStore('players').add(player);await txDone(tx);
  }
  return publicPlayer(player);
 }
 async updatePlayer(id,{nickname,avatarId}){
  const session=await this.getSessionPlayer();
  if(!session||session.id!==id||id==='guest')throw new Error('Najpierw wejdź do swojego profilu.');
  const player=await this.getPrivatePlayer(id);
  if(!player)throw new Error('Nie znaleziono profilu.');
  const safeName=cleanNickname(nickname);
  if([...safeName].length<3)throw new Error('Wpisz nick — co najmniej 3 znaki.');
  if([...safeName].length>NICKNAME_MAX_LENGTH)throw new Error(`Nick może mieć maksymalnie ${NICKNAME_MAX_LENGTH} znaków.`);
  Object.assign(player,{nickname:safeName,avatarId:cleanAvatar(avatarId)||fallbackAvatar({...player,nickname:safeName}),updatedAt:now()});
  if(this.fallback){
   const data=readFallback();data.players=data.players.map(p=>p.id===id?player:p);
   if(!writeFallback(data))throw new Error('Nie udało się zapisać zmian profilu.');
  }else{
   const tx=this.db.transaction('players','readwrite');tx.objectStore('players').put(player);await txDone(tx);
  }
  return publicPlayer(player);
 }
 async deletePlayer(id){
  const session=await this.getSessionPlayer();
  if(!session||session.id!==id||id==='guest')throw new Error('Najpierw wejdź do profilu, który chcesz usunąć.');
  if(this.fallback){
   const data=readFallback();
   data.players=data.players.filter(player=>player.id!==id);
   delete data.progress[id];
   if(data.meta.lastPlayerId===id)delete data.meta.lastPlayerId;
   if(!writeFallback(data))throw new Error('Nie udało się usunąć profilu.');
  }else{
   const tx=this.db.transaction(['players','progress','meta'],'readwrite'),done=txDone(tx);
   tx.objectStore('players').delete(id);
   tx.objectStore('progress').delete(id);
   tx.objectStore('meta').delete('lastPlayerId');
   await done;
  }
  this.lockSession();
  return true;
 }
 async verifyPin(id,pin){
  const player=await this.getPrivatePlayer(id);
  if(!player)return false;
  if(player.pinEnabled===false)return true;
  if(!validPin(pin))return false;
  const text=`${player.pinSalt}:${pin}`;
  return player.pinHash===(player.pinHash?.startsWith('fallback-')?fallbackHash(text):await sha256(text));
 }
 async unlockPlayer(id,pin){
  if(!(await this.verifyPin(id,pin)))return null;
  const player=await this.getPlayer(id);
  try{sessionStorage.setItem(SESSION_KEY,id);}catch{}
  await this.setMeta('lastPlayerId',id);
  return player;
 }
 async setPinProtection(id,{enabled,pin}){
  const session=await this.getSessionPlayer();
  if(!session||session.id!==id||id==='guest')throw new Error('Najpierw wejdź do swojego profilu.');
  const player=await this.getPrivatePlayer(id);
  if(enabled&&!validPin(pin))throw new Error('PIN musi mieć 4 cyfry.');
  const salt=enabled?randomSalt():null;
  Object.assign(player,{pinEnabled:enabled===true,pinSalt:salt,pinHash:enabled?await sha256(`${salt}:${pin}`):null,updatedAt:now()});
  if(this.fallback){const data=readFallback();data.players=data.players.map(p=>p.id===id?player:p);if(!writeFallback(data))throw new Error('Nie udało się zapisać ustawienia PIN-u.');}
  else{const tx=this.db.transaction('players','readwrite');tx.objectStore('players').put(player);await txDone(tx);}
  return publicPlayer(player);
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
  if(id==='guest')return guestPlayer();
  const player=await this.getPlayer(id);
  if(!player){this.lockSession();return null;}
  return player;
 }
 beginGuestSession(){try{sessionStorage.setItem(SESSION_KEY,'guest');}catch{}return guestPlayer();}
 lockSession(){try{sessionStorage.removeItem(SESSION_KEY);}catch{}}
 async getProgress(playerId){
  await this.init();
  if(!playerId)return null;
  if(playerId==='guest'){try{return JSON.parse(sessionStorage.getItem(GUEST_PROGRESS_KEY)||'null');}catch{return null;}}
  if(this.fallback)return readFallback().progress[playerId]??null;
  const tx=this.db.transaction('progress','readonly');
  const row=await requestResult(tx.objectStore('progress').get(playerId));
  return row?.value??null;
 }
 async saveProgress(playerId,value){
  await this.init();
  if(!playerId)throw new Error('Missing player id');
  if(playerId==='guest'){sessionStorage.setItem(GUEST_PROGRESS_KEY,JSON.stringify(value));return;}
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
 async exportBackup(preferences={}){
  await this.init();
  let players,progress;
  if(this.fallback){const data=readFallback();players=data.players;progress=data.progress;}
  else{
   const tx=this.db.transaction(['players','progress'],'readonly');
   const [profiles,rows]=await Promise.all([requestResult(tx.objectStore('players').getAll()),requestResult(tx.objectStore('progress').getAll())]);
   players=profiles;progress=Object.fromEntries(rows.map(row=>[row.playerId,row.value]));
  }
  return validateBackup({format:BACKUP_FORMAT,version:BACKUP_VERSION,createdAt:now(),preferences,guestProgress:await this.getProgress('guest'),
   players:players.map(player=>({profile:{...player,avatarId:cleanAvatar(player.avatarId)||fallbackAvatar(player),pinEnabled:player.pinEnabled!==false&&Boolean(player.pinHash)},progress:progress[player.id]??null}))});
 }
 async importBackup(value){
  const backup=validateBackup(value); // Validate every profile before opening a write transaction.
  await this.init();
  const current=await this.listPlayers(),mergedIds=new Set(current.map(player=>player.id));
  for(const row of backup.players)mergedIds.add(row.profile.id);
  if(mergedIds.size>MAX_PLAYERS)throw new Error(`Po imporcie byłoby więcej niż ${MAX_PLAYERS} profile. Usuń profil albo wybierz mniejszą kopię.`);
  if(this.fallback){
   const data=readFallback(),byId=new Map(data.players.map(player=>[player.id,player]));
   for(const row of backup.players){byId.set(row.profile.id,row.profile);if(row.progress===null)delete data.progress[row.profile.id];else data.progress[row.profile.id]=row.progress;}
   data.players=[...byId.values()];data.meta.legacyProgressMigrated=true;
   if(!writeFallback(data))throw new Error('Nie udało się zapisać kopii. Dotychczasowe dane zostały zachowane.');
  }else{
   // One atomic transaction: a failed profile/progress write rolls the whole import back.
   const tx=this.db.transaction(['players','progress','meta'],'readwrite'),done=txDone(tx);
   for(const row of backup.players){
    tx.objectStore('players').put(row.profile);
    if(row.progress===null)tx.objectStore('progress').delete(row.profile.id);
    else tx.objectStore('progress').put({playerId:row.profile.id,value:row.progress,updatedAt:now()});
   }
   tx.objectStore('meta').put({key:'legacyProgressMigrated',value:true});await done;
  }
  if(backup.guestProgress){try{sessionStorage.setItem(GUEST_PROGRESS_KEY,JSON.stringify(backup.guestProgress));}catch{}}
  this.lockSession(); // Restoring a PIN-protected profile must never sign it in.
  return backup;
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
