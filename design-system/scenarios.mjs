import {Session} from '../game.mjs';
import {createSource} from '../modes.mjs';
import {flagsPreviewSession} from '../flagi/preview-fixture.mjs';
export function createStudioGame(mode,config,words){
 if(mode==='flags')return flagsPreviewSession(new URLSearchParams({country:'pl',variant:'flags'}));
 const source=mode==='spelling'?[{...words.find(word=>word.word==='marzenie'),kind:'spelling'}]:createSource(mode,config,words,()=>.42);
 const game=new Session(source,180,()=>0,()=>.42);
 Object.assign(game,{mode,config,state:'playing',exposureRemaining:0,remaining:145000});
 return game;
}
