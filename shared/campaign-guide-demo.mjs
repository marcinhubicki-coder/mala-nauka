// A reviewable interactive sample. It never writes the child's profile or advances a step.
// Charge reservation, bonuses and visual powers use the real game implementation.
import {cleanJourney,reserveChosenPower,answerReward,PROGRESSION_RULES,POWERS,powerDefinition} from './progression.mjs';
import {openCampaignNarrator,beginCampaignPresentation} from './campaign-narrator.mjs';
import {powerArt,playPowerEffect} from './adventure-ui.mjs';
export async function previewGuideCombo(root,{character,entrance='right',streak=6}={}){
 const screen=root.querySelector('.campaign-screen'),run=screen?.mnCampaignRun;if(!screen)return;
 const alive=()=>screen.isConnected&&screen.mnCampaignRun===run;const dim=beginCampaignPresentation(root);
 let journey=cleanJourney({powers:['spark','shield','aurora'],powerLevels:{spark:2,shield:1,aurora:1},meter:100});
 try{
  const event={id:'demo:combo',kind:'combo',character,entrance,title:`${streak} dobrych odpowiedzi!`,text:'Twoja moc jest gotowa. Którą zabierzesz do następnego zadania?',button:'Teraz bez mocy',choices:journey.powers.map(id=>{const p=powerDefinition(POWERS.find(p=>p.id===id));return {id,title:p.name,detail:p.guard?'Ochrona combo · 1 zadanie':`+${Math.round(p.bonus*[0,1,1.35,1.75][journey.powerLevels[id]]*100)}% iskier · 1 zadanie`,art:powerArt(id)};})};
  const choice=openCampaignNarrator(root,event);if(!await choice.accepted||!alive())return;
  const id=choice.choice;if(id)journey=reserveChosenPower(journey,id);screen.dataset.guideDemoCharge=journey.meter;
  const question=openCampaignNarrator(root,{id:'demo:question',kind:'task',character,title:'7 + 5 = ?',text:id?'Moc jest z Tobą. Spróbuj!':'Spróbuj rozwiązać zadanie.',button:'Zamknij próbkę',choices:[12,11,13].map(n=>({id:String(n),title:String(n)}))});
  await question.ready;if(id&&alive())playPowerEffect(question.element,id,journey.powerLevels[id]);
  if(!await question.accepted||!alive()||!question.choice)return;
  const reward=answerReward(journey,{correct:question.choice==='12'},{mode:'math',id:'guide-demo:'+crypto.randomUUID(),streak,rules:PROGRESSION_RULES});
  screen.dataset.guideDemoPower=reward.power||'none';screen.dataset.guideDemoReward=reward.sparks;screen.dataset.guideDemoPending=reward.journey.pending||'none';
  const result=openCampaignNarrator(root,{id:'demo:result',kind:'congratulations',character,entrance:'peek-left',title:question.choice==='12'?'Piękna seria!':'Każda próba uczy',text:question.choice==='12'?`${reward.streak} odpowiedzi w serii! Moc rozświetliła Twoje zadanie i dodała iskier. Pięknie Ci idzie!`:'7 + 5 to 12. Spróbujemy jeszcze raz, spokojnie.',button:'Wracam do mapy'});await result.accepted;
 }finally{await dim.finish();}
}
export function previewNpcEvent(){return {id:'demo:mira',kind:'encounter',speaker:'mira',entrance:'left',chapter:1,title:'Mapa, która zapomniała drogę',text:'Jestem Mira. Pomóż mi odnaleźć szlak między dachami portu.\n\nKażde odkrycie rozbudza iskry. W kuźni zamienisz je w moce, które pomogą Ci w kolejnych zadaniach.',button:'Pomogę Ci!'};}
