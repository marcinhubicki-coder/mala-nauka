// One rating scale for all campaign modes. Passing starts at three stars.
export const CAMPAIGN_STAR_THRESHOLDS=Object.freeze([20,40,60,70,81]);
export const CAMPAIGN_PASS_STARS=3;
export function campaignRoundRating(result){
 const correct=Number.isSafeInteger(result.correct)&&result.correct>=0?result.correct:0;
 const wrong=Number.isSafeInteger(result.wrong)&&result.wrong>=0?result.wrong:0;
 const total=correct+wrong,percent=total?Math.floor(correct/total*100+1e-8):0;
 const stars=total?CAMPAIGN_STAR_THRESHOLDS.filter(n=>percent>=n).length:0;
 return {stars,percent,correct,wrong};
}
export const campaignStarMedal=()=>({id:'campaign-stargazer',scope:'campaign',mode:'spelling',kind:'medal',title:'Szlak pięciu gwiazd',description:'Zdobywaj pięć gwiazdek na kolejnych krokach swojej wyprawy.',chest:3,stages:[5,15,30].map(target=>[{metric:'perfectSteps',target}])});
export function cleanCampaignRatings(scores={}){
 const next={};for(const [id,row]of Object.entries(scores&&typeof scores==='object'?scores:{})){
  if(!id||id.length>180||['__proto__','constructor','prototype'].includes(id)||!row||typeof row!=='object')continue;
  if(!Number.isInteger(row.stars)||row.stars<0||row.stars>5||!Number.isInteger(row.percent)||row.percent<0||row.percent>100)continue;
  next[id]={stars:row.stars,percent:row.percent,attempts:Math.max(1,Math.min(1e6,Number.isSafeInteger(row.attempts)?row.attempts:1)),resultId:String(row.resultId||'').slice(0,180)};
 }
 return next;
}
export function cleanCampaignPresentation(value){
 if(!value||typeof value!=='object'||typeof value.id!=='string'||typeof value.stepId!=='string'||typeof value.realm!=='string')return null;
 if(![value.id,value.stepId,value.realm].every(id=>id&&id.length<=180&&!['__proto__','constructor','prototype'].includes(id)))return null;
 if(!['stars','previousStars','bestStars'].every(k=>Number.isInteger(value[k])&&value[k]>=0&&value[k]<=5)||!Number.isInteger(value.percent)||value.percent<0||value.percent>100||!Number.isInteger(value.fromIndex)||value.fromIndex<0||value.fromIndex>15)return null;
 return {id:value.id,stepId:value.stepId,realm:value.realm,stars:value.stars,percent:value.percent,previousStars:value.previousStars,bestStars:value.bestStars,fromIndex:value.fromIndex,advance:value.advance===true};
}
