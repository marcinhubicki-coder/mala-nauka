import {mathQuestion} from '../modes.mjs';
import {adventureConfig,campaignStepState} from '../shared/adventure-model.mjs';

let current=null;
export function mathCampaign(){return current;}
export function configureMathCampaign(id,progress,words=[]){
 const config=adventureConfig(),step=config.steps.find(s=>s.id===id&&s.mode==='math');
 if(!step||!campaignStepState(progress,step,words,config).unlocked)throw Error('Ten krok kampanii nie jest jeszcze dostępny.');
 current={...step};return current;
}
// Use the campaign curriculum, with the same six-answer renderer and ten-row
// multiplication/division board as free practice.
export function campaignMathQuestion(step,random=Math.random){
 const question=mathQuestion({...step,difficulty:['multiply','divide'].includes(step.category)?Math.min(2,step.difficulty):step.difficulty},random);
 const [a,,b]=question.text.split(' '),left=Number(a),right=Number(b),correct=Number(question.answer);
 return {mode:question.category,a:left,b:right,symbol:question.text.split(' ')[1],correct,answers:question.options.map(Number).sort((a,b)=>a-b),learningKey:question.learningKey,
  ...(['multiply','divide'].includes(question.category)?{rows:question.category==='divide'?right:left,columns:question.category==='divide'?correct:right}:{})};
}
