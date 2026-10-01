// Isolated review fixture. Used only by the explicitly labelled preview frame;
// it never writes player progress or changes the production dashboard.
import { addLearningSession } from './shared/mastery.mjs?v=1';
export function exampleProgress(words) {
  let learning=null;
  const history=[];
  for(const [index,date] of ['2026-09-01T12:00:00Z','2026-09-03T12:00:00Z','2026-09-09T12:00:00Z'].entries()) {
    const chosen=index===2?words.slice(0,37):words.slice(0,24);
    const attempts=chosen.map((word,i)=>({...word,kind:'spelling',correct:i<32,at:date}));
    const result={id:'demo-'+index,mode:'spelling',duration:180,category:'all',difficulty:0,date,attempts,correct:attempts.filter(a=>a.correct).length,wrong:attempts.filter(a=>!a.correct).length};
    history.unshift(result);learning=addLearningSession(learning,result);
  }
  return {history,best:{},today:{day:'2026-09-09',count:37},learning};
}
