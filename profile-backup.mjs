import { cleanProgress } from './progress.mjs?v=5-learning';
import { cleanSettings } from './game.mjs?v=20261001-adventure';
import { modeIds, cleanConfig } from './modes.mjs?v=32-dictation-packs';

export const BACKUP_FORMAT='mala-nauka-backup';
export const BACKUP_VERSION=1;
export const BACKUP_MAX_BYTES=5*1024*1024;
const plain=value=>Boolean(value)&&typeof value==='object'&&!Array.isArray(value);
const stamp=value=>typeof value==='string'&&Number.isFinite(Date.parse(value));
const invalid=()=>new Error('Ten plik nie jest poprawną kopią danych Małej Nauki.');

// Accept only our versioned data, never storage keys or executable content.
// Older long nicknames remain restorable; the eight-letter cap applies to new profiles.
export function validateBackup(value){
 if(!plain(value)||value.format!==BACKUP_FORMAT)throw invalid();
 if(value.version!==BACKUP_VERSION)throw new Error('Ta wersja kopii danych nie jest obsługiwana.');
 if(!Array.isArray(value.players)||value.players.length>1000||!stamp(value.createdAt))throw invalid();
 const ids=new Set();
 const players=value.players.map(row=>{
  const p=row?.profile;
  if(!plain(p)||typeof p.id!=='string'||!/^[\w-]{1,100}$/.test(p.id)||['guest','__proto__','constructor','prototype'].includes(p.id)||ids.has(p.id))throw invalid();
  const nickname=typeof p.nickname==='string'?p.nickname.normalize('NFC').trim().replace(/\s+/g,' '):'';
  if(!nickname||[...nickname].length>40||!stamp(p.createdAt)||!stamp(p.updatedAt)||!/^([a-l])$/.test(p.avatarId))throw invalid();
  if(typeof p.pinEnabled!=='boolean')throw invalid();
  if(p.pinEnabled&&(typeof p.pinSalt!=='string'||!/^[\w-]{1,128}$/.test(p.pinSalt)||typeof p.pinHash!=='string'||!/^(?:[a-f0-9]{64}|fallback-[a-f0-9]{8})$/.test(p.pinHash)))throw invalid();
  if(row.progress!==null&&!plain(row.progress))throw invalid();
  ids.add(p.id);
  return {profile:{id:p.id,nickname,avatarId:p.avatarId,pinEnabled:p.pinEnabled,pinSalt:p.pinEnabled?p.pinSalt:null,pinHash:p.pinEnabled?p.pinHash:null,createdAt:p.createdAt,updatedAt:p.updatedAt},progress:row.progress===null?null:cleanProgress(row.progress)};
 });
 const preferences=plain(value.preferences)?value.preferences:{};
 const configs=Object.fromEntries(modeIds.map(mode=>[mode,cleanConfig(mode,preferences.configs?.[mode])]));
 // The wizard validates this small preference object again when it is opened.
 const wizard=plain(preferences.spellingWizard)?JSON.parse(JSON.stringify(preferences.spellingWizard)):null;
 return {format:BACKUP_FORMAT,version:BACKUP_VERSION,createdAt:value.createdAt,players,
  guestProgress:plain(value.guestProgress)?cleanProgress(value.guestProgress):null,
  preferences:{settings:cleanSettings(preferences.settings),configs,spellingWizard:wizard}};
}

export function parseBackup(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).byteLength>BACKUP_MAX_BYTES)throw new Error('Kopia danych może mieć maksymalnie 5 MB.');
 let value;try{value=JSON.parse(text);}catch{throw invalid();}
 return validateBackup(value);
}

export function backupSummary(backup,existing){
 const ids=new Set(existing.map(player=>player.id));
 const updated=backup.players.filter(row=>ids.has(row.profile.id)).length;
 return {added:backup.players.length-updated,updated,profiles:backup.players.length,
  rounds:backup.players.reduce((sum,row)=>sum+(row.progress?.history.length||0),0)};
}
