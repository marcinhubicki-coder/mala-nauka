// Explicitly labelled visual fixtures only; this module is never loaded in a player session.
import { FLAGS } from '../data/flags.mjs';
import { Session } from '../game.mjs?v=20261002-flags-ready-v2';
import { cleanConfig, flagQuestion } from '../modes.mjs';
export function flagsPreviewSession(params){
 const record=FLAGS.find(record=>record.id===params.get('country'))||FLAGS.find(record=>record.id==='pl');
 const type=['flags','countries','capitals'].includes(params.get('variant'))?params.get('variant'):'flags';
 const config=cleanConfig('flags',{category:`flagcfg:${type}:world:`,duration:180});
 const options=[record,...['is','ch','rs','jp'].map(id=>FLAGS.find(country=>country.id===id)).filter(country=>country.id!==record.id).slice(0,3)];
 // Static reference scenes use the Session clock injection. Real setup rounds
 // still use the ordinary running clock and the same Session state machine.
 const session=new Session(()=>flagQuestion(record,options,config,()=>.4,record.difficulty),180,()=>0,()=>.4);
 if(type==='flags'&&params.get('scene')==='material')session.options=[options[1].country,options[2].country,record.country,options[3].country];
 session.mode='flags';session.config=config;session.feedbackMs=4000;session.remaining=145000;session.correct=1;session.question=2;
 if(params.get('state')==='wrong')session.answer(session.options.find(option=>option!==session.current.answer));
 return session;
}
