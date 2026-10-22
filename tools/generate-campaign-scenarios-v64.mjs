// Reproducible demo snapshots go through the game's own cleaner and rating rules.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {cleanProgress} from '../progress.mjs';
import {advanceCampaign,consumeCampaignPresentation} from '../shared/adventure-model.mjs';
import {parseBackupInput} from '../profile-backup.mjs';
const {adventure:config}=JSON.parse(await readFile(new URL('../design-system/config.json',import.meta.url),'utf8'));
const stamp='2026-10-22T12:00:00.000Z',id='campaign-demo-v64';
const specs=[
 ['start','Pierwsze wejście',0,'Iskier, pierwszy krok i pusta księga.'],
 ['flags','Pierwsze flagi',3,'Port odkrywców: pierwszy krok flag, trzy ukończone zadania.'],
 ['mira','Mira · pierwszy kamień',5,'Kartografka, pierwsza część przedmiotu i pięć ocen kroków.'],
 ['bor','Kapitan Bor',8,'Drugi NPC, osiem wpisów w księdze i mieszane oceny.'],
 ['return','Powrót po rundzie',9,'Nowo zdobyte gwiazdki, opowieść i przejście na kolejny kafel.'],
 ['portal','Portal portu',15,'Pełna mapa, trzy części przedmiotu, gotowość do portalu.'],
 ['jungle','Dżungla · Talia',19,'Pierwszy NPC dżungli i odkryty drugi rozdział.'],
 ['jungle-oru','Dżungla · Oru',23,'Strażnik ścieżek w drugim świecie.'],
 ['caves','Podziemia · Brum',34,'Kryształowy opiekun i trzeci rozdział.'],
 ['caves-luma','Podziemia · Luma',38,'Szlifierka kryształów i rozwinięty stan kuźni.'],
 ['fairies','Świetliki · Neri',49,'Archiwistka i kolejne ślady astrolabium.'],
 ['fairies-tym','Świetliki · Tym',53,'Strażnik opowieści w czwartym świecie.'],
 ['space','Kosmos · Nova',64,'Nawigatorka, pięć odkrytych krain.'],
 ['space-orbit','Kosmos · Orbit',68,'Mechanik i kolejne części liry.'],
 ['heavens','Niebiosa · Aurel',79,'Strażnik wiatrów w szóstym świecie.'],
 ['heavens-celina','Niebiosa · Celina',83,'Ogrodniczka chmur i muszla przypływów.'],
 ['underwater','Pod wodą · Runa',94,'Kartografka rafy i ostatni rozdział.'],
 ['underwater-koral','Pod wodą · Koral',98,'Opiekun głębin przed końcem podróży.'],
 ['finale','Finał opowieści',105,'Wszystkie krainy, wszystkie wpisy i końcowy przedmiot.']
];
const scenarios=specs.map(([key,label,count,description],i)=>{
 const p=cleanProgress(null);p.journey.adventure.campaign.started=true;p.journey.tutorialDone=true;
 for(let n=0;n<count;n++){
  const step=config.steps[n],correct=n%4===1?7:10,wrong=10-correct;
  advanceCampaign(p,{id:'demo-'+n,mode:step.mode,campaignStepId:step.id,correct,wrong:Math.max(wrong,step.taskCount-correct),elapsedMs:step.duration*1000,attempts:[]},[],config);
  // A few pools contain fewer than ten entries; a full taskCount still passes.
  consumeCampaignPresentation(p,'demo-'+n);
 }
 // Prior worlds have completed their farewell; the portal scenario intentionally has not.
 const campaign=p.journey.adventure.campaign;
 campaign.storySeen=config.realms.flatMap((r,index)=>[...(count>index*15?['intro:'+r.id]:[]),...config.steps.filter(s=>s.realm===r.id&&campaign.completed.includes(s.id)).map(s=>'step:'+s.id),...(count>(index+1)*15?['portal:'+r.id]:[])]);
 if(key==='return'){const step=config.steps[count-1];campaign.storySeen=campaign.storySeen.filter(s=>s!=='step:'+step.id);campaign.presentation={id:'demo-return',stepId:step.id,realm:step.realm,stars:5,percent:100,previousStars:0,bestStars:5,fromIndex:count-1,advance:true};}
 p.journey.sparks=(key==='start'?220:Math.min(999,220+count*7))*1e6;p.journey.lifetimeSparks=p.journey.sparks;
 p.journey.totals={spelling:count*8,math:count*6,english:count*7,flags:count*8,reading:count*5};
 const backup={format:'mala-nauka-backup',version:1,createdAt:stamp,players:[{profile:{id,nickname:'Wędrowca',avatarId:i%2?'a':'b',pinEnabled:false,pinSalt:null,pinHash:null,createdAt:stamp,updatedAt:stamp},progress:p}],guestProgress:null,preferences:{settings:{},configs:{}}};
 return {id:key,label,description,backup};
});
const pack={format:'mala-nauka-campaign-scenarios',version:1,createdAt:stamp,scenarios};
parseBackupInput(JSON.stringify(pack));
await mkdir(new URL('../outputs/v64/',import.meta.url),{recursive:true});await writeFile(new URL('../outputs/v64/etapy-kampanii.json',import.meta.url),JSON.stringify(pack,null,2)+'\n');
console.log(JSON.stringify(scenarios.map(s=>({id:s.id,completed:s.backup.players[0].progress.journey.adventure.campaign.completed.length}))));
