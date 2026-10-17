import test from 'node:test';
import assert from 'node:assert/strict';
import { playerService,LocalPlayerService,AVATARS,NICKNAME_MAX_LENGTH,MAX_PLAYERS } from '../player-service.mjs';
import { ruleGroups } from '../shared/rule-groups.mjs';
import { readFile } from 'node:fs/promises';
const storage=()=>{const map=new Map();return {getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,value),removeItem:key=>map.delete(key)};};
test('nick has three Polish characters; all 12 avatars persist; optional PIN really bypasses switching',async()=>{
 globalThis.localStorage=storage();globalThis.sessionStorage=storage();
 assert.equal(AVATARS.length,12);
 assert.equal(NICKNAME_MAX_LENGTH,8);assert.equal(MAX_PLAYERS,3);
 await assert.rejects(playerService.createPlayer({nickname:'mmmmmmmmm',pinEnabled:false}),/maksymalnie 8 znaków/);
 const maximum=await playerService.createPlayer({nickname:'mmmmmmmm',pinEnabled:false});
 assert.equal(maximum.nickname,'mmmmmmmm');
 await assert.rejects(playerService.createPlayer({nickname:'Ąś',pin:'1234'}),/co najmniej 3 znaki/);
 const protectedPlayer=await playerService.createPlayer({nickname:'Łucja',pin:'1234',avatarId:'a'});
 assert.equal(protectedPlayer.hasPin,true);
 assert.equal(await playerService.unlockPlayer(protectedPlayer.id,'0000'),null);
 assert.equal((await playerService.unlockPlayer(protectedPlayer.id,'1234')).id,protectedPlayer.id);
 const open=await playerService.createPlayer({nickname:'Żaneta',pinEnabled:false,avatarId:'l'});
 assert.equal(open.avatarId,'l');assert.equal(open.hasPin,false);
 await assert.rejects(playerService.createPlayer({nickname:'Czwarty',pinEnabled:false}),/maksymalnie 3 profile/);
 playerService.lockSession();assert.equal((await playerService.unlockPlayer(open.id,'')).id,open.id);
 await playerService.setPinProtection(open.id,{enabled:true,pin:'4321'});
 playerService.lockSession();assert.equal(await playerService.unlockPlayer(open.id,''),null);
 await playerService.unlockPlayer(open.id,'4321');await playerService.setPinProtection(open.id,{enabled:false});
 playerService.lockSession();assert.equal((await playerService.unlockPlayer(open.id,'')).hasPin,false);
 await assert.rejects(playerService.setPinProtection(protectedPlayer.id,{enabled:false}),/Najpierw/);
 const edited=await playerService.updatePlayer(open.id,{nickname:'Zosia',avatarId:'k'});assert.equal(edited.nickname,'Zosia');assert.equal(edited.avatarId,'k');
 await playerService.deletePlayer(open.id);assert.equal((await playerService.listPlayers()).length,2);
});
test('the only saved profile can be deleted and leaves an empty profile list',async()=>{
 globalThis.localStorage=storage();globalThis.sessionStorage=storage();const service=new LocalPlayerService();
 const only=await service.createPlayer({nickname:'Maja',pinEnabled:false});await service.useCreatedPlayer(only.id);
 await service.deletePlayer(only.id);assert.deepEqual(await service.listPlayers(),[]);assert.equal(await service.getSessionPlayer(),null);
});
test('rules use existing explanations with bounded distinct illustrated examples',async()=>{
 const words=(await Promise.all(Array.from({length:8},(_,i)=>readFile(new URL(`../data/words-0${i+1}.json`,import.meta.url),'utf8').then(JSON.parse)))).flat();
 for(const category of new Set(words.map(w=>w.category))){
  const groups=ruleGroups(words,category);assert.ok(groups.length);
  for(const group of groups){assert.ok(group.words.length<=10);assert.ok(group.examples.length<=10);assert.equal(new Set(group.words.map(w=>w.word)).size,group.words.length);assert.ok(words.some(w=>w.learning.explanation===group.explanation));assert.ok(group.words.every(w=>w.category===category&&w.learning.title===group.title));}
 }
});
