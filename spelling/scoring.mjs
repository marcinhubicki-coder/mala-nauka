export const DEFAULT_SCORING=Object.freeze({correctPoints:1,wrongPenalty:0,hintPercent:100,comboEvery:3,comboBonus:0});
export function validateScoring(s){
 const ranges={correctPoints:[1,20],wrongPenalty:[0,20],hintPercent:[0,100],comboEvery:[2,12],comboBonus:[0,20]};
 if(!s||Object.keys(s).length!==5||Object.entries(ranges).some(([key,[min,max]])=>!Number.isInteger(s[key])||s[key]<min||s[key]>max))throw Error('Nieprawidłowe zasady naliczania punktów.');
 return s;
}
// Saved rules travel with the result; later Studio edits cannot rewrite history.
export function scoreAttempts(attempts,settings=DEFAULT_SCORING){
 validateScoring(settings);
 let streak=0,bestStreak=0,base=0,hintDiscount=0,penalty=0,combo=0;
 const rows=attempts.map((a,index)=>{
  const correct=a.correct===true;streak=correct&&!a.hintUsed?streak+1:0;bestStreak=Math.max(streak,bestStreak);
  const earned=correct?settings.correctPoints:0,discount=correct&&a.hintUsed?earned*(100-settings.hintPercent)/100:0;
  // Assistance breaks the bonus chain, even if the answer is correct.
  if(a.hintUsed)streak=0;
  const bonus=correct&&streak>0&&streak%settings.comboEvery===0?settings.comboBonus:0,loss=correct?0:settings.wrongPenalty;
  base+=earned;hintDiscount+=discount;penalty+=loss;combo+=bonus;
  return {index:index+1,word:a.word||`Słowo ${index+1}`,correct,hintUsed:a.hintUsed===true,streak,base:earned,hintDiscount:discount,penalty:loss,combo:bonus,delta:Math.round((earned-discount-loss+bonus)*100)/100};
 });
 const total=Math.max(0,Math.round((base-hintDiscount-penalty+combo)*100)/100),correct=attempts.filter(a=>a.correct===true).length;
 return {total,base,hintDiscount:Math.round(hintDiscount*100)/100,penalty,combo,bestStreak,correct,wrong:attempts.length-correct,accuracy:attempts.length?Math.round(correct/attempts.length*100):0,rows};
}
export function scoreResult(result){
 const attempts=Array.isArray(result.attempts)?result.attempts:[];
 if(!result.scoring)return {total:result.correct||0,base:result.correct||0,hintDiscount:0,penalty:0,combo:0,accuracy:result.correct+result.wrong?Math.round(result.correct/(result.correct+result.wrong)*100):0,rows:[]};
 try{return scoreAttempts(attempts,result.scoring);}catch{return {total:result.correct||0,base:result.correct||0,hintDiscount:0,penalty:0,combo:0,rows:[]};}
}
