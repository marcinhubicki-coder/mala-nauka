import {englishWordFlipConfig,englishWordFlipDirection,englishWordFlipEasing} from '../shared/english-word-flip.mjs';

const app=()=>document.getElementById('app');
const wait=ms=>new Promise(resolve=>setTimeout(resolve,Math.max(0,ms)));
const reduceMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEMO_WORDS=['apple','window','bicycle','garden','cloud'];
let snapshot=null;
let running=false;
let demoTicket=0;
let demoIndex=0;

function questionNumber(root){
 const text=root?.querySelector('.game-meta > span')?.textContent||'';
 const match=text.match(/(\d+)/);
 return match?Number(match[1]):0;
}
function eligible(root){
 return root?.dataset.mode==='english'&&root.dataset.view==='game';
}
function capture(card,question){
 if(!card)return null;
 const rect=card.getBoundingClientRect();
 if(!rect.width||!rect.height)return null;
 return {question,html:card.outerHTML,rect:{left:rect.left,top:rect.top,width:rect.width,height:rect.height}};
}
function cloneSnapshot(value){
 const template=document.createElement('template');
 template.innerHTML=value.html.trim();
 return template.content.firstElementChild;
}
function mountOverlay(node,rect){
 node.classList.add('english-word-flip-overlay');
 Object.assign(node.style,{
  position:'fixed',left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',
  margin:'0',zIndex:'2147483000',pointerEvents:'none',transformOrigin:'50% 50%',willChange:'transform,filter,opacity'
 });
 document.body.append(node);
}
function transform(config,angle,scale,depth){
 return `perspective(${config.perspective}px) rotateY(${angle}deg) translateZ(${depth}px) scale(${scale})`;
}
async function finished(animation){
 try{await animation.finished;}catch{}
}
async function flip(oldSnapshot,newCard,sequence){
 if(!oldSnapshot||!newCard?.isConnected)return;
 const root=app();
 const config=englishWordFlipConfig();
 if(reduceMotion()){snapshot=capture(newCard,sequence);return;}
 running=true;
 root?.classList.add('english-word-flipping');
 const oldCard=cloneSnapshot(oldSnapshot);
 mountOverlay(oldCard,oldSnapshot.rect);
 const direction=englishWordFlipDirection(config,sequence);
 const split=Math.min(.7,Math.max(.3,config.swapPoint/100));
 const outAngle=direction*config.rotation*split;
 const inAngle=-direction*config.rotation*(1-split);
 const outMs=Math.max(80,config.duration*split);
 const inMs=Math.max(80,config.duration*(1-split));
 const easing=englishWordFlipEasing(config);
 const originalVisibility=newCard.style.visibility;
 newCard.style.visibility='hidden';
 newCard.style.transformOrigin='50% 50%';
 newCard.style.willChange='transform,filter,opacity';
 try{
  await finished(oldCard.animate([
   {transform:transform(config,0,1,0),filter:'blur(0px)',opacity:1},
   {transform:transform(config,outAngle,config.midScale,config.depth),filter:`blur(${config.motionBlur}px)`,opacity:.985}
  ],{duration:outMs,easing,fill:'forwards'}));
  if(config.pauseDuration)await wait(config.pauseDuration);
  oldCard.remove();
  if(!newCard.isConnected)return;
  newCard.style.visibility=originalVisibility;
  await finished(newCard.animate([
   {transform:transform(config,inAngle,config.midScale,config.depth),filter:`blur(${config.motionBlur}px)`,opacity:.985},
   {transform:transform(config,0,1,0),filter:'blur(0px)',opacity:1}
  ],{duration:inMs,easing,fill:'none'}));
  if(config.settleDuration&&newCard.isConnected){
   await finished(newCard.animate([
    {transform:'scale(1)'},
    {transform:'scale(1.012)',offset:.42},
    {transform:'scale(1)'}
   ],{duration:config.settleDuration,easing:'cubic-bezier(.2,.8,.25,1)'}));
  }
 }finally{
  oldCard.remove();
  if(newCard?.isConnected){
   newCard.style.visibility=originalVisibility;
   newCard.style.willChange='';
  }
  root?.classList.remove('english-word-flipping');
  running=false;
  const current=app()?.querySelector('.question-card');
  snapshot=capture(current,questionNumber(app()));
 }
}
function scan(){
 const root=app();
 if(!eligible(root)){snapshot=null;return;}
 const card=root.querySelector('.question-card');
 const question=questionNumber(root);
 if(!card||!question||running)return;
 if(snapshot&&snapshot.question&&question!==snapshot.question){
  const previous=snapshot;
  snapshot=null;
  void flip(previous,card,question);
  return;
 }
 snapshot=capture(card,question);
}
async function demo(loop,ticket){
 do{
  const root=app(),card=root?.querySelector('.question-card');
  if(ticket!==demoTicket||!eligible(root)||!card)return;
  if(running){await wait(80);continue;}
  const old=capture(card,questionNumber(root)||demoIndex+1);
  const text=card.querySelector('.question-text.english');
  if(!old||!text)return;
  demoIndex=(demoIndex+1)%DEMO_WORDS.length;
  text.textContent=DEMO_WORDS[demoIndex];
  await flip(old,card,demoIndex+1);
  if(!loop||ticket!==demoTicket)return;
  await wait(720);
 }while(ticket===demoTicket);
}

const style=document.createElement('style');
style.textContent=`
 #app.english-word-flipping .answers,
 #app.english-word-flipping .question-card{pointer-events:none}
 .english-word-flip-overlay{box-sizing:border-box;backface-visibility:hidden;transform-style:preserve-3d}
 @media (prefers-reduced-motion: reduce){
  .english-word-flip-overlay{display:none!important}
 }
`;
document.head.append(style);

const start=()=>{
 const root=app();
 if(!root)return;
 new MutationObserver(scan).observe(root,{childList:true,subtree:true});
 scan();
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();

window.addEventListener('message',event=>{
 if(event.origin!==location.origin||event.source!==parent||event.data?.channel!=='mala-nauka-studio'||event.data.type!=='word-flip-demo')return;
 const ticket=++demoTicket;
 void demo(Boolean(event.data.loop),ticket);
});
