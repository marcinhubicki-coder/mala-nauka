import {questionForWord} from '../spelling/word-pools.mjs';
import {Session} from '../game.mjs';
import {createSource} from '../modes.mjs';
import {flagsPreviewSession} from '../flagi/preview-fixture.mjs';
export function createStudioGame(mode,config,words){
 if(mode==='flags')return flagsPreviewSession(new URLSearchParams({country:'pl',variant:'flags'}));
 const params=new URLSearchParams(globalThis.location?.search||''),word=words.find(word=>word.word===params.get('word'))||words.find(word=>word.word==='marzenie');
 const question=word&&(questionForWord(word,params.get('category')||word.category)||word);
 const source=mode==='spelling'?[{...question,kind:'spelling'}]:createSource(mode,config,words,()=>.42);
 const game=new Session(source,180,()=>0,()=>.42);
 Object.assign(game,{mode,config,state:'playing',exposureRemaining:0,remaining:145000});
 return game;
}
