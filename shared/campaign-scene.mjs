import {visibleCampaignWorlds} from './campaign-layout.mjs';
import {portalKeyUrl,portalSpiritUrl,portalKeyState} from './campaign-portal-key.mjs';
import {campaignNarrative,rememberCampaignNarrative} from './campaign-narrator-model.mjs';
import {campaignNarratorUrl,beginCampaignPresentation,openCampaignNarrator,cancelCampaignNarrator} from './campaign-narrator.mjs';
import {mountCampaignFieldMagic} from './campaign-field-magic.mjs';
import {campaignBookButton} from './campaign-book.mjs';
import {changeCampaignCard} from './campaign-card-motion.mjs';
import {arriveCampaignWorld} from './campaign-portal.mjs';
import {campaignRatingMarkup,presentCampaignStars,cancelCampaignStars} from './campaign-stars.mjs';
import {campaignStory,campaignTaskLabel} from './campaign-story.mjs';
import {decodeImage} from './screen-readiness.mjs';
import {CAMPAIGN_GRID,realmRoute,realmTileQuad,campaignPosition,campaignTraveller,campaignFacing,campaignTravelFacing} from './campaign-layout.mjs';
import {backButton} from './navigation-parts.mjs';
import {ADVENTURE_MODES,adventureConfig,campaignSummary,cleanAdventure} from './adventure-model.mjs';
import {campaignTileChoices,discoverySettings} from './campaign-discovery.mjs';
import {mountCampaignPuzzle} from './campaign-puzzle.mjs';
import {ADVENTURE_ART} from './adventure-assets.mjs';
import {assetUrl} from './asset-loader.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const art=id=>assetUrl(ADVENTURE_ART[id]?.path||'');
function tileGeometry(realm,index){const quad=realmTileQuad(realm,index),xs=quad.map(p=>p.x),ys=quad.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y,points=quad.map(p=>[(p.x-x)/w*100,(p.y-y)/h*100]);return {style:`left:${x*100}%;top:${y*100}%;width:${w*100}%;height:${h*100}%;clip-path:polygon(${points.map(p=>p.join('% ')+'%').join(',')})`,svg:`<svg class="campaign-tile-outline" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" data-mn-decoration="true"><polygon points="${points.map(p=>p.join(',')).join(' ')}" vector-effect="non-scaling-stroke"/></svg>`};}
function campaignGridMarkup(route,steps,editing){const g=CAMPAIGN_GRID,project=(u,v)=>[(g.originX+(u-v)*g.x)*1200,(g.originY+(u+v)*g.y)*1500].join(' ');let lines='';for(let i=-160;i<=360;i+=4)lines+=`M${project(i,-160)}L${project(i,360)}M${project(-160,i)}L${project(360,i)}`;return `<svg class="campaign-editor-grid" viewBox="0 0 1200 1500" aria-hidden="true"><path d="${lines}"/></svg>${(editing?steps:[]).map((s,i)=>`<button type="button" class="campaign-step-handle" data-campaign-step-handle="${s.id}" data-route-index="${i}" style="left:${route[i].x*100}%;top:${route[i].y*100}%" aria-label="Pole ${i+1}: ${esc(s.name)}">${i+1}</button>`).join('')}`;}
export function campaignRewardHint(step,progress,words,config){
 const group=config.steps.filter(s=>s.realm===step.realm),index=group.indexOf(step);
 if((index+1)%5!==0)return '';
 const recipes=config.recipes.filter(r=>r.id==='campaign-stargazer'||r.id==='campaign-voyager'||r.mode===step.mode),candidate=recipes.find(r=>r.id==='campaign-voyager'&&index===14)||recipes.find(r=>r.id==='campaign-stargazer')||recipes.find(r=>r.kind==='medal');
 return candidate?`<small class="campaign-reward-hint" data-campaign-reward="${esc(candidate.id)}">${candidate.kind==='medal'?'Możliwy medal':'Możliwe trofeum'}: ${esc(candidate.title)}</small>`:'';
}
export function campaignCardMarkup(progress,realm,choice,config,award=null){
 const {step,index,complete}=choice,score=cleanAdventure(progress.journey?.adventure).campaign.ratings[step.id];
 return `<div class="campaign-task-copy"><span class="campaign-step-eyebrow">Krok ${index+1} · ${esc(campaignTaskLabel(step).replace('Odkrywaj poprawną pisownię','Poprawna pisownia').replace('Poznaj nowe angielskie słowa','Angielskie słowa').replace('Czytaj i odkrywaj znaczenie','Czytaj ze zrozumieniem'))}</span><div class="campaign-story-row"><div class="campaign-story">${esc(step.story||campaignStory(realm,index))}</div></div>${campaignRewardHint(step,progress,[],config)}</div><div class="campaign-book-medallion">${campaignBookButton()}${campaignRatingMarkup(score,{heldStars:award?.stepId===step.id?award.previousStars:undefined,showEmpty:true})}</div><div class="campaign-task-launch"><div><h2>${ADVENTURE_MODES[step.mode]}</h2><p class="campaign-task-detail">${step.limitMode==='count'?step.taskCount+' zadań':step.duration/60+' min'}${complete?' · ukończony':' · cel: 3 gwiazdki'}</p></div><button type="button" class="primary" data-action="campaign-start" data-campaign-key="cta" data-campaign-start="${step.id}">${complete?'Zagraj ponownie':'Ruszam dalej'}</button></div>`;
}
function portalCardSelected(progress,realm,config,selectedStep,award){return !award&&campaignPosition(progress,realm,config).index===15&&(!selectedStep||selectedStep==='portal:'+realm.id);}
export function campaignPortalCardMarkup(progress,realm,config){const key=portalKeyState(progress,config,realm.id);return `<div class="campaign-task-launch portal-task"><div><h2>${key.final?'Brama opowieści':'Portal Światów'}</h2><p class="campaign-story">${esc(key.name)}. Wszystkie części są połączone. ${key.final?'Połącz światła siedmiu krain i odkryj zakończenie.':'Po drugiej stronie czeka '+esc(key.next)+'.'}</p></div></div><div class="campaign-book-medallion portal-key-medallion"><img class="campaign-portal-key" src="${esc(key.url)}" width="512" height="768" alt="${esc(key.name)}, złożony przedmiot tej krainy"></div><button type="button" class="campaign-next-world" data-action="campaign-portal" data-campaign-portal="${config.realms.indexOf(realm)+1}">${key.final?'Odkryj zakończenie':'Wejdź do nowego świata'}</button>`;}
export async function refreshCampaignCard(root,progress,config,selectedStep){
 const screen=root.querySelector('.campaign-screen'),realm=config.realms.find(r=>r.id===screen?.querySelector('.campaign-map')?.dataset.realm);if(!realm)return;
 const choices=campaignTileChoices(progress,realm,config),position=campaignPosition(progress,realm,config),choice=choices.find(c=>c.step.id===selectedStep&&c.enabled)||choices[Math.min(14,position.index)];
 const portal=portalCardSelected(progress,realm,config,selectedStep);screen.classList.toggle('is-at-portal',portal);screen.dataset.selectedStep=portal?'portal:'+realm.id:choice.step.id;screen.querySelectorAll('.campaign-tile').forEach(tile=>{const selected=!portal&&tile.dataset.campaignSelect===choice.step.id;tile.classList.toggle('is-selected',selected);tile.setAttribute('aria-pressed',String(selected));});
 const card=screen.querySelector('.campaign-itinerary');let html=portal?campaignPortalCardMarkup(progress,realm,config):campaignCardMarkup(progress,realm,choice,config);
 await changeCampaignCard(card,html);
 screen.dispatchEvent(new Event('campaign-card-change'));
}
export async function playCampaignReturn(root,progress,config,{award,from,controller,onPresented,onNarrated,narration=false}={}){
 const screen=root.querySelector('.campaign-screen');if(!screen)return;const run=screen.mnCampaignRun,alive=()=>screen.isConnected&&screen.mnCampaignRun===run,realmId=screen.querySelector('.campaign-map')?.dataset.realm;
 const event=narration?campaignNarrative(progress,config,{realmId,kind:award?'step':'intro',stepId:award?.stepId}):null;
 let dim=null;
 try{
  if(from?.world){await arriveCampaignWorld(root,controller);if(!alive())return;}
  dim=award||event?beginCampaignPresentation(root):null;
  if(event){const dialog=openCampaignNarrator(root,event);if(!await dialog.accepted||!alive())return;if(rememberCampaignNarrative(progress,event))await onNarrated?.(event);if(!alive())return;}
  if(award){
   const shown=await presentCampaignStars(root,award,{sharedShade:true});if(!shown||!alive())return;
   await onPresented?.(award.id);if(!alive())return;
   await dim?.finish();if(!alive())return;
   if(award.advance)await animateCampaignToken(root,progress,config,{realm:award.realm,index:award.fromIndex},controller);
   else {void controller?.play();delete screen.dataset.travelling;}
   if(alive())await refreshCampaignCard(root,progress,config,award.advance?undefined:award.stepId);
  }else if(from&&!from.world){await dim?.finish();if(alive())await animateCampaignToken(root,progress,config,from,controller);}
 }finally{await dim?.finish();}
}
export async function narrateCampaignPortal(root,progress,config,{onNarrated,preview=false,onContinue}={}){
 const screen=root.querySelector('.campaign-screen'),run=screen?.mnCampaignRun,alive=()=>screen?.isConnected&&screen.mnCampaignRun===run,realmId=root.querySelector('.campaign-map')?.dataset.realm,event=campaignNarrative(progress,config,{realmId,kind:'portal',preview});
 if(!event)return onContinue?await onContinue():true;const dim=beginCampaignPresentation(root);
 try{if(!await openCampaignNarrator(root,event).accepted||!alive())return false;if(!preview&&rememberCampaignNarrative(progress,event))await onNarrated?.(event);if(!alive())return false;await dim.finish();if(!alive())return false;return onContinue?await onContinue():true;}finally{await dim.finish();}
}
export function campaignMarkup(progress,words=[],{realmId,config=adventureConfig(),editor=false,player,grid=false,selectedStep,fromIndex,tester=false,presentation=null}={}){
 const summary=campaignSummary(progress,words,config),realm=config.realms.find(r=>r.id===(realmId||summary.next?.realm))||config.realms.at(-1),done=new Set(cleanAdventure(progress?.journey?.adventure).campaign.completed),realmIndex=config.realms.indexOf(realm),steps=config.steps.filter(s=>s.realm===realm.id),position=campaignPosition(progress,realm,config),route=realmRoute(realm),traveller=campaignTraveller(progress,player),names={boy:'Chłopiec',girl:'Dziewczynka'},choices=campaignTileChoices(progress,realm,config),selection=choices.find(s=>s.step.id===(presentation?.stepId||selectedStep)&&s.enabled)||choices[Math.min(position.index,14)],chosen=selection.step,finished=position.index===15;
 const tokenIndex=fromIndex===undefined?position.index:fromIndex,token=route[tokenIndex],backdrop=ADVENTURE_ART['backdrop-'+(realm.art||realm.id)]?.path,portalCard=portalCardSelected(progress,realm,config,selectedStep,presentation);
 return `<section class="campaign-screen ${editor?'is-editor':''} ${grid?'has-grid':''} ${portalCard?'is-at-portal':''}" data-campaign-screen ${tester?'data-tester="true"':''} data-selected-step="${portalCard?'portal:'+realm.id:chosen.id}" data-ds-key="campaign-screen" data-ds-kind="container" data-ds-recipe="container-campaign">${backdrop?`<img class="campaign-backdrop" src="${esc(assetUrl(backdrop))}" alt="" width="1080" height="2340">`:''}<header class="campaign-header">${backButton()}<div><h1>${esc(realm.name)}</h1></div></header><nav class="campaign-realms" aria-label="Światy">${(editor||tester?config.realms:visibleCampaignWorlds(progress,config)).map((r,i)=>{const unlocked=i===0||config.steps.filter(s=>s.realm===config.realms[i-1]?.id).every(s=>done.has(s.id));return `<button type="button" class="${unlocked?'':'is-locked'}" data-action="campaign-realm" data-campaign-realm="${r.id}" aria-label="${unlocked?esc(r.name):'Nieodkryty świat '+(i+1)}" aria-pressed="${r.id===realm.id}" ${editor||unlocked?'':'disabled'}><img src="${esc(art('world-icon-'+(r.art||r.id)))}" alt="" width="72" height="72"><span class="campaign-sr-only">${unlocked?esc(r.name):'Nieodkryty'}</span></button>`;}).join('')}</nav><div class="campaign-map" data-realm="${realm.id}" data-discovery-pending><img src="${esc(art('campaign-'+(realm.art||realm.id)))}" alt="${esc(realm.description)}" width="1200" height="1500" decoding="async"><canvas class="campaign-puzzle" aria-hidden="true" data-mn-decoration="true"></canvas>${grid?campaignGridMarkup(route,steps,editor):''}<svg class="campaign-completed-path" viewBox="0 0 1200 1500" aria-hidden="true"><polyline points="${route.slice(0,position.index+1).map(p=>p.x*1200+','+p.y*1500).join(' ')}"/></svg>${choices.map(({step,index,enabled,complete})=>{const tile=tileGeometry(realm,index);return `<button type="button" class="campaign-tile ${!portalCard&&index===selection.index?'is-selected':''} ${complete?'is-complete':''} ${enabled?'':'is-unavailable'}" data-action="campaign-select" data-campaign-select="${step.id}" data-campaign-tile="${index}" aria-pressed="${!portalCard&&index===selection.index}" ${enabled||tester?'':'disabled'} style="${tile.style}" aria-label="Krok ${index+1} · ${ADVENTURE_MODES[step.mode]}${complete?' · powtórz':''}">${tile.svg}<span class="campaign-tile-number" aria-hidden="true">${index+1}</span><span class="campaign-sr-only">${index+1}</span></button>`;}).join('')}${realm.milestones.map((m,i)=>`<span class="campaign-milestone ${position.index>=(i+1)*5?'is-complete':''}" data-milestone="${m.id}" style="left:${m.x*100}%;top:${m.y*100}%" aria-hidden="true"></span>`).join('')}<span class="campaign-token" data-traveller="${traveller}" data-facing="${campaignFacing(route,tokenIndex)}" data-step-index="${tokenIndex}" style="left:${token.x*100}%;top:${token.y*100}%" aria-label="Najdalszy postęp"><span class="campaign-avatar-pose"><img src="${esc(art('traveller-'+traveller))}" alt="" width="512" height="512"></span></span><button type="button" class="campaign-portal ${portalCard?'is-selected':''}" data-action="campaign-portal" data-campaign-portal="${realmIndex+1}" style="left:${route[15].x*100}%;top:${route[15].y*100}%" ${tester||finished?'':'disabled'} aria-label="${realmIndex===config.realms.length-1?'Brama końca opowieści':'Portal do następnego świata'}"><span class="campaign-sr-only">Dalej</span></button></div><section class="campaign-itinerary" aria-live="polite">${portalCard?campaignPortalCardMarkup(progress,realm,config):campaignCardMarkup(progress,realm,selection,config,presentation)}</section></section>`;
}
export async function campaignMarkupReady(...args){const html=campaignMarkup(...args),template=document.createElement('template');template.innerHTML=html;await Promise.all([...template.content.querySelectorAll('img')].map(image=>decodeImage(image.src)).concat(decodeImage(art('teleport-ring')),decodeImage(campaignNarratorUrl(campaignTraveller(args[0],args[2]?.player))),...(template.content.querySelector('.is-at-portal')?[decodeImage(portalSpiritUrl()),decodeImage(portalKeyUrl(template.content.querySelector('.campaign-map')?.dataset.realm||'city'))]:[])));return html;}
const scenes=new WeakMap();
export async function mountCampaignScene(root,progress,config=adventureConfig(),{fromIndex,grid=false}={}){
 const screen=root.querySelector('.campaign-screen'),map=screen?.querySelector('.campaign-map'),realm=config.realms.find(r=>r.id===map?.dataset.realm);if(!realm)return null;
 const index=campaignPosition(progress,realm,config).index,route=realmRoute(realm),settingsKey=JSON.stringify([discoverySettings(config),grid]),existing=scenes.get(screen);
 if(existing){if(existing.settingsKey===settingsKey){existing.controller.setProgress(index,fromIndex??index);if(fromIndex===undefined)void existing.controller.play();return existing.controller;}const mounted=await mountCampaignPuzzle(root,{index,fromIndex,route,realm:realm.art||realm.id,config,grid});if(!mounted)return null;existing.controller=mounted;existing.settingsKey=settingsKey;if(fromIndex===undefined)void existing.controller?.play();return existing.controller;}
 let controller,dimensions='';
 const magic=mountCampaignFieldMagic(root),leader=()=>magic.refresh();
 const fit=()=>{
  if(!screen.isConnected){resize.disconnect();cardResize.disconnect();magic.destroy();return;}const next=[screen.clientWidth,screen.clientHeight].join();if(next===dimensions){leader();return;}dimensions=next;
  // A fixed camera per viewport and painting. Card height never enters this calculation.
  const nav=screen.querySelector('.campaign-realms'),safeBottom=parseFloat(getComputedStyle(screen).getPropertyValue('--app-safe-bottom'))||0,bottom=screen.clientHeight-safeBottom-16-200-12,minY=Math.min(...route.map(p=>p.y-.152)),maxY=Math.max(...route.map(p=>p.y+.035)),room=Math.max(170,bottom-nav.offsetTop-nav.offsetHeight-12);
  map.style.width=`min(var(--campaign-art-width),${room*.8/(maxY-minY)}px)`;map.style.top=(bottom-maxY*map.offsetHeight+map.offsetHeight*.51)+'px';leader();
 };
 const resize=new ResizeObserver(fit),cardResize=new ResizeObserver(leader);resize.observe(screen);cardResize.observe(screen.querySelector('.campaign-itinerary'));screen.addEventListener('campaign-card-change',leader);fit();
 controller=await mountCampaignPuzzle(root,{index,fromIndex,route,realm:realm.art||realm.id,config,grid});if(!controller)return null;scenes.set(screen,{controller,settingsKey});if(fromIndex===undefined)void controller.play();await changeCampaignCard(screen.querySelector('.campaign-itinerary'),screen.querySelector('.campaign-itinerary').innerHTML);return controller;
}
export async function renderCampaignScene(root,progress,words,options={}){
 if(options.isCurrent&&!options.isCurrent())return null;
 const current=root.querySelector('.campaign-screen');if(current){current.mnCampaignRun=(current.mnCampaignRun||0)+1;cancelCampaignStars(root);cancelCampaignNarrator(root);for(const node of current.querySelectorAll('.campaign-token img,.campaign-teleport-ring')){for(const a of node.getAnimations())a.cancel();if(node.classList.contains('campaign-teleport-ring'))node.remove();else node.style.clipPath='';}delete current.dataset.travelling;const map=current.querySelector('.campaign-map');if(map)delete map.dataset.teleport;if(options.presentation){current.dataset.ratingPhase='preparing';current.dataset.travelling='true';}}
 const html=await campaignMarkupReady(progress,words,options);if(options.isCurrent&&!options.isCurrent())return null;
 const template=document.createElement('template');template.innerHTML=html;const next=template.content.querySelector('.campaign-screen'),old=root.querySelector('.campaign-screen'),realm=configRealm(next,options.config),identity=JSON.stringify([realm,options.player?.avatarId,!!options.editor,!!options.grid,options.config.steps.map(s=>[s.id,s.realm,s.x,s.y]),next.querySelector('.campaign-map>img').src]);
 if(old?.mnSceneIdentity===identity){
  old.classList.toggle('is-at-portal',next.classList.contains('is-at-portal'));old.toggleAttribute('data-tester',!!options.tester);old.dataset.selectedStep=next.dataset.selectedStep;
  for(const selector of ['.campaign-realms button','.campaign-tile','.campaign-milestone','.campaign-portal']){
   const current=[...old.querySelectorAll(selector)],incoming=[...next.querySelectorAll(selector)];current.forEach((node,i)=>{const source=incoming[i];if(!source)return;if(node.className!==source.className)node.setAttribute('class',source.getAttribute('class')||'');for(const attr of ['aria-pressed','aria-label','disabled']){const value=source.getAttribute(attr);if(value===null)node.removeAttribute(attr);else if(node.getAttribute(attr)!==value)node.setAttribute(attr,value);}});
  }
  const path=old.querySelector('.campaign-completed-path polyline');path.setAttribute('points',next.querySelector('.campaign-completed-path polyline').getAttribute('points'));
  const token=old.querySelector('.campaign-token'),freshToken=next.querySelector('.campaign-token');for(const key of ['stepIndex','facing'])token.dataset[key]=freshToken.dataset[key];token.style.left=freshToken.style.left;token.style.top=freshToken.style.top;
  await changeCampaignCard(old.querySelector('.campaign-itinerary'),next.querySelector('.campaign-itinerary').innerHTML);old.dispatchEvent(new Event('campaign-card-change'));
 }else{const nav=old?.querySelector('.campaign-realms');root.innerHTML=html;const screen=root.querySelector('.campaign-screen'),freshNav=screen.querySelector('.campaign-realms');if(nav&&nav.children.length===freshNav.children.length){[...nav.children].forEach((node,i)=>{const source=freshNav.children[i];for(const attr of ['class','aria-pressed','aria-label','disabled']){const value=source.getAttribute(attr);if(value===null)node.removeAttribute(attr);else if(node.getAttribute(attr)!==value)node.setAttribute(attr,value);}});freshNav.replaceWith(nav);}screen.mnSceneIdentity=identity;}
 if(options.isCurrent&&!options.isCurrent())return null;return mountCampaignScene(root,progress,options.config,{fromIndex:options.fromIndex,grid:options.puzzleGrid});
}
function configRealm(screen,config){const realm=config.realms.find(r=>r.id===screen.querySelector('.campaign-map').dataset.realm);return [realm,config.realms.map(r=>[r.id,r.name,r.art])];}

function teleportRing(map){const beam=document.createElement('i');beam.className='campaign-teleport-ring';beam.setAttribute('aria-hidden','true');const img=document.createElement('img');img.src=art('teleport-ring');img.alt='';beam.append(img);map.append(beam);return beam;}
export async function departCampaignTraveller(root,config=adventureConfig()){
 const map=root.querySelector('.campaign-map'),token=map?.querySelector('.campaign-token');if(!token)return;const image=token.querySelector('img');map.dataset.teleport='departing';if(matchMedia('(prefers-reduced-motion:reduce)').matches){image.style.clipPath='inset(100% 0 0 0)';return;}
 const run=map.closest('.campaign-screen').mnCampaignRun,alive=()=>token.isConnected&&map.closest('.campaign-screen').mnCampaignRun===run,beam=teleportRing(map),rise=token.getBoundingClientRect().height*.92,duration=discoverySettings(config).teleportDuration*.42;await decodeImage(beam.querySelector('img').src);if(!alive()){beam.remove();return;}beam.style.left=token.style.left;beam.style.top=token.style.top;
 const mask=image.animate([{clipPath:'inset(0 0 0 0)'},{clipPath:'inset(100% 0 0 0)'}],{duration,easing:'ease-in',fill:'forwards'});
 await beam.animate([{opacity:0,transform:`translate(-50%,calc(-50% - ${rise}px)) scale(.8)`},{opacity:1,offset:.15,transform:`translate(-50%,calc(-50% - ${rise*.85}px))`},{opacity:1,transform:'translate(-50%,-50%)'}],{duration,easing:'ease-in',fill:'forwards'}).finished.catch(()=>{});if(alive())image.style.clipPath='inset(100% 0 0 0)';mask.cancel();beam.remove();
}
export async function animateCampaignToken(root,progress,config=adventureConfig(),from,controller){
 const map=root.querySelector('.campaign-map'),token=map?.querySelector('.campaign-token'),realm=config.realms.find(r=>r.id===map?.dataset.realm);if(!token||!realm||!from||from.realm!==realm.id)return;
 const to=campaignPosition(progress,realm,config),origin=realmRoute(realm)[from.index];if(!origin||!from.arrivalOnly&&from.index===to.index){void controller?.play();return;}
 const screen=map.closest('.campaign-screen'),run=screen.mnCampaignRun,alive=()=>token.isConnected&&screen.mnCampaignRun===run,image=token.querySelector('img'),animations=new Set();let beam;
 const play=async(node,frames,options)=>{const a=node.animate(frames,options);animations.add(a);await a.finished.catch(()=>{});return a;};
 const place=()=>{token.style.left=to.x*100+'%';token.style.top=to.y*100+'%';token.dataset.stepIndex=String(to.index);token.dataset.facing=campaignFacing(realmRoute(realm),to.index);};
 screen.dataset.travelling='true';token.dataset.facing=campaignTravelFacing(realmRoute(realm),from.index,to.index);token.style.left=origin.x*100+'%';token.style.top=origin.y*100+'%';await image.decode().catch(()=>{});if(!alive())return;
 if(matchMedia('(prefers-reduced-motion:reduce)').matches){place();image.style.clipPath='';await controller?.play();if(alive()){map.dataset.teleport='complete';delete screen.dataset.travelling;}return;}
 try{
  beam=teleportRing(map);beam.classList.add('campaign-tile-teleport');beam.style.left=origin.x*100+'%';beam.style.top=origin.y*100+'%';await decodeImage(beam.querySelector('img').src);if(!alive())return;
  const duration=discoverySettings(config).teleportDuration,base='translate(-50%,-50%)',dx=(to.x-origin.x)*map.offsetWidth,dy=(to.y-origin.y)*map.offsetHeight;
  if(!from.arrivalOnly){
   map.dataset.teleport='shrinking';
   const mask=await play(image,[{clipPath:'inset(0 0 0 0)'},{clipPath:'inset(100% 0 0 0)'}],{duration:duration*.22,easing:'ease-in',fill:'forwards'});if(!alive())return;
   image.style.clipPath='inset(100% 0 0 0)';mask.cancel();
   await play(beam,[{opacity:0,transform:base+' scale(1.12)'},{opacity:1,offset:.12,transform:base+' scale(1)'},{opacity:1,transform:base+' scale(.07)'}],{duration:duration*.22,easing:'cubic-bezier(.6,0,.9,.4)',fill:'forwards'});if(!alive())return;
   map.dataset.teleport='hopping';
   const arc=Math.min(70,24+Math.hypot(dx,dy)*.38),frames=Array.from({length:21},(_,i)=>{const t=i/20;return {offset:t,opacity:1,transform:`translate(calc(-50% + ${dx*t}px),calc(-50% + ${dy*t-Math.sin(t*Math.PI)*arc}px)) scale(.07)`};});
   await play(beam,frames,{duration:duration*.24,easing:'cubic-bezier(.35,0,.25,1)',fill:'forwards'});if(!alive())return;
  }
  place();beam.style.left=to.x*100+'%';beam.style.top=to.y*100+'%';for(const a of animations)a.cancel();animations.clear();image.style.clipPath='inset(100% 0 0 0)';const reveal=controller?.play();map.dataset.teleport='landing';
  await play(beam,[{opacity:1,transform:base+' scale(.07)'},{opacity:1,offset:.4,transform:base+' scale(1.3,.35)'},{opacity:1,offset:.72,transform:base+' scale(.94,1.12)'},{opacity:1,transform:base+' scale(1)'}],{duration:duration*.25,easing:'cubic-bezier(.15,.7,.25,1)',fill:'forwards'});if(!alive())return;
  map.dataset.teleport='arriving';const unveil=play(image,[{clipPath:'inset(100% 0 0 0)'},{clipPath:'inset(0 0 0 0)'}],{duration:duration*.28,easing:'ease-out',fill:'forwards'});
  await play(beam,[{opacity:1,transform:base+' scale(1)'},{opacity:.85,offset:.65,transform:base+' scale(1.08)'},{opacity:0,transform:base+' scale(1.18)'}],{duration:duration*.28,easing:'ease-out',fill:'forwards'});await unveil;if(!alive())return;image.style.clipPath='';await reveal;if(!alive())return;map.dataset.teleport='complete';delete screen.dataset.travelling;
 }finally{for(const a of animations)a.cancel();beam?.remove();if(alive())image.style.clipPath='';}
}
