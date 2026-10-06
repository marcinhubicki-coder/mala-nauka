import {iconSVG} from '../shared/element-system.mjs';

const html=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export class StudioTesting{
 constructor({workspace,registry,navigate}){this.workspace=workspace;this.registry=registry;this.navigate=navigate;this.current='home';this.workspace.addEventListener('click',event=>this.click(event));}
 get open(){return Boolean(this.workspace.querySelector('[data-test-lab]'));}
 view(id,extra={}){const row=this.registry.views.find(view=>view.id===id)||this.registry.views[0],url=new URL(row.route,location.origin);url.search=new URLSearchParams({studio:'1',mode:row.mode,screen:row.screen,state:row.state,viewId:row.id,...extra});return url.href;}
 scenario(id,label,note,extra={}){return {id,label,note,url:this.view(id,extra)};}
 groups(){return [
  {id:'start',title:'Start i dane',icon:'screen',rows:[
   this.scenario('players-empty','Start od zera','Pierwszy profil, bez zapisu danych'),
   this.scenario('home','Dane syntetyczne','Fikcyjny profil, postępy i historia'),
   {id:'pwa',label:'Bieżące PWA',note:'Twoje lokalne dane i normalny start',url:new URL('../',location.href).href}
  ]},
  {id:'results',title:'Wyniki i suma',icon:'target',rows:[
   this.scenario('spelling-results','Runda mieszana','Wynik, błędy, poprawne odpowiedzi i suma'),
   this.scenario('spelling-results','Wszystko poprawnie','Pełny wynik bez błędów',{state:'correct',animate:'1'}),
   this.scenario('spelling-results','Ukończona kolekcja','Stan graniczny i animowane podsumowanie',{state:'completed',animate:'1'}),
   this.scenario('sessions','Historia rund','Sumy wszystkich trybów')
  ]},
  {id:'progress',title:'Postępy i puchary',icon:'star',rows:[
   this.scenario('progress','Podsumowanie','Wynik dnia, seria i saldo'),
   this.scenario('trophies','Odblokowane puchary','Syntetyczne osiągnięcia profilu'),
   this.scenario('collection','Kolekcja słów','Elementy opanowane i do powtórki'),
   this.scenario('categories','Kategorie','Postęp w rodzinach zasad')
  ]},
  {id:'motion',title:'Combo i animacje',icon:'spark',rows:[
   this.scenario('spelling-correct','Poprawna odpowiedź','Efekt odpowiedzi na prawdziwym ekranie'),
   this.scenario('spelling-results','Animowany wynik','Pasek, liczby i slider nowej rundy',{animate:'1'}),
   {id:'effects',label:'Skumulowane combo',note:'Uruchom serię w laboratorium efektów',studio:'effects'},
   {id:'motion',label:'Przejścia ekranów',note:'Porównaj połączenia z flow',studio:'motion'}
  ]}
 ];}
 render(){const groups=this.groups(),initial=groups.flatMap(group=>group.rows).find(row=>row.id===this.current&&row.url)||groups[0].rows[1];this.current=initial.id;this.workspace.innerHTML=`<div class="content-page test-lab" data-test-lab><div class=page-intro><div><h2>Panel testowy PWA</h2><p>Wybierz gotowy stan, obejrzyj go na prawdziwym rendererze i otwórz w osobnej karcie. Dane syntetyczne nie zmieniają profilu dziecka.</p></div><a class=solid-button href="${html(new URL('../',location.href).href)}" target=_blank rel=noopener>${iconSVG('fullscreen')} Otwórz PWA</a></div><div class=test-lab-grid><aside class=test-scenarios>${groups.map((group,index)=>`<details class=test-group name=test-lab-group ${index===0?'open':''}><summary>${iconSVG(group.icon)}<span>${html(group.title)}</span><b>${group.rows.length}</b></summary><div>${group.rows.map(row=>row.studio?`<button data-test-studio=${row.studio}><strong>${html(row.label)}</strong><small>${html(row.note)}</small><span aria-hidden=true>›</span></button>`:`<button data-test-url="${html(row.url)}" data-test-id=${row.id}><strong>${html(row.label)}</strong><small>${html(row.note)}</small><span aria-hidden=true>›</span></button>`).join('')}</div></details>`).join('')}</aside><section class="panel test-preview"><header><div><span class=section-kicker>SYNTETYCZNY SCENARIUSZ</span><h3 id=test-preview-name>${html(initial.label)}</h3></div><a class=small-button id=test-open-window href="${html(initial.url)}" target=_blank rel=noopener>Nowa karta ↗</a></header><div class=test-phone><iframe id=test-preview-frame title="Podgląd scenariusza: ${html(initial.label)}" src="${html(initial.url)}"></iframe></div><p id=test-preview-note>${html(initial.note)}</p></section></div></div>`;}
 click(event){if(!this.open)return;const button=event.target.closest('[data-test-url],[data-test-studio]');if(!button)return;if(button.dataset.testStudio){this.navigate?.(button.dataset.testStudio);return;}const frame=this.workspace.querySelector('#test-preview-frame'),open=this.workspace.querySelector('#test-open-window'),name=this.workspace.querySelector('#test-preview-name'),note=this.workspace.querySelector('#test-preview-note');const row=this.groups().flatMap(group=>group.rows).find(item=>item.url===button.dataset.testUrl);if(!row)return;this.current=row.id;frame.src=row.url;open.href=row.url;name.textContent=row.label;note.textContent=row.note;for(const item of this.workspace.querySelectorAll('[data-test-url]'))item.classList.toggle('active',item===button);}
 leave(){}
}
