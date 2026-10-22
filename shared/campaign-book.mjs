import {waitForScreenEntrance} from './design-runtime.mjs';
import {CAMPAIGN_ARTIFACT_FRAME} from './campaign-book-frame-asset.mjs';
import {campaignGuideText} from './campaign-guide-text.mjs';
import {bookPageMagic} from './campaign-book-magic.mjs';
import {revealBookInk} from './campaign-book-ink.mjs';
import {visibleCampaignWorlds} from './campaign-layout.mjs';
import {CAMPAIGN_EPILOGUE,campaignArtifact} from './campaign-artifacts.mjs';
import {decodeImage} from './screen-readiness.mjs';
import {portalKeyBookMarkup,portalKeyState} from './campaign-portal-key.mjs';
import {CAMPAIGN_BOOK_ART,CAMPAIGN_BOOK_PAGE_ART} from './campaign-book-asset.mjs';
import {campaignBookChapters,campaignBookChapter,campaignBookPages} from './campaign-book-model.mjs';
import {manuscriptSprite,manuscriptInitial,manuscriptAssets} from './campaign-manuscript.mjs';
import {ADVENTURE_ART} from './adventure-assets.mjs';
import {assetUrl} from './asset-loader.mjs';
import {backButton} from './navigation-parts.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const campaignBookIcon=()=>assetUrl(CAMPAIGN_BOOK_ART.path);
export function campaignBookButton(){return `<button type="button" class="campaign-book-button" data-action="campaign-book" data-campaign-book aria-label="Otwórz księgę przygody"><img src="${esc(campaignBookIcon())}" width="52" height="52" alt=""></button>`;}
const navIcon=kind=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${kind==='index'?'<path d="M8 6h12M8 12h12M8 18h12"/><path d="M3 6h.1M3 12h.1M3 18h.1"/>':kind==='previous'?'<path d="m15 5-7 7 7 7"/>':kind==='next'?'<path d="m9 5 7 7-7 7"/>':'<path d="m5 5 7 7-7 7m8-14 7 7-7 7"/>'}</svg>`;
// Edge slices keep the circular medallions and binding proportional as the paper grows taller.
function paperMarkup(){const url=esc(assetUrl(CAMPAIGN_BOOK_PAGE_ART.path));return `<div class="book-paper" aria-hidden="true" data-mn-decoration="true">${[['top',0,280],['middle',280,920],['bottom',1200,336]].map(([part,y,h])=>`<svg class="book-paper-${part}" viewBox="0 ${y} 1024 ${h}" preserveAspectRatio="none"><image href="${url}" width="1024" height="1536"/></svg>`).join('')}</div>`;}
export async function mountCampaignBook(root,{progress,config,realmId,character,initialPage=null,onBack=()=>{}}){
 root.dataset.dsContractPending='campaign-book';
 let entryPage=initialPage,entryPending=true;
 const chapters=campaignBookChapters(progress,config,{character}),visibleWorlds=new Set(visibleCampaignWorlds(progress,config).map(r=>r.id));let chapter=campaignBookChapter(chapters,realmId),pages=[],focused='',indexOpen=false,dead=false,chapterLoading=false,run=0,chapterRun=0,magic=null,fade=null,ink=null,resize,resizeFrame=0;
 const abort=new AbortController(),reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
 root.innerHTML=`<section class="campaign-book" data-book-layout="single" data-mn-managed-presence="true"><header class="book-navigation">${backButton({action:'campaign'})}<div><h1>Księga przygody</h1><span>Twoja opowieść</span></div><img class="book-cover-icon" src="${esc(campaignBookIcon())}" width="68" height="68" alt="Stara księga z kompasem"></header><nav class="book-chapters" aria-label="Rozdziały">${chapters.filter(c=>visibleWorlds.has(c.id)).map(c=>`<button type="button" data-action="book-chapter" data-book-action="chapter" data-book-chapter="${esc(c.id)}" ${c.unlocked?'':'disabled'} aria-label="Rozdział ${c.index+1}${c.unlocked?' · '+esc(c.title):' · jeszcze nieodkryty'}"><img src="${esc(assetUrl(ADVENTURE_ART['world-icon-'+c.art]?.path||''))}" width="56" height="56" alt=""><span>${c.index+1}</span></button>`).join('')}</nav><div class="book-volume">${paperMarkup()}<div class="book-reading-layout"><nav class="book-index-links" aria-label="Spis treści rozdziału" hidden></nav><div class="book-scroll" tabindex="0" aria-label="Strona księgi"></div></div><footer class="book-paging"><div class="book-tools" role="group" aria-label="Nawigacja księgi">${[['index','Spis treści'],['previous','Poprzedni fragment'],['next','Następny fragment'],['newest','Najnowszy fragment']].map(([action,label])=>`<button type="button" ${action==='index'?'class="book-index-toggle" aria-expanded="false"':''} data-book-action="${action}" data-action="book-${action}" aria-label="${label}" title="${label}">${navIcon(action)}</button>`).join('')}</div><span class="book-page-status" role="status"></span></footer></div></section>`;
 const screen=root.querySelector('.campaign-book'),volume=screen.querySelector('.book-volume'),surface=screen.querySelector('.book-reading-layout'),reader=screen.querySelector('.book-scroll'),rail=screen.querySelector('.book-index-links');
 function stop({hold=false}={}){magic?.cancel();fade?.cancel();if(hold)ink?.hold?.();else ink?.clear?.();for(const a of ink?.animations||[])a.cancel();ink=null;}
 function composedText(text){return text.replace(/\s+/gu,' ').trim().replace(/(^|\s)([aiouwzAIUOWZ])\s+/gu,'$1$2\u00a0');}
 function paragraphMarkup(text,index,initial){text=composedText(text);return index||!initial?`<p>${esc(text)}</p>`:`<p class="has-illuminated">${initial}<span class="book-initial-letter">${esc(text[0])}</span>${esc(text.slice(1))}</p>`;}
 function chapterHeading(){return `<div class="book-chapter-crest"><span>Rozdział ${chapter.index+1}</span></div><span class="book-world-name">${esc(chapter.world)}</span>`;}
 function lostArtifact(){const name=campaignArtifact(chapter.art).name;return (/a$/u.test(name.split(' ')[0])?'Zaginiona ':/o$/u.test(name.split(' ')[0])?'Zaginione ':'Zaginiony ')+name;}
 function pageMarkup(page){
  const world=chapter.art,heading=page.kind==='chapter',key=page.id==='key',rich=page.kind==='milestone'||page.kind==='finale',initial=manuscriptInitial(world,(page.paragraphs?.[0]||'')[0]),ornament=manuscriptSprite(world,'ornaments',heading?0:rich?Math.min(4,1+Math.ceil((page.number||15)/5)):1,{className:'book-page-ornament'}),illustration=page.illustration==null?'':manuscriptSprite(world,'miniatures',page.illustration,{className:'book-miniature',label:`Ilustracja: ${page.title}`});
  return `<section class="book-sheet" data-book-entry="${esc(page.id)}" data-page-kind="${page.kind}"><header class="book-chapter-heading">${chapterHeading()}<h2>${esc(heading?chapter.title:page.title)}</h2></header><article class="book-entry ${page.kind==='finale'?'book-epilogue':''} ${page.kind==='illustration'?'book-illustration-page':''} ${heading?'book-prologue':''} ${rich?'is-milestone':''}"><small>${key?'Trzy części jednego przedmiotu':heading?'Początek rozdziału':page.kind==='illustration'?`Kamień milowy · krok ${page.number}`:page.kind==='finale'?'Po siedmiu światach':`Krok ${page.number}${rich?' · kamień milowy':''}`}</small>${ornament}${page.kind==='illustration'?illustration:''}<div class="book-entry-copy">${page.kind==='illustration'?'':illustration}${key?portalKeyBookMarkup(portalKeyState(progress,config,chapter.id)):page.paragraphs.map((p,i)=>paragraphMarkup(p,i,initial)).join('')}</div></article><p class="book-undiscovered">${chapter.complete?'Rozdział odkryty w całości':`${chapter.total-chapter.entries.length} fragmentów czeka na odkrycie`}</p></section>`;
 }
 function indexMarkup(){
  const steps=config.steps.filter(s=>s.realm===chapter.id);
  return `<header>${chapterHeading()}<h2>Spis treści</h2></header>${manuscriptSprite(chapter.art,'ornaments',1,{className:'book-index-ornament'})}<button type="button" class="book-index-prologue" data-action="book-jump" data-book-action="jump" data-book-jump="prologue">Początek · ${esc(chapter.title)}</button><div class="book-index-steps" style="--book-index-count:${chapter.entries.length+(chapter.complete?0:1)}">${steps.flatMap((step,i)=>{const entry=chapter.entries.find(e=>e.id===step.id);if(!entry)return [];return [`<button type="button" data-action="book-jump" data-book-action="jump" data-book-jump="${esc(step.id)}" data-book-number="${i+1}" aria-label="Krok ${i+1} · ${esc(entry.title)}"><span class="book-index-number">${i+1}</span><span class="book-index-title">${esc(entry.title)}</span>${entry.milestone?'<i aria-label="Kamień milowy">◆</i>':''}</button>`];}).join('')}${chapter.complete?'':'<span class="book-index-more" aria-label="Opowieść będzie się rozwijać">· · ·</span>'}</div><button class="book-key-index" type="button" data-action="book-key" data-book-action="key"><img class="book-key-ornament" src="${esc(assetUrl(CAMPAIGN_ARTIFACT_FRAME.path))}" width="768" height="256" alt=""><span>${esc(lostArtifact())}</span></button>`;
 }
 function fit(){
  for(const sheet of reader.querySelectorAll('.book-sheet')){sheet.style.setProperty('--page-type-scale',1);const content=sheet.querySelector('.book-entry');content?.classList.remove('is-compact');const overflow=()=>sheet.scrollHeight>sheet.clientHeight+1||content&&content.scrollHeight>content.clientHeight+1;if(overflow()){content?.classList.add('is-compact');for(let scale=98;scale>=70&&overflow();scale-=2)sheet.style.setProperty('--page-type-scale',(scale/100).toFixed(2));}}
 }
 function update(){
  screen.dataset.currentPage=indexOpen?'index':focused;screen.dataset.bookPageCount=String(pages.length);screen.classList.toggle('is-index-open',indexOpen);screen.querySelector('.book-index-toggle').setAttribute('aria-expanded',String(indexOpen));
  const i=pages.findIndex(p=>p.id===focused),p=pages[i];screen.querySelector('.book-page-status').textContent=indexOpen?'Spis treści':focused==='key'?'Przedmiot':p?.kind==='chapter'?'Początek':p?.kind==='finale'?`Finał ${p.finalePart}/3`:p?.kind==='illustration'?`Ilustracja ${p.number}`:`${p?.number} / ${chapter.total}`;
  screen.querySelector('[data-book-action=previous]').disabled=i<=0;screen.querySelector('[data-book-action=next]').disabled=i<0||i+1>=pages.length;screen.querySelector('[data-book-action=newest]').disabled=!indexOpen&&focused===pages.at(-1)?.id;
  for(const b of rail.querySelectorAll('[data-book-jump]'))b.setAttribute('aria-current',String(b.dataset.bookJump===focused));
 }
 async function turn(id,{animate=true,clear=true}={}){
  const toIndex=id==='index',page=id==='key'?{id:'key',kind:'key',title:lostArtifact(),paragraphs:[]}:pages.find(p=>p.id===id);
  if((!page&&!toIndex)||dead)return;
  const epoch=++run,oldOpacity=getComputedStyle(surface).opacity;surface.style.opacity=oldOpacity;stop({hold:true});screen.dataset.pageTurn='clearing';
  if(animate&&clear&&!reduced()&&reader.firstElementChild){magic=bookPageMagic(volume,surface,'clear');fade=surface.animate([{opacity:oldOpacity,filter:'blur(0)'},{opacity:0,filter:'blur(2px)'}],{duration:430,fill:'forwards',easing:'ease-in'});await magic.finished;if(dead||epoch!==run)return;}
  // Hide BEFORE cancelling the outgoing animation or inserting/decoding any new artwork.
  surface.style.opacity='0';fade?.cancel();screen.dataset.pageTurn='preparing';indexOpen=toIndex;if(!toIndex)focused=id;
  reader.hidden=toIndex;rail.hidden=!toIndex;if(!toIndex)reader.innerHTML=pageMarkup(page);update();fit();
  await Promise.all([...surface.querySelectorAll('image,img')].map(n=>decodeImage(n.getAttribute('href')||n.getAttribute('src'))));
  if(dead||epoch!==run)return;fit();await new Promise(resolve=>requestAnimationFrame(resolve));if(dead||epoch!==run)return;
  screen.dataset.pageTurn='building';if(!entryPending){ink=revealBookInk(toIndex?rail:reader);surface.style.opacity='1';}
  if(animate&&!reduced()){fade=surface.animate([{opacity:0},{opacity:1}],{duration:240,fill:'forwards',easing:'ease-out'});await fade.finished.catch(()=>{});if(dead||epoch!==run)return;fade.cancel();}
  delete screen.dataset.pageTurn;screen.dataset.ready='true';update();
 }
 async function openChapter(next,{animate=true}={}){
  const chapterEpoch=++chapterRun;run++;const opacity=getComputedStyle(surface).opacity;surface.style.opacity=opacity;stop({hold:true});chapterLoading=true;
  if(animate&&!reduced()&&reader.firstElementChild){screen.dataset.pageTurn='clearing';magic=bookPageMagic(volume,surface,'clear');fade=surface.animate([{opacity},{opacity:0,filter:'blur(2px)'}],{duration:430,fill:'forwards',easing:'ease-in'});await magic.finished;if(dead||chapterEpoch!==chapterRun)return;}
  surface.style.opacity='0';fade?.cancel();screen.dataset.pageTurn='loading';chapter=next;
  pages=campaignBookPages(chapter,{epilogue:{...CAMPAIGN_EPILOGUE,paragraphs:CAMPAIGN_EPILOGUE.paragraphs.map(p=>campaignGuideText(p,character))}});screen.dataset.chapter=chapter.id;
  screen.querySelector('.book-navigation>div>span').textContent=`Rozdział ${chapter.index+1} · ${chapter.world}`;
  for(const b of screen.querySelectorAll('[data-book-chapter]'))b.setAttribute('aria-pressed',String(b.dataset.bookChapter===chapter.id));rail.innerHTML=indexMarkup();
  await Promise.all(manuscriptAssets(chapter.art).map(decodeImage));if(dead||chapterEpoch!==chapterRun)return;chapterLoading=false;const landing=entryPage||pages.find(p=>p.id==='epilogue')?.id||pages.at(-1).id;entryPage=null;await turn(landing,{animate,clear:false});
 }
 screen.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b||b.disabled)return;e.stopPropagation();if(b.dataset.action==='campaign'){destroy();onBack();return;}
  if(entryPending)return;
  const action=b.dataset.bookAction;
  if(action==='chapter'){const next=chapters.find(c=>c.id===b.dataset.bookChapter&&c.unlocked);if(next)void openChapter(next);return;}
  if(!screen.hasAttribute('data-ready')||chapterLoading)return;
  if(action==='index')void turn(indexOpen?focused:'index');if(action==='key')void turn('key');if(action==='jump')void turn(b.dataset.bookJump);if(action==='newest')void turn(pages.at(-1).id);
  if(action==='previous'||action==='next'){const i=pages.findIndex(p=>p.id===focused),next=pages[i+(action==='next'?1:-1)];if(next)void turn(next.id);}
 },{signal:abort.signal});
 surface.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();screen.querySelector(`[data-book-action=${e.key==='ArrowLeft'?'previous':'next'}]`).click();},{signal:abort.signal});
 function destroy(){if(dead)return;dead=true;run++;chapterRun++;stop();resize?.disconnect();cancelAnimationFrame(resizeFrame);abort.abort();if(root.dataset.dsContractPending==='campaign-book')delete root.dataset.dsContractPending;}
 let lastSize='';resize=new ResizeObserver(()=>{const size=surface.clientWidth+'x'+surface.clientHeight;if(size===lastSize)return;lastSize=size;cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(()=>{if(dead||screen.dataset.pageTurn||entryPending)return;const revealing=ink?.animations?.some(a=>a.playState==='running');if(revealing)return;ink?.clear?.();for(const a of ink?.animations||[])a.cancel();ink=null;fit();});});resize.observe(surface);
 await Promise.all([document.fonts.load('20px CampaignQuill').catch(()=>[]),document.fonts.load('700 26px CampaignQuill').catch(()=>[]),decodeImage(assetUrl(CAMPAIGN_BOOK_PAGE_ART.path))]);
 await openChapter(chapter,{animate:false});if(root.contains(screen))delete root.dataset.dsContractPending;
 // Preparation resolves first, so the shared incoming transition cannot deadlock
 // waiting for ink that itself must wait for that transition.
 void waitForScreenEntrance(root).then(()=>{if(dead||!screen.isConnected)return;fit();entryPending=false;screen.dataset.entryReveal='true';ink=revealBookInk(reader);surface.style.opacity='1';if(!reduced())fade=surface.animate([{opacity:0},{opacity:1}],{duration:300,easing:'ease-out',fill:'both'});void ink.finished.then(()=>{if(!dead)delete screen.dataset.entryReveal;});});
 return {destroy};
}
