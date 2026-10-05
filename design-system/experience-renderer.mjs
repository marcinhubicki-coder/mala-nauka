import {html} from './preview-model.mjs';
import {ATOMS} from '../shared/component-recipes.mjs';
import {discoverySummary} from '../shared/discovery-model.mjs';
import {assetUrl} from '../shared/asset-loader.mjs';
import {createJellyV4} from '../shared/jelly-v4.mjs';
import {optionAction} from './project-model.mjs';
const jelly=createJellyV4({indicatorSelector:'.jelly-v4-indicator'});
const text=(value,s)=>String(value).replace(/\{(memory|eligible|remaining|mastered|level|points|revealed)\}/g,(_,k)=>s[k]??'');
function blueprint(node){
  if(node.visibility==='removed')return '';const atom=ATOMS[node.type],tag=node.type==='button'?'button':'div';
  return `<${tag} class="exp-blueprint ${node.type==='button'?'start-button':node.type==='surface'?'exp-surface':''}" style="${node.width?'width:'+node.width+'px;':''}${node.height?'min-height:'+node.height+'px;':''}padding:${node.padding}px;gap:${node.gap}px;${node.visibility==='hidden'?'visibility:hidden;':''}${atom?'font-family:var(--ds-font-'+atom.role+');font-size:'+atom.size+'px;':''}">${node.children.length?node.children.map(blueprint).join(''):html(node.text)}</${tag}>`;
}
export function renderExperience(root,snapshot,screenId,state,{select,action,stateOverride='initial',selected='',editing=false}={}){
  const screen=snapshot.screens.find(s=>s.id===screenId)||snapshot.screens[0];if(!screen)return;
  const summary=discoverySummary(state,snapshot.rules),data={...summary,memory:summary.balance,points:state.points,revealed:state.revealed.length};
  root.dataset.mode=screen.mode;root.dataset.ds='1';root.dataset.view='wizard';root.classList.add('ds-component-stage','experience-screen');root.style.padding=screen.padding+'px';root.style.gap=screen.gap+'px';
  const skin=snapshot.rules.skins.find(s=>s.id===state.skin);if(skin)root.style.setProperty('--ds-theme-accent',skin.color);
  root.style.backgroundImage=screen.asset?`linear-gradient(#f0f7ffee,#f0f7ffdd),url("${assetUrl(screen.asset)}")`:'';
  const condition=e=>e.condition==='always'||e.condition==='has-memory'&&summary.balance>=snapshot.rules.mapCost||e.condition==='no-memory'&&summary.balance<snapshot.rules.mapCost||e.condition==='all-map'&&state.revealed.length===snapshot.rules.mapTiles||e.condition==='has-trophy'&&state.earnedTrophies.length;
  root.innerHTML=screen.elements.filter(e=>e.visibility!=='removed').map(e=>{
    const disabled=e.state==='disabled'||stateOverride==='disabled'||!condition(e);
    const geom=`${e.height?'min-height:'+e.height+'px;':''}${e.width?'width:'+Math.min(e.width,390-screen.padding*2)+'px;':''}padding:${e.padding}px;gap:${e.gap}px;${e.visibility==='hidden'?'visibility:hidden;':''}`;
    const content=html(text(e.text,data));let inner;
    if(e.type==='title')inner=`<h1 class=exp-title>${content}</h1>`;
    else if(e.type==='subtitle'||e.type==='hint'||e.type==='numberText')inner=`<p class="exp-${e.type}">${content}</p>`;
    else if(e.type==='button')inner=`<button class=start-button data-exp-action="${e.id}" ${disabled?'disabled':''}>${content}</button>`;
    else if(e.type==='jelly')inner=`<fieldset class=exp-choice><legend>${content}</legend><div class="ds-jelly spelling-segmented" data-exp-jelly="${e.id}" role=radiogroup aria-label="${content}"><div class=jelly-v4-indicator></div>${e.options.map((v,i)=>{const a=optionAction(e,i),skin=snapshot.rules.skins.find(s=>s.id===a.value)||snapshot.rules.skins[i],locked=a.kind==='skin'&&(!skin||state.revealed.length<skin.tiles);return `<label><input type=radio name="${e.id}" value="${i}" ${i===(e.action.kind==='skin'?Math.max(0,snapshot.rules.skins.findIndex(s=>s.id===state.skin)):0)?'checked':''} ${disabled||locked?'disabled':''}><span>${html(v)}${locked?' · 🔒':''}</span></label>`;}).join('')}</div></fieldset>`;
    else if(e.type==='image')inner=e.asset?`<img class=exp-picture src="${assetUrl(e.asset)}" alt="${content}">`:`<p class=exp-placeholder>Wybierz ilustrację: ${content}</p>`;
    else if(e.type==='blueprint')inner=e.blueprint?blueprint(e.blueprint.root):'<p class=exp-placeholder>Wybierz element z biblioteki buildera.</p>';
    else if(e.type==='progress')inner=`<div class=exp-progress><strong>${content}</strong><progress max="${snapshot.rules.memoryEvery}" value="${state.eligible%snapshot.rules.memoryEvery}"></progress><p>${state.eligible%snapshot.rules.memoryEvery}/${snapshot.rules.memoryEvery} · jeszcze ${summary.remaining} samodzielnych odpowiedzi</p></div>`;
    else if(e.type==='stats')inner=`<div class=exp-stats>${[['Pamięć',summary.balance],['Umiem',summary.mastered],['Poziom',summary.level],['Wynik rund',state.points]].map(([name,value])=>`<div><b>${value}</b><span>${name}</span></div>`).join('')}</div>`;
    else if(e.type==='map'){const cols=Math.ceil(Math.sqrt(snapshot.rules.mapTiles));inner=`<div class=exp-map style="grid-template-columns:repeat(${cols},1fr)">${Array.from({length:snapshot.rules.mapTiles},(_,i)=>`<button aria-label="Fragment ${i+1}${state.revealed.includes(i)?' odkryty':''}" data-exp-tile="${i}" class="${state.revealed.includes(i)?'discovered':''}" ${editing||state.revealed.includes(i)||summary.balance<snapshot.rules.mapCost?'disabled':''} ${screen.asset?`style="background-image:url('${assetUrl(screen.asset)}');background-size:${cols*100}% ${cols*100}%;background-position:${cols===1?0:(i%cols)/(cols-1)*100}% ${Math.floor(i/cols)/(cols-1)*100}%"`:''}><span>${state.revealed.includes(i)?'✦':i+1}</span></button>`).join('')}</div><p class=exp-hint>${state.revealed.length}/${snapshot.rules.mapTiles} odkrytych · koszt ${snapshot.rules.mapCost} punkt pamięci</p>`;}
    else if(e.type==='trophies')inner=`<div class=exp-trophies>${summary.trophies.map(t=>`<div class="${t.earned?'earned':''}"><b>${t.earned?'🏆':'◇'}</b><span>${html(t.name)}</span><small>${t.earned?'Zdobyty':t.threshold+' · '+({mastered:'opanowanych słów',eligible:'samodzielnych odpowiedzi',families:'kategorii',returnDays:'dni powrotu'})[t.metric]}</small></div>`).join('')}</div>`;
    return `<section class="exp-element ${editing&&selected===e.id?'exp-selected':''} exp-state-${stateOverride==='initial'?e.state:stateOverride}" data-exp-element="${e.id}" style="${geom}">${inner}</section>`;
  }).join('');
  root.onclick=event=>{const tile=event.target.closest('[data-exp-tile]'),button=event.target.closest('[data-exp-action]'),el=event.target.closest('[data-exp-element]');if(editing&&el){event.preventDefault();select?.(el.dataset.expElement);return;}if(tile&&!tile.disabled)action?.({kind:'reveal',value:tile.dataset.expTile});if(button&&!button.disabled)action?.(screen.elements.find(e=>e.id===button.dataset.expAction).action);if(!button&&event.target.closest('.exp-blueprint button')&&el)action?.(screen.elements.find(e=>e.id===el.dataset.expElement).action);};
  for(const container of root.querySelectorAll('[data-exp-jelly]')){
    const radios=[...container.querySelectorAll('input')];jelly.ensurePrepared(container,Math.max(0,radios.findIndex(r=>r.checked)));
    jelly.setupDrag(container,{canDrag:()=>!editing,getActiveIndex:()=>Math.max(0,radios.findIndex(r=>r.checked)),commitIndex:index=>{if(radios[index]?.disabled){jelly.update(container,Math.max(0,radios.findIndex(r=>r.checked)),{animate:true});return;}radios[index].checked=true;radios[index].dispatchEvent(new Event('change',{bubbles:true}));}});
    container.onchange=event=>{const e=screen.elements.find(e=>e.id===container.dataset.expJelly),index=Number(event.target.value);if(editing){select?.(e.id);return;}jelly.update(container,index,{animate:true});const a=optionAction(e,index);if(a.kind!=='none')action?.({...a,value:a.kind==='skin'?(a.value||snapshot.rules.skins[index]?.id):(a.value||e.options[index])});};
  }
  return {screen,summary};
}
