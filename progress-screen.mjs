import {resolveRoute} from './shared/navigation.mjs';
import {forgePower,chooseTrophy,starLevel,cleanJourney} from './shared/progression.mjs';
import {forgeMarkup,trophiesMarkup,trophyLevel,ruleCardsMarkup,openRuleCard,awardPreview,trophyDialogMarkup} from './shared/journey-ui.mjs';
import {awardCatalog} from './shared/award-catalog.mjs';
import {GALLERY_ART} from './shared/gallery-assets.mjs';
import {pageHeading} from './shared/navigation-parts.mjs';
import {assetUrl} from './shared/asset-loader.mjs';
import { ruleGroups } from './shared/rule-groups.mjs?v=1';
import { learningSummary } from './shared/mastery.mjs?v=2';
import { sceneFor, sceneUrl } from './spelling/scenes.mjs?v=27-final-assets';
import { openResultRule } from './ortografia/result-rules.mjs?v=6-scroll-edges';
import { CATEGORIES } from './game.mjs?v=20261001-adventure';
import { createJellyV4 } from './shared/jelly-v4.mjs?v=3';

const controllers=new WeakMap();
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const INSTRUMENTAL={spelling:'ortografią',math:'matematyką',english:'angielskim',flags:'flagami',reading:'czytaniem'};
const NAMES={spelling:'Ortografia',math:'Matematyka',english:'Angielski',flags:'Flagi',reading:'Czytanie'};
const ICONS={spelling:[0,0,512,512],math:[512,0,512,512],english:[1024,0,512,512],flags:[0,512,512,512],reading:[512,512,512,512]};
const check='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m8 16 5.5 6L25 10"/></svg>';
const repeat='<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M24 13a9 9 0 0 0-15-4M7 19a9 9 0 0 0 15 4M24 6v7h-7M7 26v-7h7"/></svg>';
const gear='<svg class="progress-gear" viewBox="0 0 32 32" aria-hidden="true"><g fill="currentColor"><rect x="13" y="2" width="6" height="28" rx="1.5"/><rect x="2" y="13" width="28" height="6" rx="1.5"/><rect x="13" y="2" width="6" height="28" rx="1.5" transform="rotate(45 16 16)"/><rect x="13" y="2" width="6" height="28" rx="1.5" transform="rotate(-45 16 16)"/><path fill-rule="evenodd" d="M16 5a11 11 0 1 1 0 22 11 11 0 0 1 0-22Zm0 6a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"/></g><circle cx="16" cy="16" r="5" fill="#fff1bc"/></svg>';
const chevron='<svg class="progress-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>';
const sprig='<svg class="progress-sprig" viewBox="0 0 48 64" aria-hidden="true"><path d="M20 66Q24 34 37 8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M34 26Q28 12 41 3Q45 19 34 26ZM30 38Q27 22 16 19Q13 36 30 38ZM28 44Q29 26 44 27Q44 43 28 44ZM25 54Q23 37 10 36Q9 52 25 54ZM23 60Q28 44 39 45Q40 59 23 60Z" fill="currentColor"/></svg>';
function glyph(mode){return '<svg class="progress-mode-glyph" viewBox="'+ICONS[mode].join(' ')+'" aria-hidden="true"><image href="'+esc(assetUrl('assets/progress/mode-icons-v2.webp'))+'" width="1536" height="1024"/></svg>';}
function spelled(word){const [before,...after]=word.masked.split('_');return esc(before)+'<mark>'+esc(word.answer)+'</mark>'+esc(after.join('_'));}
export function collectionFiltersMarkup(filter='all'){return '<nav class="collection-filters" data-ds-recipe="container-collection-filters" data-ds-kind="container" data-ds-key="collection-filters" aria-label="Pokaż słowa">'+[['all','Odkryte'],['mastered','Umiem'],['learning','Ćwiczę'],['review','Powtórzę']].map(([key,label])=>'<button type="button" data-ds-recipe="button-collection-filter" data-ds-kind="button" data-ds-atomic="true" data-ds-key="collection-filter-'+key+'" data-progress="filter" data-filter="'+key+'" aria-pressed="'+(filter===key)+'">'+label+'</button>').join('')+'</nav>';}
export function collectionWordMarkup(word,state='mastered'){const scene=sceneFor(word.masked,word.word),labels={learning:'Ćwiczę',consolidating:'Utrwalam',mastered:'Umiem',review:'Powtórzę'};return '<button type="button" class="collection-word" data-ds-recipe="container-collection-word" data-ds-kind="button" data-progress="rule" data-word="'+esc(word.word)+'"><img data-ds-recipe="image-collection-word" data-ds-kind="image" src="'+esc(sceneUrl(scene))+'" alt="" width="120" height="120" loading="lazy" decoding="async"><strong data-ds-recipe="text-collection-word" data-ds-kind="text" data-ds-atomic="true">'+spelled(word)+'</strong><small data-ds-recipe="text-collection-state" data-ds-kind="text" class="'+(state||'undiscovered')+'">'+(labels[state]||'Poznaj zasadę')+'</small></button>';}
export function progressCollectionMarkup(spelling=true,forge=false){return '<button type="button" class="progress-illustrated collection '+(forge?'is-forge':'')+'" data-ds-recipe="container-progress-collection" data-ds-kind="button" data-ds-key="progress-collection" data-progress="'+(forge?'forge':'collection')+'"><span class="progress-collection-art" data-ds-recipe="background-progress-collection" data-ds-kind="background" data-ds-key="progress-collection-art" style="'+(forge?'background-image:url('+esc(assetUrl(GALLERY_ART.forge.path))+')':'')+'" aria-hidden="true"></span><strong class="progress-collection-title" data-ds-recipe="text-progress-collection" data-ds-kind="text" data-ds-key="progress-collection-title">'+(forge?'Kuźnia<br>mocy':'Moja kolekcja<br>'+(spelling?'słów':'przygód'))+'</strong><span class="progress-link-arrow" data-ds-recipe="icon-home-chevron" data-ds-kind="icon" data-ds-atomic="true" aria-hidden="true">'+chevron+'</span></button>';}
export function destroyProgressScreen(root){controllers.get(root)?.();controllers.delete(root);}

export function renderProgressScreen(root,{progress,words,backAction='home',initialMode='spelling',initialScreen='dashboard',onPractice,onSave,onBack,onNavigate}) {
  destroyProgressScreen(root);
  let mode=initialMode in NAMES?initialMode:'spelling',screen=initialScreen,filter='all',achievementPage=0,rulesView='rules',ruleCategory=CATEGORIES[0];
  let awardKind='trophies',previewKind='medals',selectedTrophy='mastery-5',busy=false,upgradeDialog=null;
  const abort=new AbortController(),rulesJelly=createJellyV4({indicatorSelector:'.rules-view-indicator'});
  let suppressRulesClickUntil=0;
  const knowledge=learningSummary(progress.learning);
  const byWord=new Map(knowledge.items.map(item=>[item.word,item]));
  progress.journey||=cleanJourney(null);for(const item of knowledge.items)progress.journey.cards[item.word]||={firstSeenAt:item.firstSeenAt||item.lastSeenAt,correct:item.correct||0};
  knowledge.learning+=Object.keys(progress.journey.cards).filter(word=>!byWord.has(word)).length;
  const earnedWords=knowledge.items.filter(item=>item.masteryEarned).length;
  const stateLabel={learning:'Ćwiczę',consolidating:'Utrwalam',mastered:'Umiem',review:'Powtórzę'};
  const categoryGroups=CATEGORIES.map(category=>{
    const all=words.filter(word=>word.category===category);
    const mastered=all.filter(word=>byWord.get(word.word)?.state==='mastered').length;
    const earned=all.filter(word=>byWord.get(word.word)?.masteryEarned).length;
    const review=all.filter(word=>byWord.get(word.word)?.state==='review').length;
    return {category,total:all.length,mastered,earned,review};
  });
  function tabs(){return '<nav class="progress-modes" aria-label="Postępy według przygody">'+Object.keys(NAMES).map(id=>'<button type="button" data-progress="mode" data-mode="'+id+'" class="progress-mode '+(mode===id?'is-active':'')+'" aria-pressed="'+(mode===id)+'" aria-label="'+NAMES[id]+'">'+glyph(id)+(mode===id?'<span>'+NAMES[id]+'</span>':'')+'</button>').join('')+'</nav>';}
  function header(title,sub=false){return pageHeading(title,{className:'progress-header',backClass:'progress-back',...(sub?{progress:screen==='forge'&&initialScreen==='forge'&&backAction==='return-results'?'return-results':'dashboard'}:{action:backAction})});}
  function render(){
    root.dataset.view='history';root.dataset.mode=mode;root.dataset.historyState=screen==='collection'&&mode!=='spelling'?'sessions':screen;
    if(screen!=='dashboard'){renderSubpage();return;}
    const spelling=mode==='spelling';
    const sums=spelling?knowledge:{mastered:0,learning:0,review:0};
    const heading=spelling?'Coraz pewniej<span class="progress-hero-line">z <span class="progress-hero-emphasis">ortografią!</span></span>':'Twoja przygoda<span class="progress-hero-line">z <span class="progress-hero-emphasis">'+INSTRUMENTAL[mode]+'!</span></span>';
    root.innerHTML='<section class="progress-canvas"><div class="progress-hero">'+header('Moje wyniki')+tabs()+'<div class="progress-hero-copy"><h2>'+heading+'</h2><p>Zobacz, co już umiesz<br>i do czego warto<br>jeszcze wrócić.</p></div></div>'+
      '<div class="progress-content"><div class="progress-stats" aria-label="Twoja nauka">'+[['mastered','Umiem',check],['learning','Ćwiczę',gear],['review','Powtórzę',repeat]].map(([key,label,icon])=>'<button type="button" class="progress-stat '+key+'" data-progress="collection" data-filter="'+key+'"><span class="progress-stat-icon" aria-hidden="true">'+icon+'</span><span><b>'+sums[key]+'</b><small>'+label+'</small></span>'+sprig+'</button>').join('')+'</div>'+
      '<div class="progress-links">'+progressCollectionMarkup(spelling,true)+'<button type="button" class="progress-illustrated categories" data-progress="categories"><strong>Kategorie<br>do poćwiczenia</strong><span class="progress-link-arrow" aria-hidden="true">'+chevron+'</span></button></div>'+
       '<section class="progress-achievements"><header><div><h2>Twoje osiągnięcia</h2><p>Odkryj, co czeka tuż za rogiem!</p></div><button type="button" data-progress="achievements">Zobacz więcej '+chevron+'</button></header>'+awardPreview(progress.journey,earnedWords,words,mode,previewKind,achievementPage)+'</section>'+
      '<button type="button" class="progress-rules-link" data-progress="rules"><span class="progress-rule-art" aria-hidden="true"></span><span class="progress-rule-copy"><strong>Wyjaśnienia i zasady</strong><small>Zobacz proste wyjaśnienia<br>zasad ortografii i przykłady.</small></span><i aria-hidden="true">'+chevron+'</i></button></div></section>';
  }
  function rulesContentMarkup(){
    const selected=words.filter(word=>word.category===ruleCategory);
    const groups=ruleGroups(words,ruleCategory);
    let content='<nav class="rules-categories" aria-label="Wybierz kategorię zasad">'+CATEGORIES.map(category=>'<button type="button" data-progress="rules-category" data-category="'+category+'" aria-pressed="'+(ruleCategory===category)+'">'+esc(category.replace('/',' / '))+'</button>').join('')+'</nav>';
    if(rulesView==='rules')content+=ruleCardsMarkup(words,progress.journey,ruleCategory);
    else content+='<p class="progress-subtitle">Wybierz słowo i poznaj jego zasadę.</p><div class="collection-word-grid">'+selected.map(word=>{const scene=sceneFor(word.masked,word.word);return '<button type="button" class="collection-word" data-progress="rule" data-word="'+esc(word.word)+'"><img src="'+esc(sceneUrl(scene))+'" alt="" width="120" height="120" loading="lazy" decoding="async"><strong>'+spelled(word)+'</strong></button>';}).join('')+'</div>';
    return content;
  }
  function rulesViewMarkup(){
    return '<div class="rules-views" role="radiogroup" aria-label="Widok wyjaśnień"><span class="rules-view-indicator" aria-hidden="true"></span>'+[['rules','Zasady'],['words','Słowa']].map(([key,label])=>'<label><input type="radio" name="progressRulesView" value="'+key+'" '+(rulesView===key?'checked':'')+'><span>'+label+'</span></label>').join('')+'</div>';
  }
  function setRulesView(index){
    const container=root.querySelector('.rules-views');if(!container||screen!=='rules')return;
    const next=index===0?'rules':'words',changed=next!==rulesView;rulesView=next;
    container.querySelectorAll('input').forEach(input=>{input.checked=input.value===rulesView;});
    rulesJelly.update(container,index,{animate:true});
    if(changed){const body=root.querySelector('[data-rules-content]');body.innerHTML=rulesContentMarkup();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)body.animate([{opacity:0,transform:'translateY(4px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'ease-out'});}
  }
  function mountRulesView(){
    const container=root.querySelector('.rules-views');if(!container)return;
    rulesJelly.update(container,rulesView==='rules'?0:1,{animate:false});
    rulesJelly.setupDrag(container,{getActiveIndex:()=>rulesView==='rules'?0:1,commitIndex:setRulesView,suppressClick:ms=>{suppressRulesClickUntil=performance.now()+ms;}});
  }
  function renderSubpage(){
    const title={collection:mode==='spelling'?'Moja kolekcja słów':'Moje przygody',categories:'Kategorie do poćwiczenia',rules:'Wyjaśnienia i zasady',achievements:'Twoje osiągnięcia','trophy-base':'Wybierz swój puchar','trophy-evolution':'Twój puchar rośnie',forge:'Kuźnia mocy'}[screen];
    let content='';
    if(screen==='forge'){content=forgeMarkup(progress.journey);}
    else if(['achievements','trophy-base','trophy-evolution'].includes(screen)){content=trophiesMarkup(progress.journey,earnedWords,words,{kind:awardKind,selectedId:selectedTrophy,mode});}
    else if(mode!=='spelling'){
      const sessions=progress.history.filter(result=>result.mode===mode);
      content='<p class="progress-subtitle">Twoje ukończone przygody z '+INSTRUMENTAL[mode]+'.</p>'+(sessions.length?'<div class="progress-session-list">'+sessions.map(r=>'<article data-session="'+esc(r.id)+'"><h2>'+new Date(r.date).toLocaleDateString('pl-PL')+'</h2><p>'+r.correct+' poprawnie · '+r.wrong+' do powtórki</p><small>'+r.duration/60+' min</small></article>').join('')+'</div>':'<div class="progress-empty"><h2>Jeszcze wszystko przed nami!</h2><p>Zagraj, aby zobaczyć tutaj swoje przygody.</p></div>');
    }else if(screen==='rules'){
      content=rulesViewMarkup()+'<div data-rules-content>'+rulesContentMarkup()+'</div>';
    }else if(screen==='collection'){
      const selected=words.filter(word=>{const item=byWord.get(word.word);return progress.journey?.cards?.[word.word]&&(filter==='all'||filter==='mastered'&&item?.masteryEarned||filter==='review'&&item?.needsReview||filter==='learning'&&!item?.masteryEarned&&!item?.needsReview);});
      content=(screen==='collection'?collectionFiltersMarkup(filter):'<p class="progress-subtitle">Wybierz słowo i poznaj jego zasadę.</p>')+
        (selected.length?'<div class="collection-word-grid" data-ds-recipe="container-collection-grid" data-ds-kind="container">'+selected.map(word=>collectionWordMarkup(word,byWord.get(word.word)?.state||'learning').replace('</button>', '<small class="word-star level-'+starLevel(progress.journey.cards[word.word]?.correct||0)+'">'+['Odkryta karta','★ Brąz','★ Srebro','★ Złoto'][starLevel(progress.journey.cards[word.word]?.correct||0)]+'</small></button>')).join('')+'</div>':'<div class="progress-empty"><h2>Twoja kolekcja rośnie z każdą próbą.</h2><p>'+(filter==='mastered'?'Słowa trafiają do „Umiem” po poprawnych powtórkach w różnych dniach.':'Ćwicz, a odkryte słowa pojawią się tutaj.')+'</p><button type="button" data-progress="practice">Ćwiczymy!</button></div>');
      content='<section class="collection-content" data-ds-recipe="family-collection" data-ds-kind="container">'+content+'</section>';
    }else if(screen==='categories'){
      content='<p class="progress-subtitle">Małe kroki, coraz pewniejsza pisownia.</p><div class="progress-category-list">'+categoryGroups.map(g=>'<button type="button" data-progress="practice" data-category="'+g.category+'"><b class="category-pair"><span>'+g.category.split('/').map(esc).join('</span><i aria-hidden="true">/</i><span>')+'</span></b><span>'+g.mastered+' / '+g.total+' opanowane<small>'+(g.review?g.review+' słów do powtórki':'Poznaj lub utrwal tę zasadę')+'</small></span><i aria-hidden="true">›</i></button>').join('')+'</div>';
    }
    root.innerHTML='<section class="progress-canvas progress-subpage" data-ds-recipe="'+(screen==='collection'?'family-collection':'family-progress-'+screen)+'" data-ds-kind="container">'+header(title,true)+content+'</section>';
    if(screen==='rules'&&mode==='spelling')mountRulesView();
    if(['trophy-base','trophy-evolution'].includes(screen))openUpgrade();
  }
  function closeUpgrade(){if(busy)return;upgradeDialog?.close();}
  function openUpgrade(){
    if(busy||upgradeDialog?.open)return;
    const trophy=awardCatalog(progress.journey,earnedWords,words,mode).trophies.find(a=>a.id==='mastery-5');if(!trophy.canUpgrade)return;
    root.querySelector('.progress-canvas').insertAdjacentHTML('beforeend',trophyDialogMarkup(progress.journey));
    const dialog=upgradeDialog=root.querySelector('.trophy-upgrade-dialog');
    dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
    dialog.addEventListener('click',event=>{if(event.target===dialog)closeUpgrade();});
    dialog.addEventListener('close',()=>{dialog.remove();upgradeDialog=null;if(['trophy-base','trophy-evolution'].includes(screen)){screen='achievements';root.dataset.historyState=screen;}root.querySelector('[data-progress=trophy-upgrade]')?.focus({preventScroll:true});},{once:true});dialog.showModal();
  }
  async function saveReward(button,action){
    if(busy||button.disabled)return;busy=true;
    let saved=false,next;
    const previous=cleanJourney(progress.journey),states=[...root.querySelectorAll('button')].map(b=>[b,b.disabled]);states.forEach(([b])=>b.disabled=true);
    try{
      next=action==='forge-power'?forgePower(previous,button.dataset.power):chooseTrophy(previous,'mastery-5',action==='trophy-base'?{family:Number(button.dataset.family)}:{choice:button.dataset.choice},trophyLevel(previous));
      await onSave?.(next);saved=true;if(abort.signal.aborted)return;
      if(action!=='forge-power'){
        upgradeDialog?.close();screen='achievements';
        const stage=root.querySelector('.trophy-stage');stage.dataset.revealing='true';stage.setAttribute('aria-busy','true');
        const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
        await stage.querySelector('.trophy-reveal-bubble').animate(reduce?[{opacity:0},{opacity:1},{opacity:0}]:[{opacity:0,transform:'translate(-50%,50%) scale(.2)'},{opacity:1,transform:'translate(-50%,50%) scale(1.1)',offset:.6},{opacity:0,transform:'translate(-50%,50%) scale(1.6)'}],{duration:reduce?80:1100,easing:'ease-in-out'}).finished;
      }
      if(abort.signal.aborted)return;progress.journey=next;render();
      const art=root.querySelector('.trophy-on-podium');if(art&&!matchMedia('(prefers-reduced-motion: reduce)').matches)art.animate([{opacity:0,transform:'scale(.7)'},{opacity:1,transform:'scale(.98)',offset:.7},{opacity:1,transform:'scale(1)'}],{duration:500,easing:'ease-out'});
      root.querySelector('.journey-feedback').textContent=action==='forge-power'?'Nowa moc jest Twoja! Pojawi się w kolejnych zadaniach.':'Twój wybór został zapisany. Oto nowy blask pucharu!';
      root.querySelector('[data-progress=trophy-upgrade]')?.focus({preventScroll:true});
    }catch(error){progress.journey=saved?next:previous;if(!abort.signal.aborted){states.forEach(([b,disabled])=>b.disabled=disabled);(root.querySelector('.trophy-dialog-feedback')||root.querySelector('.journey-feedback')).textContent='Nie udało się zapisać wyboru. '+error.message;}}
    finally{busy=false;}
  }
  root.addEventListener('click',event=>{
    const button=event.target.closest('[data-progress]');if(!button)return;
    const action=button.dataset.progress;if(busy)return;
    if(action==='trophy-cancel'){closeUpgrade();return;}
    if(action==='trophy-upgrade'){openUpgrade();return;}
    if(action==='award-tab'){if(button.dataset.preview){previewKind=button.dataset.kind;achievementPage=0;}else awardKind=button.dataset.kind;render();return;}
    if(action==='trophy-select'){selectedTrophy=button.dataset.award;render();return;}
    if(action==='award-open'){awardKind=button.dataset.kind;selectedTrophy=button.dataset.award;screen='achievements';render();root.scrollTop=0;return;}
    if(action==='return-results'){onBack?.();return;}
    if(action==='forge'&&onNavigate){const target=resolveRoute(globalThis.__MALA_NAUKA_DESIGN__,'progress','forge',mode);if(target!=='forge'){onNavigate(target);return;}}
    if(action==='open-rule-card'){openRuleCard(root,words,progress.journey,button.dataset.rule,button);return;}
    if(['forge-power','trophy-base','trophy-choice'].includes(action)){void saveReward(button,action);return;}
    if(action==='rule'){
      const word=words.find(word=>word.word===button.dataset.word);if(word)openResultRule(root,word,button);return;
    }
    if(action==='practice'){onPractice(mode,button.dataset.category);return;}
    if(action==='rules-category'){ruleCategory=button.dataset.category;render();return;}
    if(action==='mode'){mode=button.dataset.mode;screen='dashboard';achievementPage=0;}
    else if(action==='filter')filter=button.dataset.filter;
    else if(action==='next')achievementPage=Math.max(0,Math.min(awardCatalog(progress.journey,earnedWords,words,mode)[previewKind].length-3,achievementPage+1));
    else if(action==='previous')achievementPage=Math.max(0,achievementPage-1);
    else {screen=action;filter=button.dataset.filter||'all';}
    render();if(!['next','previous','filter'].includes(action)){root.scrollTop=0;root.querySelector('h1')?.focus({preventScroll:true});}
  },{signal:abort.signal});
  root.addEventListener('click',event=>{
    if(screen!=='rules')return;
    const container=root.querySelector('.rules-views'),buffer=container?.parentElement;
    if(!container||!buffer?.contains(event.target))return;
    const label=event.target.closest('.rules-views > label')||[...container.querySelectorAll('label')].find(node=>{const r=node.getBoundingClientRect();return event.clientX>=r.left&&event.clientX<=r.right&&event.clientY>=r.top&&event.clientY<=r.bottom;});
    if(!label)return;event.preventDefault();if(performance.now()<suppressRulesClickUntil)return;
    setRulesView(label.querySelector('input').value==='rules'?0:1);
  },{signal:abort.signal});
  root.addEventListener('change',event=>{if(event.target.name==='progressRulesView')setRulesView(event.target.value==='rules'?0:1);},{signal:abort.signal});
  window.addEventListener('resize',()=>{const container=root.querySelector('.rules-views');if(container&&!container.classList.contains('jelly-v4-moving'))rulesJelly.update(container,rulesView==='rules'?0:1,{animate:false});},{signal:abort.signal});
  controllers.set(root,()=>{abort.abort();upgradeDialog?.remove();root.getAnimations({subtree:true}).forEach(a=>a.cancel());});render();
}
