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
const backArrow='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12H4m7-7-7 7 7 7"/></svg>';
const sprig='<svg class="progress-sprig" viewBox="0 0 48 64" aria-hidden="true"><path d="M20 66Q24 34 37 8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M34 26Q28 12 41 3Q45 19 34 26ZM30 38Q27 22 16 19Q13 36 30 38ZM28 44Q29 26 44 27Q44 43 28 44ZM25 54Q23 37 10 36Q9 52 25 54ZM23 60Q28 44 39 45Q40 59 23 60Z" fill="currentColor"/></svg>';
function glyph(mode){return '<svg class="progress-mode-glyph" viewBox="'+ICONS[mode].join(' ')+'" aria-hidden="true"><image href="assets/progress/mode-icons-v2.webp" width="1536" height="1024"/></svg>';}
function spelled(word){const [before,...after]=word.masked.split('_');return esc(before)+'<mark>'+esc(word.answer)+'</mark>'+esc(after.join('_'));}
function trophy(index){return '<svg class="progress-trophy" viewBox="'+(index*512+32)+' 32 448 448" aria-hidden="true"><image href="assets/progress/trophies-v1.webp" width="1536" height="512" preserveAspectRatio="none"/></svg>';}
export function destroyProgressScreen(root){controllers.get(root)?.();controllers.delete(root);}

export function renderProgressScreen(root,{progress,words,backAction='home',initialMode='spelling',onPractice}) {
  destroyProgressScreen(root);
  let mode=initialMode in NAMES?initialMode:'spelling',screen='dashboard',filter='all',achievementPage=0,rulesView='rules',ruleCategory=CATEGORIES[0];
  const abort=new AbortController(),rulesJelly=createJellyV4({indicatorSelector:'.rules-view-indicator'});
  let suppressRulesClickUntil=0;
  const knowledge=learningSummary(progress.learning);
  const byWord=new Map(knowledge.items.map(item=>[item.word,item]));
  const earnedWords=knowledge.items.filter(item=>item.masteryEarned).length;
  const stateLabel={learning:'Ćwiczę',consolidating:'Utrwalam',mastered:'Umiem',review:'Powtórzę'};
  const categoryGroups=CATEGORIES.map(category=>{
    const all=words.filter(word=>word.category===category);
    const mastered=all.filter(word=>byWord.get(word.word)?.state==='mastered').length;
    const earned=all.filter(word=>byWord.get(word.word)?.masteryEarned).length;
    const review=all.filter(word=>byWord.get(word.word)?.state==='review').length;
    return {category,total:all.length,mastered,earned,review};
  });
  const categoryAchievement=category=>{const group=categoryGroups.find(group=>group.category===category);return {title:'Opanowane',detail:group.category.replace('/',' / '),earned:group.earned===group.total,progress:group.earned+' / '+group.total,index:category==='rz/ż'?0:1};};
  const achievements=[
    categoryAchievement('rz/ż'),categoryAchievement('u/ó'),
    {title:'Komplet słów',detail:'już wkrótce',earned:earnedWords===words.length,progress:earnedWords+' / '+words.length,index:2},
    categoryAchievement('ch/h'),
    {title:'Pierwsze 10 słów',detail:'w Twojej kolekcji',earned:earnedWords>=10,progress:Math.min(10,earnedWords)+' / 10',index:1}
  ];

  function tabs(){return '<nav class="progress-modes" aria-label="Postępy według przygody">'+Object.keys(NAMES).map(id=>'<button type="button" data-progress="mode" data-mode="'+id+'" class="progress-mode '+(mode===id?'is-active':'')+'" aria-pressed="'+(mode===id)+'" aria-label="'+NAMES[id]+'">'+glyph(id)+(mode===id?'<span>'+NAMES[id]+'</span>':'')+'</button>').join('')+'</nav>';}
  function header(title,sub=false){return '<header class="progress-header"><button type="button" class="progress-back" '+(sub?'data-progress="dashboard"':'data-action="'+backAction+'"')+' aria-label="Wróć">'+backArrow+'</button><h1 tabindex="-1">'+title+'</h1></header>';}
  function render(){
    root.dataset.view='history';root.dataset.mode=mode;root.dataset.historyState=screen;
    if(screen!=='dashboard'){renderSubpage();return;}
    const spelling=mode==='spelling';
    const sums=spelling?knowledge:{mastered:0,learning:0,review:0};
    const heading=spelling?'Coraz pewniej<span class="progress-hero-line">z <span class="progress-hero-emphasis">ortografią!</span></span>':'Twoja przygoda<span class="progress-hero-line">z <span class="progress-hero-emphasis">'+INSTRUMENTAL[mode]+'!</span></span>';
    root.innerHTML='<section class="progress-canvas"><div class="progress-hero">'+header('Moje wyniki')+tabs()+'<div class="progress-hero-copy"><h2>'+heading+'</h2><p>Zobacz, co już umiesz<br>i do czego warto<br>jeszcze wrócić.</p></div></div>'+
      '<div class="progress-content"><div class="progress-stats" aria-label="Twoja nauka">'+[['mastered','Umiem',check],['learning','Ćwiczę',gear],['review','Powtórzę',repeat]].map(([key,label,icon])=>'<button type="button" class="progress-stat '+key+'" data-progress="collection" data-filter="'+key+'"><span class="progress-stat-icon" aria-hidden="true">'+icon+'</span><span><b>'+sums[key]+'</b><small>'+label+'</small></span>'+sprig+'</button>').join('')+'</div>'+
      '<div class="progress-links"><button type="button" class="progress-illustrated collection" data-progress="collection"><strong>Moja kolekcja<br>'+(spelling?'słów':'przygód')+'</strong><span class="progress-link-arrow" aria-hidden="true">'+chevron+'</span></button><button type="button" class="progress-illustrated categories" data-progress="categories"><strong>Kategorie<br>do poćwiczenia</strong><span class="progress-link-arrow" aria-hidden="true">'+chevron+'</span></button></div>'+
      '<section class="progress-achievements"><header><div><h2>Twoje osiągnięcia</h2><p>Zobacz, co już udało Ci się osiągnąć!</p></div><button type="button" data-progress="achievements">Zobacz więcej '+chevron+'</button></header><div class="progress-trophies"><button type="button" class="trophy-prev" data-progress="previous" aria-label="Poprzednie osiągnięcia">'+chevron+'</button>'+achievements.slice(achievementPage,achievementPage+3).map(a=>'<article class="achievement '+(a.earned?'is-earned':'is-pending')+(a.index===2?' is-locked-style':'')+(a.title==='Pierwsze 10 słów'?' is-long-label':'')+'">'+trophy(a.index)+'<div><span>'+a.title+'</span><strong>'+a.detail+'</strong><small>'+(a.earned?'Zdobyte!':a.progress)+'</small></div></article>').join('')+'<button type="button" class="trophy-next" data-progress="next" aria-label="Kolejne osiągnięcia">'+chevron+'</button></div><div class="progress-pagination" aria-label="Strona osiągnięć">'+[0,1,2].map(i=>'<i class="'+(achievementPage===i?'is-current':'')+'"></i>').join('')+'</div></section>'+
      '<button type="button" class="progress-rules-link" data-progress="rules"><span class="progress-rule-art" aria-hidden="true"></span><span class="progress-rule-copy"><strong>Wyjaśnienia i zasady</strong><small>Zobacz proste wyjaśnienia<br>zasad ortografii i przykłady.</small></span><i aria-hidden="true">'+chevron+'</i></button></div></section>';
  }
  function rulesContentMarkup(){
    const selected=words.filter(word=>word.category===ruleCategory);
    const groups=ruleGroups(words,ruleCategory);
    let content='<nav class="rules-categories" aria-label="Wybierz kategorię zasad">'+CATEGORIES.map(category=>'<button type="button" data-progress="rules-category" data-category="'+category+'" aria-pressed="'+(ruleCategory===category)+'">'+esc(category.replace('/',' / '))+'</button>').join('')+'</nav>';
    if(rulesView==='rules')content+='<div class="learning-rule-list">'+groups.map((group,index)=>'<details class="learning-rule" '+(index===0?'open':'')+'><summary><span>'+esc(group.title)+'</span><i aria-hidden="true">⌄</i></summary><div class="learning-rule-body"><p>'+esc(group.explanation)+'</p>'+(group.examples.length?'<div class="learning-rule-examples">'+group.examples.map(e=>'<span><b>'+esc(e.from)+'</b> → <b>'+esc(e.to)+'</b><small>'+esc(e.change)+'</small></span>').join('')+'</div>':'')+'<h2>Popatrz na poprawny zapis</h2><div class="rule-word-grid">'+group.words.map(word=>{const scene=sceneFor(word.masked,word.word);return '<figure><img src="'+esc(sceneUrl(scene))+'" alt="" width="120" height="120" loading="lazy" decoding="async"><figcaption>'+spelled(word)+'</figcaption></figure>';}).join('')+'</div></div></details>').join('')+'</div>';
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
    const title={collection:mode==='spelling'?'Moja kolekcja słów':'Moje przygody',categories:'Kategorie do poćwiczenia',rules:'Wyjaśnienia i zasady',achievements:'Twoje osiągnięcia'}[screen];
    let content='';
    if(mode!=='spelling'){
      const sessions=progress.history.filter(result=>result.mode===mode);
      content='<p class="progress-subtitle">Twoje ukończone przygody z '+INSTRUMENTAL[mode]+'.</p>'+(sessions.length?'<div class="progress-session-list">'+sessions.map(r=>'<article><h2>'+new Date(r.date).toLocaleDateString('pl-PL')+'</h2><p>'+r.correct+' poprawnie · '+r.wrong+' do powtórki</p><small>'+r.duration/60+' min</small></article>').join('')+'</div>':'<div class="progress-empty"><h2>Jeszcze wszystko przed nami!</h2><p>Zagraj, aby zobaczyć tutaj swoje przygody.</p></div>');
    }else if(screen==='rules'){
      content=rulesViewMarkup()+'<div data-rules-content>'+rulesContentMarkup()+'</div>';
    }else if(screen==='collection'){
      const selected=words.filter(word=>screen==='rules'||(byWord.has(word.word)&&(filter==='all'||(filter==='learning'?['learning','consolidating'].includes(byWord.get(word.word).state):byWord.get(word.word).state===filter))));
      content=(screen==='collection'?'<nav class="collection-filters" aria-label="Pokaż słowa">'+[['all','Odkryte'],['mastered','Umiem'],['learning','Ćwiczę'],['review','Powtórzę']].map(([key,label])=>'<button type="button" data-progress="filter" data-filter="'+key+'" aria-pressed="'+(filter===key)+'">'+label+'</button>').join('')+'</nav>':'<p class="progress-subtitle">Wybierz słowo i poznaj jego zasadę.</p>')+
        (selected.length?'<div class="collection-word-grid">'+selected.map(word=>{const scene=sceneFor(word.masked,word.word),state=byWord.get(word.word)?.state;return '<button type="button" class="collection-word" data-progress="rule" data-word="'+esc(word.word)+'"><img src="'+esc(sceneUrl(scene))+'" alt="" width="120" height="120" loading="lazy" decoding="async"><strong>'+spelled(word)+'</strong><small class="'+(state||'undiscovered')+'">'+(stateLabel[state]||'Poznaj zasadę')+'</small></button>';}).join('')+'</div>':'<div class="progress-empty"><h2>Twoja kolekcja rośnie z każdą próbą.</h2><p>'+(filter==='mastered'?'Słowa trafiają do „Umiem” po poprawnych powtórkach w różnych dniach.':'Ćwicz, a odkryte słowa pojawią się tutaj.')+'</p><button type="button" data-progress="practice">Ćwiczymy!</button></div>');
    }else if(screen==='categories'){
      content='<p class="progress-subtitle">Małe kroki, coraz pewniejsza pisownia.</p><div class="progress-category-list">'+categoryGroups.map(g=>'<button type="button" data-progress="practice" data-category="'+g.category+'"><b class="category-pair"><span>'+g.category.split('/').map(esc).join('</span><i aria-hidden="true">/</i><span>')+'</span></b><span>'+g.mastered+' / '+g.total+' opanowane<small>'+(g.review?g.review+' słów do powtórki':'Poznaj lub utrwal tę zasadę')+'</small></span><i aria-hidden="true">›</i></button>').join('')+'</div>';
    }else content='<p class="progress-subtitle">Osiągnięcia zdobywasz, kiedy wiedza zostaje z Tobą na dłużej.</p><div class="progress-achievement-list">'+achievements.map(a=>'<article>'+trophy(a.index)+'<div><h2>'+a.title+' '+a.detail+'</h2><p>'+(a.earned?'To już Twoje osiągnięcie!':a.progress+' słów opanowanych')+'</p></div></article>').join('')+'</div>';
    root.innerHTML='<section class="progress-canvas progress-subpage">'+header(title,true)+content+'</section>';
    if(screen==='rules'&&mode==='spelling')mountRulesView();
  }
  root.addEventListener('click',event=>{
    const button=event.target.closest('[data-progress]');if(!button)return;
    const action=button.dataset.progress;
    if(action==='rule'){
      const word=words.find(word=>word.word===button.dataset.word);if(word)openResultRule(root,word,button);return;
    }
    if(action==='practice'){onPractice(mode,button.dataset.category);return;}
    if(action==='rules-category'){ruleCategory=button.dataset.category;render();return;}
    if(action==='mode'){mode=button.dataset.mode;screen='dashboard';achievementPage=0;}
    else if(action==='filter')filter=button.dataset.filter;
    else if(action==='next')achievementPage=Math.min(achievements.length-3,achievementPage+1);
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
  controllers.set(root,()=>abort.abort());render();
}
