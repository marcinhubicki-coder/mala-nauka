import {PART_BY_ID} from './structure-model.mjs';
import {profileAvatar,pinModeMarkup,pinDotMarkup,pinDotsMarkup,pinKeyMarkup,pinKeypadMarkup} from './profile-parts.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const texts={
 'text-player-title':'Kto dziś odkrywa?', 'text-nickname':'Maja', 'text-pin-instruction':'Ustaw 4 cyfry',
 'text-player-copy':'Małe kroki, wielkie odkrycia.', 'text-field-label':'Co ćwiczymy?',
 'text-nickname-help':'Od 3 do 16 znaków.', 'jelly-option':'Podstawowe', 'pin-option':'Ustaw PIN',
 'text-continue-copy':'Przesuń, aby kontynuować', 'text-progress-value':'72%', 'text-mode-name':'Ortografia'
};
const arrow='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>';
const check='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>';
export function jellyMarkup(labels=['Wszystkie','Podstawowe','Trudne'],selected=0,name='block-jelly'){
 return `<div class="ds-jelly" role="radiogroup" aria-label="Wybór opcji"><i class="live-jelly-indicator" aria-hidden="true"></i>${labels.map((label,i)=>`<label data-ds-recipe="jelly-option" data-ds-kind="text"><input type="radio" name="${esc(name)}" value="${i}" ${i===selected?'checked':''}><span>${esc(label)}</span></label>`).join('')}</div>`;
}
// Every example is a new tree of code primitives. No iframe or DOM extraction.
export function partSample(id,options={}){
 const catalog=options.catalog||Object.values(PART_BY_ID),byId=new Map(catalog.map(p=>[p.id,p])),assetURL=options.assetURL|| (path=>new URL('../'+path,import.meta.url).href);
 const opts={pin:true,pinDigits:0,playerCount:3,selectedPlayer:-1,choice:0,percent:72,mode:'default',...options};
 const stamp=(markup,recipe,kind=byId.get(recipe)?.kind||'container')=>markup.replace(/^(<\w+)(?=[\s>])/,(tag)=>`${tag} data-ds-recipe="${esc(recipe)}" data-ds-kind="${kind}"`);
 const tag=(name,recipe,cls,body,attrs='')=>`<${name} data-ds-recipe="${esc(recipe)}" data-ds-kind="${byId.get(recipe)?.kind||'container'}" class="${cls}" ${attrs}>${body}</${name}>`;
 const img=(recipe,path)=>tag('img',recipe,'part-image','',`src="${esc(assetURL(path))}" alt="${esc(byId.get(recipe)?.name||'Ilustracja')}"`);
 const avatar=(key='a')=>stamp(profileAvatar({avatarId:key},'',assetURL),'image-player-avatar-art');
 const keys=()=>stamp(pinKeypadMarkup(opts.pinDigits),'container-pin-keypad').replaceAll('class="pin-key', 'data-ds-recipe="control-pin-key" data-ds-kind="key" class="pin-key');
 const dots=()=>stamp(pinDotsMarkup(opts.pinDigits),'container-pin-dots').replaceAll('<span class=', '<span data-ds-recipe="icon-pin-dot" data-ds-kind="icon" class=');
 const mode=()=>stamp(pinModeMarkup(opts.pin,'block-pin'),'control-pin').replaceAll('<label>', '<label data-ds-recipe="pin-option" data-ds-kind="text">');
 const player=(index=0)=>tag('button','button-player-card',`player-card ${opts.selectedPlayer===index?'is-selected':''}`,avatar('abc'[index%3])+tag('strong','text-nickname','', ['Maja','Tomek','Lena'][index%3])+tag('span','icon-player-select','player-select-mark',opts.selectedPlayer===index?`<span class="check">${check}</span>`:'<span class="empty-check"></span>'),`type="button" data-sample-player="${index}" aria-pressed="${opts.selectedPlayer===index}"`);
 const render=(recipe,seen=new Set())=>{
  if(seen.has(recipe))return '';
  const next=new Set(seen).add(recipe),p=byId.get(recipe)||PART_BY_ID[recipe]||{id:recipe,name:recipe,kind:'container',children:[]};
  const child=childId=>render(childId,next),children=()=>p.children.map(child).join('');
  if(texts[recipe])return tag(recipe==='text-player-title'?'h1':recipe==='text-pin-instruction'?'h3':'span',recipe,'part-text',esc(texts[recipe]));
  switch(recipe){
   case 'container-card':return tag('div',recipe,'part-surface','', 'aria-label="Kafel / podkład"');
   case 'icon-step-dot':return tag('span',recipe,'step-dot','1');
   case 'icon-player-select':return tag('span',recipe,'player-select-mark',`<span class="check">${check}</span>`);
   case 'image-player-avatar-art':return avatar();
   case 'image-player-brand-art':case 'image-player-empty-art':return img(recipe,p.asset);
   case 'image-home-logo-art':return img(recipe,'assets/brand/player-logo-3d.webp');
   case 'image-mission':return img(recipe,`assets/${{english:'angielski',reading:'czytanie'}[opts.mode]||'ortografia'}/wizard-mission-retina-${opts.mode==='english'?'v2':'v1'}.webp`);
   case 'image-mn-soap-picture':return img(recipe,opts.photoAsset||'assets/scenes/krol.jpg');
   case 'background-home-art-backdrop':return tag('div',recipe,'part-background','',`style="background-image:url('${esc(assetURL('assets/home/home-retina.webp'))}')" aria-label="Tło ekranu startowego"`);
   case 'control-jelly':return stamp(jellyMarkup(opts.labels,opts.choice),'control-jelly');
   case 'control-pin':return mode();
   case 'control-toggle':return stamp(jellyMarkup(['Czas','Słowa'],opts.choice%2,'block-toggle'),'control-toggle');
   case 'control-pin-key':return stamp(pinKeyMarkup('1'),'control-pin-key');
   case 'icon-pin-dot':return stamp(pinDotMarkup(opts.pinDigits>0),'icon-pin-dot');
   case 'input-player-name':return tag('input',recipe,'player-name-input','', 'type="text" value="Maja" maxlength="16" aria-label="Imię gracza"');
   case 'button-main':case 'button-answer':return tag('button',recipe,recipe==='button-main'?'start-button':'recipe-answer',recipe==='button-main'?'Dalej':'rz','type="button" data-sample-press aria-pressed="false"');
   case 'button-back':case 'button-home-progress':return tag('button',recipe,'part-icon-button',recipe==='button-back'?arrow.replace('M5 12h14m-6-6 6 6-6 6','M19 12H5m6-6-6 6 6 6'):arrow,'type="button" data-sample-press aria-pressed="false"');
   case 'button-avatar-choice':return tag('button',recipe,'avatar-choice',avatar(),'type="button" data-sample-avatar="a" aria-pressed="false"');
   case 'button-player-card':return player();
   case 'button-home-card':return tag('button',recipe,'part-mode-card',child('container-card')+child('image-mission')+child('text-mode-name'),'type="button" data-sample-press aria-pressed="false"');
   case 'result-points-bubble':return tag('div',recipe,'part-points','125');
   case 'container-player-title':return tag('header',recipe,'player-title',children());
   case 'container-player-grid':return tag('div',recipe,`player-grid ${opts.selectedPlayer>=0?'has-selection':''}`,Array.from({length:opts.playerCount},(_,i)=>player(i)).join(''));
   case 'container-player-actions':return tag('div',recipe,'player-actions',children());
   case 'container-player-form-card':return tag('section',recipe,'part-panel player-form-card',tag('div','container-card','part-panel-body',avatar()+child('text-field-label')+child('input-player-name')+child('text-nickname-help')+child('container-avatar-picker')+child('button-main')));
   case 'container-avatar-picker':return tag('div',recipe,'avatar-picker',Array.from('abcd',key=>tag('button','button-avatar-choice','avatar-choice',avatar(key),`type="button" data-sample-avatar="${key}" aria-pressed="false"`)).join(''));
   case 'container-pin-profile':return tag('div',recipe,'pin-profile',avatar()+tag('h2','text-nickname','','Maja'));
   case 'container-pin-dots':return dots();
   case 'container-pin-keypad':return keys();
   case 'container-pin-fields':return tag('div',recipe,'pin-fields',opts.pin?child('text-pin-instruction')+tag('p','text-player-copy','','PIN służy do przełączania profili.')+dots()+keys():tag('h3','text-pin-instruction','pin-instruction','Bez PIN-u')+tag('p','text-player-copy','','Do tego profilu wejdziesz bez kodu. PIN możesz ustawić później.')+child('button-main'));
   case 'container-pin-card':return tag('section',recipe,`pin-card part-panel ${opts.pin?'':'pin-no-code'}`,tag('div','container-card','part-panel-body',child('container-pin-profile')+mode()+child('container-pin-fields')));
   case 'container-field-title':return tag('div',recipe,'live-number-text',children());
   case 'container-mission':return tag('section',recipe,'part-panel part-mission',tag('div','container-card','part-panel-body',child('image-mission')+child('text-player-copy')));
   case 'icon-continue-handle':return tag('span',recipe,'part-icon-button',arrow);
   case 'meter-round-progress-fill':return tag('span',recipe,'part-meter-fill','',`style="width:${opts.percent}%;height:18px;background:var(--ds-theme-accent)"`);
  }
  // Newly discovered code parts compose known children, instead of relying on screenshots.
  if(p.children?.length)return tag('div',recipe,'part-composition',children());
  if(p.kind==='text')return tag('span',recipe,'part-text',esc(p.name));
  if(p.kind==='image')return img(recipe,p.asset||'assets/brand/player-logo-3d.webp');
  if(p.kind==='background')return tag('div',recipe,'part-background','',`style="background:var(--ds-theme-light)"`);
  if(['button','key'].includes(p.kind))return tag('button',recipe,'part-icon-button',esc(p.name),'type="button" data-sample-press');
  if(p.kind==='icon')return tag('span',recipe,'part-icon-button',check);
  return tag('div',recipe,'part-surface','',`aria-label="${esc(p.name)}"`);
 };
 return render(id);
}
