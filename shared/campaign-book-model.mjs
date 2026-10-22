import {campaignEncounter,campaignNpcEvent} from './campaign-cast.mjs';
import {portalKeyPassage} from './campaign-portal-key.mjs';
import {campaignGuideText} from './campaign-guide-text.mjs';
import {CAMPAIGN_CHAPTERS} from './campaign-book-content.mjs';
export function campaignBookChapters(progress,config,{character}={}){
 const done=new Set(progress?.journey?.adventure?.campaign?.completed||[]);let accessible=true;
 return config.realms.map((realm,index)=>{
  const story=CAMPAIGN_CHAPTERS[realm.art||realm.id]||CAMPAIGN_CHAPTERS.city,steps=config.steps.filter(s=>s.realm===realm.id),unlocked=accessible;
  accessible=accessible&&steps.every(s=>done.has(s.id));
  const last=new Map(steps.map(s=>[s.milestone,s.id])),entries=unlocked?steps.flatMap((step,i)=>{if(!done.has(step.id))return [];const entry=story.entries[i%story.entries.length],npc=campaignEncounter(realm,i+1),milestone=last.get(step.milestone)===step.id;return [{id:step.id,number:i+1,title:step.bookHeading||npc?.title||entry.title,speaker:npc?.id,turns:npc&&!step.bookText?campaignNpcEvent(npc.id,{realmId:realm.id,number:i+1}).turns:undefined,paragraphs:(step.bookText?step.bookText.split(/\n\s*\n/u).filter(Boolean):[...(npc?[...npc.text.split(/\n\s*\n/u),'Iskierka: '+npc.reply]:entry.paragraphs),...([5,10,15].includes(i+1)?[portalKeyPassage(i+1,config.realms[index+1]?.name,realm)]:[])]).map(p=>campaignGuideText(p,character)),milestone}];}):[];
  return {id:realm.id,art:realm.art||realm.id,index,title:realm.bookTitle||story.title,world:realm.name,intro:campaignGuideText(realm.bookIntro||story.intro,character),unlocked,entries,total:steps.length,complete:accessible};
 });
}
export function campaignBookChapter(chapters,realmId){return chapters.find(c=>c.id===realmId&&c.unlocked)||[...chapters].reverse().find(c=>c.unlocked)||chapters[0];}

// Each earned fragment is an independent portrait page; the index lists the chapter.
export function campaignBookPages(chapter,{epilogue}={}){
 const pages=[{id:'prologue',kind:'chapter',number:0,title:chapter.title,paragraphs:[chapter.intro],illustration:0}];
 for(const entry of chapter.entries){if(entry.milestone)pages.push({...entry,id:entry.id+':illustration',kind:'illustration',paragraphs:[],illustration:Math.min(2,Math.ceil(entry.number/5)-1)});pages.push({...entry,kind:entry.milestone?'milestone':'step',illustration:!entry.milestone&&[3,8,13].includes(entry.number)&&entry.paragraphs.join(' ').split(/\s+/u).length<45?Math.min(2,Math.floor(entry.number/5)):null});}
 if(epilogue&&chapter.index===6&&chapter.complete)epilogue.paragraphs.forEach((paragraph,i)=>pages.push({id:i?'epilogue-'+(i+1):'epilogue',kind:'finale',finalePart:i+1,title:epilogue.title,paragraphs:[paragraph],illustration:i===0?2:null}));
 return pages;
}
