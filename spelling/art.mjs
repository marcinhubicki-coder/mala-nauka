import { sceneFor, sceneUrl } from './scenes.mjs';
import { mountHintButton } from './hints.mjs';
import { decorateWord } from './word-reveal.mjs';

const app=document.querySelector('#app');
if(!app)throw new Error('Missing #app root');

const questionMemory=new Map();
const autoAdvanceButtons=new WeakSet();
let scheduled=false;

function currentQuestionNumber(){
  const text=app.querySelector('.game-meta span')?.textContent||'';
  return Number(text.match(/\d+/)?.[0]||0);
}

function maskedFromAria(word){
  const aria=word?.getAttribute('aria-label')||'';
  if(!aria)return '';
  if(/luka/i.test(aria))return aria.replace(/\s*[–—-]\s*luka\s*[–—-]\s*/i,'_').replace(/\s+/g,'');
  return '';
}

function mountVisual(scene,title){
  app.querySelector('.spelling-visual')?.remove();

  const bubble=document.createElement('div');
  bubble.className='spelling-visual scene-missing';
  bubble.setAttribute('aria-hidden','true');
  if(scene?.scale)bubble.style.setProperty('--scene-scale',String(scene.scale));

  const media=document.createElement('div');
  media.className='spelling-visual-media';
  bubble.append(media);

  if(scene?.asset){
    const img=document.createElement('img');
    img.src=sceneUrl(scene);
    img.alt='';
    img.decoding='async';
    img.loading='eager';
    if(scene.position)img.style.objectPosition=scene.position;
    img.addEventListener('load',()=>bubble.classList.remove('scene-missing'),{once:true});
    img.addEventListener('error',()=>img.remove(),{once:true});
    media.append(img);
  }

  for(const suffix of ['a','b','c']){
    const orb=document.createElement('i');
    orb.className=`scene-orb scene-orb-${suffix}`;
    orb.setAttribute('aria-hidden','true');
    bubble.append(orb);
  }

  title.insertAdjacentElement('afterend',bubble);
  return bubble;
}

function scheduleCorrectAutoAdvance(card){
  if(!card.classList.contains('correct'))return;
  const next=app.querySelector('[data-action="next"]');
  if(!next)return;
  next.hidden=true;
  next.setAttribute('aria-hidden','true');
  next.tabIndex=-1;
  if(autoAdvanceButtons.has(next))return;
  autoAdvanceButtons.add(next);
  setTimeout(()=>{
    if(next.isConnected&&app.dataset.view==='game'&&card.isConnected)next.click();
  },1050);
}

function decorate(){
  scheduled=false;
  if(app.dataset.view!=='game'||app.dataset.mode!=='spelling')return;
  if(app.querySelector('.spelling-title'))return;

  const word=app.querySelector('.word');
  const card=app.querySelector('.question-card');
  const answers=app.querySelector('.answers');
  if(!word||!card||!answers)return;

  const question=currentQuestionNumber();
  let masked=maskedFromAria(word);
  if(masked)questionMemory.set(question,masked);
  else masked=questionMemory.get(question)||'';

  const scene=sceneFor(masked);
  const category=app.querySelector('.badge')?.textContent?.trim()||'';
  const feedback=!!word.querySelector('.filled');
  const options=[...answers.querySelectorAll('.answer')].map(el=>el.textContent.trim()).filter(Boolean);

  app.classList.add('spelling-art-ready');
  app.dataset.artLayout='bubble';
  app.dataset.artScene=scene?.key||'calm';

  const title=document.createElement('h2');
  title.className='spelling-title';
  title.textContent='Jak jest poprawnie?';
  card.insertAdjacentElement('beforebegin',title);
  mountVisual(scene,title);

  card.classList.add('spelling-question-card');
  app.querySelector('.badges')?.setAttribute('aria-hidden','true');
  app.querySelector('.prompt')?.setAttribute('aria-hidden','true');

  decorateWord(word,options,feedback);
  mountHintButton(app,answers,category);

  const small=app.querySelector('.time-block small');
  if(small){
    small.textContent='';
    small.hidden=true;
    small.setAttribute('aria-hidden','true');
  }

  if(feedback){
    app.classList.add('spelling-has-feedback');
    app.querySelector('.spelling-hint')?.setAttribute('hidden','');
    scheduleCorrectAutoAdvance(card);
  }else{
    app.classList.remove('spelling-has-feedback');
  }
}

function scheduleDecorate(){
  if(scheduled)return;
  scheduled=true;
  requestAnimationFrame(decorate);
}

new MutationObserver(scheduleDecorate).observe(app,{childList:true,subtree:true});
scheduleDecorate();
