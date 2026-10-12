import {behaviorDefinition} from '../shared/behaviors.mjs';
import {behaviorPicker} from './behavior-picker.mjs';
import {html} from './preview-model.mjs';
export function surfaceEditor(value,index=0,config={}){
 const rows=value.surfaceEffects||[],selected=Math.min(index,Math.max(0,rows.length-1)),current=rows[selected]?.preset||'surface-none';
 return `<div class=surface-editor><div class=surface-stack-list>${rows.map((r,i)=>`<button type=button class="small-button ${i===selected?'active':''}" data-surface-select=${i} aria-pressed=${i===selected}>${i+1}. ${html(behaviorDefinition(config,r.preset,'surface')?.name||'Efekt')}</button>`).join('')}<button type=button class=small-button data-surface-add ${rows.length>=4?'disabled':''}>＋ Dodaj efekt</button></div><input type=hidden data-surface-current value=${selected}>${behaviorPicker(config,'surface',current,{label:'Efekt powierzchni',attribute:'data-surface-preset'})}<p class=scope-help>Parametry, warstwę i uruchamianie zmienisz we wspólnej bibliotece. Każde użycie korzysta z tego samego przepisu.</p>${rows.length?'<button type=button class=small-button data-surface-remove>Usuń wybrany efekt</button>':''}</div>`;
}
export function selectSurface(value,index,id){const rows=structuredClone(value.surfaceEffects||[]);if(!rows.length)rows.push({preset:id});else rows[Math.min(index,rows.length-1)]={preset:id};return rows;}
