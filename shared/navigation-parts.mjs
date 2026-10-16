import {viewKey} from './view-contracts.mjs';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const BACK_ARROW='<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 12H4m7-7-7 7 7 7"/></svg>';
// One visual atom; destinations belong to the screen's navigation, not variants.
export function backButton({action='home',progress='',className='icon',label='Wróć',contractView='',contractId=''}={}){
 return `<button type="button" class="navigation-back ${escape(className)}" data-ds-recipe="button-back" data-ds-kind="button" data-ds-atomic="true" ${contractView?viewKey(contractView,contractId):''} ${progress?`data-progress="${escape(progress)}"`:`data-action="${escape(action)}"`} aria-label="${escape(label)}">${BACK_ARROW}</button>`;
}
export function pageHeading(title,{action='home',progress='',className='page-head',backClass='icon',titleRecipe='',contractView='',backId='',titleId=''}={}){
 return `<header class="${escape(className)}">${backButton({action,progress,className:backClass,contractView,contractId:backId})}<h1 tabindex="-1" ${contractView?viewKey(contractView,titleId)+' data-ds-kind="text"':''} ${titleRecipe?`data-ds-recipe="${escape(titleRecipe)}"`:''}>${escape(title)}</h1></header>`;
}
