import {ATOMS} from '../shared/component-recipes.mjs';
import {html,FIELD_LABELS,componentName,MODE_NAMES} from './preview-model.mjs';
import {FONT_NAMES} from './model.mjs';
import {resolveStudioMerge} from './merge-model.mjs';

export function changeLabel(row,registry,config,rules,kind='config'){
  const keys=Array.isArray(row.path)?row.path:String(row.path).split('.');
  if(kind==='batches')return 'Kolejka batchy · wybór słów, grafiki i poziomy';
  if(keys[0]==='recipes')return `Globalny przepis · ${ATOMS[keys[1]]?.name||'Atomy'}`;
  if(keys[0]==='blueprints')return 'Biblioteka próbnych elementów';
  if(kind==='rules'){
    if(keys[0]==='rules')return `${rules.rules[keys[1]]?.title||'Zasada'} · ${keys[2]==='title'?'Nazwa':keys[2]==='explanation'?'Treść':'Wspólna zasada'}`;
    if(keys[0]==='assignments')return `Powiązania zasad: ${keys[1]}`;
    return 'Biblioteka zasad';
  }
  if(kind==='assets')return keys[0]==='words'?`Grafika słowa: ${keys[1]}`:keys[0]==='aliases'?'Scalenie grafik':'Rejestr grafik';
  if(keys[0]==='typography')return `Krój pisma: ${{body:'Teksty i opisy',ui:'Kontrolki',display:'Nagłówki',flag:'Kraje'}[keys[1]]||keys[1]}`;
  if(keys[0]==='motion')return `Przejścia ekranów · ${{style:'Styl',duration:'Czas',distance:'Odległość',easing:'Tempo'}[keys[1]]||'Ustawienia'}`;
  if(keys[0]==='effects')return `Efekty i bańka · ${config.effects?.presets?.[keys[2]]?.name||({bubble:'Bańka',wrong:'Reakcja na błąd',comboEvery:'Próg combo',comboBoost:'Siła combo',particleBudget:'Budżet drobinek',randomize:'Losowanie',enabled:'Aktywne efekty'})[keys[1]]||'Ustawienia'} · ${{duration:'Czas',particles:'Drobinki',spread:'Zasięg',scale:'Powiększenie',color:'Kolor',name:'Nazwa',enabled:'Aktywny',style:'Kształt'}[keys.at(-1)]||''}`;
   if(keys[0]==='scoring')return `Punkty ortografii · ${{correctPoints:'Poprawna odpowiedź',wrongPenalty:'Kara za błąd',hintPercent:'Wpływ podpowiedzi',comboEvery:'Próg bonusu',comboBonus:'Bonus combo'}[keys[1]]||'Ustawienia'}`;
   if(keys[0]==='componentNames')return `Nazwa: ${registry.components.find(c=>c.id===keys[1])?.name||'element'}`;
  if(keys[0]==='themes')return `${MODE_NAMES[keys[1]]} · kolor ${ {accent:'główny',light:'światło',middle:'środek',bottom:'głębia',border:'obrys',lip:'podstawa',shine:'blask',depth:'cień',activeInk:'aktywnego napisu',idleInk:'nieaktywnego napisu'}[keys[2]]||keys[2]}`;
  const group=keys[0]==='overrides'?keys[2]:keys[1],field=keys[0]==='overrides'?keys[3]:keys[2],component=registry.components.find(c=>c.tokenGroup===group);
  const view=keys[0]==='overrides'?registry.views.find(v=>v.id===keys[1])?.name+' · ':'';
  return `${view||''}${component?componentName(component,config):'Odstępy i kolory'} · ${FIELD_LABELS[field]||({ink:'Tekst',muted:'Tekst pomocniczy',surface:'Powierzchnia',correct:'Poprawna odpowiedź',wrong:'Błędna odpowiedź'})[field]||field||'Ustawienia'}`;
}
export function valueText(value){
  if(value===undefined)return 'Usunięto';if(typeof value==='boolean')return value?'Tak':'Nie';
  if(typeof value==='string')return FONT_NAMES[value]||({none:'Bez animacji',fade:'Łagodne pojawienie',slide:'Przesunięcie z prawej',ease:'Łagodne','ease-out':'Zwalnia na końcu','ease-in-out':'Łagodny początek i koniec',linear:'Stała prędkość'})[value]||value;
  if(typeof value==='number')return value.toLocaleString('pl-PL');
  if(value?.path)return value.path.split('/').at(-1);
  if(Array.isArray(value))return value.length&&typeof value[0]==='object'?`${value.length} wpisów w zestawie`:value.join(', ')||'Brak';
  return 'Zmieniony zestaw ustawień';
}
export function reviewRows(rows,registry,config,rules,kind='config'){
  return rows.filter(row=>row.path!=='revision'&&!String(row.path).endsWith('.edited')).map(row=>`<li><b>${html(changeLabel(row,registry,config,rules,kind))}</b><div class=review-values><span>${html(valueText(row.before))}</span><span aria-hidden=true>→</span><strong>${html(valueText(row.after))}</strong></div></li>`).join('');
}
export function reviewConflicts({plan,registry,config,rules,modal,dialog,picture}){
  return new Promise((resolve,reject)=>{
    dialog(`<h2>Wybierz wersję zmian</h2><p>Ktoś zmienił te same ustawienia na GitHub. Pozostałe zmiany zostaną połączone automatycznie. Twój szkic jest zachowany.</p><form id=resolve-conflicts><div class=conflict-cards>${plan.conflicts.map((row,index)=>`<article class=conflict-card><h3>${html(changeLabel(row,registry,config,rules,row.kind))}</h3><div>${[['local','Twoja wersja'],['remote','Zapisana na GitHub']].map(([side,label])=>`<label><input type=radio name='conflict-${index}' value=${side} required><strong>${label}</strong>${row[side]?.path?`<img src='${html(picture(row[side].path))}' alt='${label}'>`:''}<span>${html(valueText(row[side]))}</span></label>`).join('')}</div></article>`).join('')}</div><p id=conflict-error class=modal-error role=alert></p><div class=modal-actions><button type=button id=cancel-conflicts class=quiet-button>Wróć do szkicu</button><button type=submit class=solid-button>Połącz wybrane wersje</button></div></form>`);
    const close=()=>{cleanup();reject(Error('Scalanie anulowane. Twój szkic pozostał zachowany.'));};
    const cleanup=()=>modal.removeEventListener('cancel',close);
    modal.addEventListener('cancel',close,{once:true});
    modal.querySelector('#cancel-conflicts').onclick=()=>{modal.close();close();};
    modal.querySelector('form').onsubmit=event=>{
      event.preventDefault();try{const choices=Object.fromEntries(plan.conflicts.map((row,index)=>[row.id,modal.querySelector(`[name='conflict-${index}']:checked`)?.value]));const merged=resolveStudioMerge(plan,choices);cleanup();modal.close();resolve(merged);}catch(error){modal.querySelector('#conflict-error').textContent=error.message;}
    };
  });
}
