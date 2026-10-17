import {iconSVG} from '../shared/element-system.mjs';

const html=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export class StudioTesting{
 constructor({workspace,registry,navigate,buildPWA,checkPWA}){Object.assign(this,{workspace,registry,navigate,buildPWA,checkPWA});this.current='home--';this.test=null;this.busy=false;this.testUrl='';this.status='Najpierw zapisz projekt na GitHub.';this.workspace.addEventListener('click',event=>{void this.click(event).catch(error=>this.showStatus(error.message));});}
 get open(){return Boolean(this.workspace.querySelector('[data-test-lab]'));}
 view(id,extra={}){const row=this.registry.views.find(view=>view.id===id)||this.registry.views[0],url=new URL(row.route,location.origin);url.search=new URLSearchParams({studio:'1',mode:row.mode,screen:row.screen,state:row.state,viewId:row.id,...extra});return url.href;}
 scenario(id,label,note,extra={}){return {id:id+'--'+new URLSearchParams(Object.entries(extra).sort(([a],[b])=>a.localeCompare(b))).toString(),viewId:id,label,note,url:this.view(id,extra)};}
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
 render(){const groups=this.groups(),initial=groups.flatMap(group=>group.rows).find(row=>row.id===this.current&&row.url)||groups[0].rows[1];this.current=initial.id;this.workspace.innerHTML=`<div class="content-page test-lab" data-test-lab><div class=page-intro><div><h2>Panel testowy PWA</h2><p>Wybierz gotowy stan, obejrzyj go na prawdziwym rendererze i otwórz w osobnej karcie. Dane syntetyczne nie zmieniają profilu dziecka.</p></div><a class=solid-button href="${html(new URL('../',location.href).href)}" target=_blank rel=noopener>${iconSVG('fullscreen')} Otwórz PWA</a></div><section class="panel test-pwa-builder"><span class=section-kicker>OSOBNY BRANCH · PRODUKCJA BEZ ZMIAN</span><h3>Test PWA — zoptymalizowany</h3><p>Zapisz projekt na GitHub, a następnie przygotuj wersję mobilną. Test korzysta ze szkicu i respektuje ukrywanie/usuwanie elementów z Komponentów. Ogranicza kosztowne efekty i usuwa niepotrzebne filtry blur(0).</p><p id=test-pwa-status role=status>${html(this.status)}</p><div class=test-pwa-actions><button class=solid-button data-test-build ${this.busy?'disabled':''}>Przygotuj Test PWA</button><button class=small-button data-test-check ${!this.test||this.busy?'disabled':''}>Sprawdź wdrożenie</button><a class=small-button id=test-pwa-link href="${html(this.testUrl)}" ${this.testUrl?'':'hidden'} target=_blank rel=noopener>Otwórz PWA na telefonie ↗</a><a class=small-button id=test-pwa-branch href="${html(this.test?.githubUrl||'')}" ${this.test?'':'hidden'} target=_blank rel=noopener>Branch GitHub ↗</a></div></section><div class=test-lab-grid><aside class=test-scenarios>${groups.map(group=>`<details class=test-group ${group.rows.some(row=>row.id===initial.id)?'open':''}><summary>${iconSVG(group.icon)}<span>${html(group.title)}</span><b>${group.rows.length}</b></summary><div>${group.rows.map(row=>row.studio?`<button data-test-studio=${row.studio}><strong>${html(row.label)}</strong><small>${html(row.note)}</small><span aria-hidden=true>›</span></button>`:`<button class="${row.id===initial.id?'active':''}" aria-pressed="${row.id===initial.id}" data-test-url="${html(row.url)}" data-test-id="${html(row.id)}"><strong>${html(row.label)}</strong><small>${html(row.note)}</small><span aria-hidden=true>›</span></button>`).join('')}</div></details>`).join('')}</aside><section class="panel test-preview"><header><div><span class=section-kicker>${initial.id==='pwa'?'PWA · LOKALNE DANE GRACZA':'SCENARIUSZ · DANE PRZYKŁADOWE'}</span><h3 id=test-preview-name>${html(initial.label)}</h3></div><a class=small-button id=test-open-window href="${html(initial.url)}" target=_blank rel=noopener>Nowa karta ↗</a></header><div class=test-phone><iframe id=test-preview-frame title="Podgląd scenariusza: ${html(initial.label)}" src="${html(initial.url)}"></iframe></div><p id=test-preview-note>${html(initial.note)}</p></section></div></div>`;}
 async click(event){
 if(!this.open)return;
 const build=event.target.closest('[data-test-build]'),check=event.target.closest('[data-test-check]');
 if(build){if(this.busy)return;this.busy=true;build.disabled=true;this.showStatus('Przygotowanie zoptymalizowanego Test PWA…');try{this.test=await this.buildPWA();this.testUrl='';this.showStatus('Branch Test PWA zapisany. Ukryte elementy: '+this.test.report.hidden.length+'.');const link=this.workspace.querySelector('#test-pwa-branch');if(link){link.href=this.test.githubUrl;link.hidden=false;}await this.checkTest();}finally{this.busy=false;if(this.open)this.render();}return;}
 if(check){await this.checkTest();return;}
 const button=event.target.closest('[data-test-url],[data-test-studio]');if(!button)return;if(button.dataset.testStudio){this.navigate?.(button.dataset.testStudio);return;}const frame=this.workspace.querySelector('#test-preview-frame'),open=this.workspace.querySelector('#test-open-window'),name=this.workspace.querySelector('#test-preview-name'),note=this.workspace.querySelector('#test-preview-note');const row=this.groups().flatMap(group=>group.rows).find(item=>item.url===button.dataset.testUrl);if(!row)return;this.current=row.id;this.workspace.querySelector('.test-preview .section-kicker').textContent=row.id==='pwa'?'PWA · LOKALNE DANE GRACZA':'SCENARIUSZ · DANE PRZYKŁADOWE';frame.title='Podgląd scenariusza: '+row.label;frame.src=row.url;open.href=row.url;name.textContent=row.label;note.textContent=row.note;for(const item of this.workspace.querySelectorAll('[data-test-url]')){item.classList.toggle('active',item===button);item.setAttribute('aria-pressed',String(item===button));}}
 showStatus(message){this.status=message;const el=this.workspace.querySelector('#test-pwa-status');if(el)el.textContent=message;}
 async checkTest(){
  if(!this.test){this.showStatus('Najpierw przygotuj Test PWA.');return;}
  try{const url=await this.checkPWA(this.test.sha),link=this.workspace.querySelector('#test-pwa-link');if(!url)throw Error('Brak adresu wdrożenia.');this.testUrl=url;if(link){link.href=url;link.hidden=false;}this.showStatus('Test PWA gotowy na telefon. Ukryte elementy: '+this.test.report.hidden.length+'.');}
  catch{this.showStatus('Branch zapisany. Vercel jeszcze nie podał zweryfikowanego adresu. Wybierz „Sprawdź wdrożenie”.');}
 }
 leave(){}
}
