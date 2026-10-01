import test from 'node:test';
import assert from 'node:assert/strict';
import { LocalPlayerService } from '../player-service.mjs';
import { parseBackup, validateBackup, backupSummary, BACKUP_MAX_BYTES } from '../profile-backup.mjs';
import { cleanProgress, recordResult } from '../progress.mjs';
import { learningSummary } from '../shared/mastery.mjs';

const storage=()=>{const map=new Map();return {getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key)};};
const fresh=()=>{globalThis.localStorage=storage();globalThis.sessionStorage=storage();return new LocalPlayerService();};
const clone=value=>JSON.parse(JSON.stringify(value));
async function fixture(){
 const service=fresh(),protectedPlayer=await service.createPlayer({nickname:'Łucja',avatarId:'l',pin:'1234'}),open=await service.createPlayer({nickname:'Żaneta',avatarId:'b',pinEnabled:false});
 const progress=cleanProgress(null);
 for(const [i,date] of ['2026-09-01T12:00:00Z','2026-09-03T12:00:00Z','2026-09-09T12:00:00Z'].entries())recordResult(progress,{id:'round-'+i,date,mode:'spelling',duration:180,correct:1,wrong:0,attempts:[{kind:'spelling',word:'burza',masked:'bu_a',answer:'rz',category:'rz/ż',correct:true,hintUsed:false}]});
 await service.saveProgress(protectedPlayer.id,progress);
 return {service,protectedPlayer,open,backup:await service.exportBackup({settings:{sound:true},configs:{spelling:{limitMode:'count',wordLimit:40}},spellingWizard:{limitMode:'count',wordLimit:40}})};
}

test('JSON round trip restores IDs, avatars, protected/open profiles and durable learning without signing in',async()=>{
 const {backup,protectedPlayer,open}=await fixture(),copy=parseBackup(JSON.stringify(backup));
 assert.equal(JSON.stringify(copy).includes('"pin":"1234"'),false);
 const service=fresh();await service.importBackup(copy);
 assert.equal(await service.getSessionPlayer(),null);
 assert.equal((await service.getPlayer(protectedPlayer.id)).avatarId,'l');
 assert.equal(await service.verifyPin(protectedPlayer.id,'0000'),false);
 assert.equal(await service.verifyPin(protectedPlayer.id,'1234'),true);
 assert.equal((await service.unlockPlayer(open.id,'')).hasPin,false);
 const progress=await service.getProgress(protectedPlayer.id);
 assert.equal(progress.history.length,3);assert.equal(learningSummary(progress.learning).mastered,1);
 assert.equal(copy.preferences.configs.spelling.wordLimit,40);
});

test('import replaces only matching IDs, preserves unrelated profiles and does not duplicate repeated imports',async()=>{
 const {backup,protectedPlayer}=await fixture(),service=fresh();
 const other=await service.createPlayer({nickname:'Tomek',pinEnabled:false});
 await service.importBackup(backup);await service.saveProgress(protectedPlayer.id,cleanProgress(null));
 assert.deepEqual(backupSummary(backup,await service.listPlayers()),{added:0,updated:2,profiles:2,rounds:3});
 await service.importBackup(backup);
 assert.equal((await service.listPlayers()).length,3);
 assert.ok(await service.getPlayer(other.id));assert.equal((await service.getProgress(protectedPlayer.id)).history.length,3);
});

test('duplicate profiles, malformed PINs and unsupported/invalid files reject before changing any data',async()=>{
 const {service,backup}=await fixture(),before=clone(await service.exportBackup());
 for(const change of [b=>b.players.push(b.players[0]),b=>b.players[0].profile.pinHash='broken',b=>b.players[1].profile.id='__proto__',b=>b.version=99]){
  const broken=clone(backup);change(broken);await assert.rejects(service.importBackup(broken));
  const after=await service.exportBackup();assert.deepEqual(after.players,before.players);
 }
 assert.throws(()=>parseBackup('{broken'));
 assert.throws(()=>parseBackup(' '.repeat(BACKUP_MAX_BYTES+1)),/5 MB/);
 assert.throws(()=>validateBackup({players:[]}),/poprawną kopią/);
});

test('failed storage leaves the old profiles, progress and unlocked session intact',async()=>{
 const {backup}=await fixture(),service=fresh(),existing=await service.createPlayer({nickname:'Maja',pinEnabled:false});
 await service.unlockPlayer(existing.id,'');const before=clone(await service.exportBackup());
 const original=localStorage.setItem;localStorage.setItem=()=>{throw new Error('Quota exceeded');};
 await assert.rejects(service.importBackup(backup),/Dotychczasowe dane/);localStorage.setItem=original;
 assert.deepEqual((await service.exportBackup()).players,before.players);
 assert.equal((await service.getSessionPlayer()).id,existing.id);
});

test('legacy fallback PIN hashes are portable when secure hashing becomes available',async()=>{
 const {backup,protectedPlayer}=await fixture();let hash=2166136261;
 const text='portable:1234';for(let i=0;i<text.length;i++){hash^=text.charCodeAt(i);hash=Math.imul(hash,16777619);}
 backup.players[0].profile.pinSalt='portable';backup.players[0].profile.pinHash='fallback-'+(hash>>>0).toString(16).padStart(8,'0');
 const service=fresh();await service.importBackup(backup);
 assert.equal(await service.verifyPin(protectedPlayer.id,'1234'),true);
 assert.equal(await service.verifyPin(protectedPlayer.id,'4321'),false);
});
