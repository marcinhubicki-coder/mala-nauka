import {portalEmblemMarkup} from './portal-emblem.mjs';
import {STORY_HOME_CAST_ART} from './story-home-cast-assets.mjs';
import {STORY_HOME_ART} from './story-home-assets.mjs';
import {campaignNpcsForRealm,campaignNpcUrl} from './campaign-cast.mjs';
import {CAMPAIGN_NARRATOR_ART,CAMPAIGN_ISKIER_ART} from './campaign-narrator-asset.mjs';
import {campaignTraveller} from './campaign-layout.mjs';
import {campaignArtifact} from './campaign-artifacts.mjs';
import {portalKeyUrl} from './campaign-portal-key.mjs';
import {CAMPAIGN_BOOK_ART} from './campaign-book-asset.mjs';
import {GALLERY_ART} from './gallery-assets.mjs';
import {ADVENTURE_ART} from './adventure-assets.mjs';
import {STORY_HOME_ANVIL} from './story-home-icon-assets.mjs';
import {sparkBalance,POWERS,powerUpgradeRecipe,powerDefinition,cleanJourney} from './progression.mjs';
import {assetUrl} from './asset-loader.mjs';
import {compileViewMarkup,viewAttrs} from './view-contracts.mjs';
import {renderHomeLogo,renderHomeSettings} from '../home-screen.mjs';
import {homePosition} from './home-layout.mjs';
import {homePlayStyleMarkup} from './home-play-style.mjs';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const a=id=>viewAttrs('home-story',id);

export function storyHomeModel(progress,config,player){
 const campaign=progress?.journey?.adventure?.campaign||{},done=new Set(campaign.completed||[]);
 let realm=config.realms.find(r=>config.steps.some(s=>s.realm===r.id&&!done.has(s.id)))||config.realms.at(-1);
 const previous=config.realms[config.realms.indexOf(realm)-1];
 // A completed world remains home until its farewell/portal has been visited.
 if(previous&&!config.steps.some(s=>s.realm===realm.id&&done.has(s.id))&&!(campaign.storySeen||[]).includes('portal:'+previous.id))realm=previous;
 const steps=config.steps.filter(s=>s.realm===realm.id);let completed=0;while(completed<steps.length&&done.has(steps[completed].id))completed++;
 // Discovery, not the latest dialogue/replayed step, chooses the host portrait.
 const npc=campaignNpcsForRealm(realm).map(n=>({...n,discoveredAt:Math.min(...n.encounters.map(e=>e.step))})).filter(n=>n.discoveredAt<=completed).sort((a,b)=>b.discoveredAt-a.discoveredAt)[0];
 const guide=campaignTraveller(progress,player)==='girl'?CAMPAIGN_NARRATOR_ART:CAMPAIGN_ISKIER_ART;
 const background=STORY_HOME_ART[realm.art||realm.id]||ADVENTURE_ART['campaign-'+(realm.art||realm.id)];
 return {realm,completed,step:steps[completed],number:Math.min(completed+1,steps.length),npc:npc?.id||'guide',guideGender:campaignTraveller(progress,player),portrait:npc?(STORY_HOME_CAST_ART[npc.id]?assetUrl(STORY_HOME_CAST_ART[npc.id].path):campaignNpcUrl(npc.id)):assetUrl(guide.path),host:npc?.name||'Twój przewodnik',background:assetUrl(background.path),sparks:Math.round(sparkBalance(progress?.journey)),forge:forgeState(progress),artifact:campaignArtifact(realm),portal:completed===steps.length};
}

const awardShortcutArt=()=>`<img src="${esc(assetUrl(ADVENTURE_ART['chest-azure-closed'].path))}" width="640" height="567" alt="">`;
const sparkArt=()=>`<svg viewBox="0 0 512 512" aria-hidden="true"><image href="${esc(assetUrl(GALLERY_ART.powers.path))}" width="1024" height="1024"/></svg>`;
const portalArt=portalEmblemMarkup;
const titleCase=value=>String(value).replace(/(^|\s)\p{L}/gu,s=>s.toLocaleUpperCase('pl'));
const dust=(count,cls)=>Array.from({length:count},(_,i)=>`<i class="${cls}" style="--i:${i};--x:${(i*37%91)+5}%;--y:${(i*23%67)+15}%;--drift:${(i*17%29)-14}px;--delay:${(i*713%4100)/1000}s"></i>`).join('');
function guideMagic(){return `<span class="story-guide-magic" aria-hidden="true" data-mn-decoration="true"><span class="story-guide-hand"><img src="${esc(assetUrl(ADVENTURE_ART['teleport-ring'].path))}" alt=""><span class="story-guide-orb"></span>${dust(18,'hand-firefly')}</span><span class="story-guide-wings">${dust(14,'wing-firefly')}</span></span>`;}
function forgeState(progress){const journey=cleanJourney(progress?.journey),balance=sparkBalance(journey),options=POWERS.map(powerDefinition).map(p=>{const r=powerUpgradeRecipe(journey,p),requirements=Object.entries(p.requires).filter(([,n])=>n>0).map(([mode,n])=>journey.totals[mode]/Math.ceil(n*r.next));return {...r,fill:r.complete?0:Math.min(1,balance/r.cost,...requirements,r.ready?1:.96)};}).filter(r=>!r.complete).sort((a,b)=>Number(b.ready)-Number(a.ready)||b.fill-a.fill);return {fill:Math.max(0,options[0]?.fill??1),ready:options.some(r=>r.ready)};}

export function storyHomeImages(model){return [...new Set([model.background,model.portrait,assetUrl(STORY_HOME_ANVIL.path),assetUrl(GALLERY_ART.powers.path),assetUrl(ADVENTURE_ART['teleport-ring'].path),assetUrl(CAMPAIGN_BOOK_ART.path),portalKeyUrl(model.realm),assetUrl(ADVENTURE_ART['chest-azure-closed'].path)])];}

// A bounded, aligned copy of the decoded scenery gives WebKit the same frost
// as Chromium. No full-screen backdrop capture or per-frame layout reads.
export function mountStoryHomeFrost(root){
 const panel=root.querySelector('.story-home-panel'),photo=root.querySelector('[data-ds-key="story-home-photo"]'),film=panel?.querySelector('.story-home-frost');if(!film||!photo)return ()=>{};
 let frame=0;
 const sync=()=>{const p=photo.getBoundingClientRect(),r=film.getBoundingClientRect();if(!p.width||!r.width)return;for(const [key,value]of Object.entries({x:p.left-r.left,y:p.top-r.top,w:p.width,h:p.height}))film.style.setProperty('--scene-'+key,value+'px');film.dataset.ready='true';const figure=root.querySelector('.story-home-portrait-figure'),settings=root.querySelector('.home-settings-button');if(figure&&settings)figure.style.setProperty('--fx-ceiling',Math.max(0,settings.getBoundingClientRect().bottom-figure.getBoundingClientRect().top+8)+'px');};
 const fitDigits=()=>{const count=root.querySelector('.story-home-spark-value'),label=root.querySelector('[data-ds-key="story-home-spark-label"]');if(!count||!label)return;const text=document.createRange();text.selectNodeContents(label);const width=text.getBoundingClientRect().width,digits=Math.max(3,Number(count.style.getPropertyValue('--spark-digits'))||3),style=getComputedStyle(count),pen=document.createElement('canvas').getContext('2d');pen.font=style.fontWeight+' 100px '+style.fontFamily;count.style.fontSize=(width/pen.measureText('9'.repeat(digits)).width*100)+'px';};
 fitDigits();void document.fonts.ready.then(fitDigits);
 const animations=[];const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 for(const digit of root.querySelectorAll('.story-spark-reel')){const target=Number(digit.dataset.digit),steps=20+target;if(!reduced){const roll=digit.firstElementChild;animations.push(roll.animate([{transform:'translateY(0)'},{transform:`translateY(-${steps}em)`}],{duration:1050+Number(digit.dataset.index)*90,easing:'cubic-bezier(.13,.72,.15,1)',fill:'both'}));}}
 const ring=root.querySelector('.story-forge-meter');if(ring&&!reduced)animations.push(ring.animate([{strokeDashoffset:100},{strokeDashoffset:Number(ring.dataset.offset)}],{duration:1200,easing:'ease-out',fill:'both'}));
 const observer=new ResizeObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{sync();fitDigits();});});observer.observe(photo);observer.observe(panel);sync();
 return ()=>{observer.disconnect();cancelAnimationFrame(frame);animations.forEach(a=>a.cancel());};
}

export function renderStoryHome({nickname='odkrywco',model}){
 const layout=globalThis.__MALA_NAUKA_DESIGN__||{};
 const shortcut=(id,label,action,art)=>`<button class="story-home-shortcut" type="button" data-action="${action}" ${a('story-home-'+id)} aria-label="${esc(label)}"><span class="story-home-shortcut-art" ${a('story-home-'+id+'-art')} aria-hidden="true">${art}</span><span ${a('story-home-'+id+'-label')}>${label}</span></button>`;
 return compileViewMarkup('home-story',`<section class="home-canvas home-is-story" data-ds-ignore="true" data-ds-template="template:home-story" aria-label="Mała Nauka · Twoja kampania">
 <span class="home-background" ${a('home-background')} aria-hidden="true"></span>${renderHomeLogo(homePosition(layout,'home-logo'))}${renderHomeSettings(homePosition(layout,'home-settings'))}
 <div class="home-play-content"><section class="story-home-stage" ${a('story-home-stage')} data-host="${esc(model.npc)}" data-home-cast="${Boolean(STORY_HOME_CAST_ART[model.npc])}" data-realm="${esc(model.realm.id)}">
 <div class="story-home-landscape" ${a('story-home-landscape')}><img ${a('story-home-photo')} src="${esc(model.background)}" width="1024" height="1536" alt=""></div>
 <div class="story-home-portrait-window" ${a('story-home-portrait-window')}><div class="story-home-portrait-figure" data-guide="${model.guideGender||'boy'}"><img class="story-home-portrait" ${a('story-home-portrait')} src="${esc(model.portrait)}" alt="${esc(model.host)}" width="512" height="768">${model.npc==='guide'?guideMagic():''}</div></div>
 <div class="story-home-greeting" ${a('story-home-greeting')}><p ${a('story-home-hello')}>Hej, ${esc(nickname)}!</p><h1 ${a('story-home-title')}>Twoja<br>przygoda<br><em>trwa!</em></h1></div>
 <section class="story-home-panel" ${a('story-home-panel')} aria-label="Twoja przygoda">
 <div class="story-home-frost" aria-hidden="true" data-mn-decoration="true"><img src="${esc(model.background)}" alt="" width="1024" height="1536"></div>
 <div class="story-home-wallet" ${a('story-home-wallet')}>
 <div class="story-home-sparks" ${a('story-home-sparks')}><div class="story-home-spark-pill" ${a('story-home-spark-pill')}><span class="story-home-spark-art" ${a('story-home-spark-art')} aria-hidden="true">${sparkArt()}${dust(12,'wallet-firefly')}</span><strong class="story-home-spark-value" ${a('story-home-spark-value')} data-dynamic aria-label="${model.sparks} iskier" style="--spark-digits:${Math.max(3,String(model.sparks).length)}">${String(model.sparks).split('').map((digit,i)=>`<span class="story-spark-reel" data-digit="${digit}" data-index="${i}" aria-hidden="true"><span style="transform:translateY(-${20+Number(digit)}em)">${Array.from({length:30},(_,n)=>`<span>${n%10}</span>`).join('')}</span></span>`).join('')}</strong><span class="story-home-wallet-label" ${a('story-home-spark-label')}>Twoje Iskry Mocy</span></div></div>
 <button class="story-home-shortcut story-home-forge ${model.forge.ready?'is-ready':''}" type="button" data-action="home-forge" ${a('story-home-forge')} aria-label="Uwolnij Moc${model.forge.ready?' · moc gotowa':''}"><span class="story-home-shortcut-art" ${a('story-home-forge-art')}><svg class="story-forge-ring" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="home-forge-rainbow" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ffcf59"/><stop offset=".26" stop-color="#fda7ce"/><stop offset=".52" stop-color="#baadff"/><stop offset=".76" stop-color="#83dfef"/><stop offset="1" stop-color="#6cceb2"/></linearGradient></defs><path class="story-forge-track" d="M18.18 81.82 A45 45 0 1 1 81.82 81.82"/><path class="story-forge-meter" d="M18.18 81.82 A45 45 0 1 1 81.82 81.82" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${100-model.forge.fill*100}" data-offset="${100-model.forge.fill*100}"/></svg><img class="story-home-forge-art" src="${esc(assetUrl(STORY_HOME_ANVIL.path))}" width="512" height="512" alt=""></span><span class="story-home-wallet-label" ${a('story-home-forge-label')}>Uwolnij Moc</span></button>
 </div>
 <nav class="story-home-tools" ${a('story-home-tools')} aria-label="Skarby i opowieść">
 ${shortcut('awards','Nagrody','home-awards',awardShortcutArt())}
 ${shortcut('book','Księga','home-book',`<img src="${esc(assetUrl(CAMPAIGN_BOOK_ART.path))}" width="64" height="64" alt="">`)}
 ${shortcut('artifact','Zagadka','home-artifact',portalArt())}
 </nav>
 <section class="story-home-mission" ${a('story-home-mission')}><p ${a('story-home-world')}>Dziś poznajesz ${esc(titleCase(model.realm.name))}</p><button class="story-home-continue" type="button" ${a('story-home-continue')} data-action="campaign"><span>${model.portal?'Wracam do portalu':'Kontynuuj kampanię'}</span></button></section>
 </section></section></div>${homePlayStyleMarkup('story')}</section>`);
}
