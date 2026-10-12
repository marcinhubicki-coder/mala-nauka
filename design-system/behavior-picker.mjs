import {behaviorEntries,BEHAVIOR_KINDS} from '../shared/behaviors.mjs';
import {html} from './preview-model.mjs';
export function behaviorOptions(config,kind,value,{inherit=false,type}={}){
 const entries=behaviorEntries(config,kind).filter(([,d])=>!type||d.type===type);
 return (inherit?'<option value="">Dziedzicz wybór</option>':'')+entries.map(([id,d])=>`<option value="${id}" ${value===id?'selected':''}>${html(d.name)}</option>`).join('');
}
export function behaviorPicker(config,kind,value,{label=BEHAVIOR_KINDS[kind],attribute='data-behavior-choice',inherit=false,type}={}){
 return `<label class=form-field><span>${html(label)}</span><select ${attribute} aria-label="${html(label)}">${behaviorOptions(config,kind,value,{inherit,type})}</select></label><button type=button class=small-button data-open-behavior="${html(value||'')}" data-behavior-kind=${kind}>Zarządzaj w Zachowaniu</button>`;
}
