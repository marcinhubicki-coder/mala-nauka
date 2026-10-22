import {campaignBookChapters,campaignBookChapter} from './campaign-book-model.mjs';
// The narrator reads the same earned passages as the book, never future steps.
export function campaignNarrative(progress,config,{realmId,kind='intro',stepId,preview=false}={}){
 const chapters=campaignBookChapters(progress,config),previewChapters=preview&&kind!=='step'?campaignBookChapters({journey:{adventure:{campaign:{completed:config.steps.map(s=>s.id)}}}},config):chapters,chapter=campaignBookChapter(previewChapters,realmId);
 if(!chapter||(!preview&&realmId&&chapter.id!==realmId))return null;
 const steps=config.steps.filter(s=>s.realm===chapter.id),step=steps.find(s=>s.id===stepId)||steps.at(-1),entry=chapter.entries.find(e=>e.id===step?.id);
 let event;
 if(kind==='intro')event={id:'intro:'+chapter.id,title:chapter.title,text:chapter.intro,button:'Odkrywajmy!'};
 else if(kind==='step'&&entry)event={id:'step:'+entry.id,title:entry.title,speaker:entry.speaker,turns:entry.turns,text:entry.paragraphs.join('\n\n'),button:'Dalej'};
 else if(kind==='portal'&&(chapter.entries.length===steps.length||preview)){const last=chapter.entries.at(-1);event={id:'portal:'+chapter.id,speaker:'portal',title:chapter.index===config.realms.length-1?'Ostatnia strona księgi':'Dar otwiera drogę',text:last?.paragraphs.at(-1)||chapter.intro,button:chapter.index===config.realms.length-1?'Otwórzmy księgę':'Ruszajmy do portalu!'};}
 if(!event)return null;
 if(!preview&&progress?.journey?.adventure?.campaign?.storySeen?.includes(event.id))return null;
 return {...event,kind,realm:chapter.id,chapter:chapter.index+1};
}
export function rememberCampaignNarrative(progress,event){
 const campaign=progress?.journey?.adventure?.campaign;if(!campaign||!event)return false;
 campaign.storySeen??=[];if(campaign.storySeen.includes(event.id))return false;campaign.storySeen.push(event.id);return true;
}
