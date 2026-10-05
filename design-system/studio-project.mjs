import {html} from './preview-model.mjs';
import {PROJECT_TABS,emptyProject,discoveryProject,newScreen,newElement,newId,validateProject,projectSnapshot,makeRelease,approveRelease,publishRelease,fingerprint} from './project-model.mjs';
import {fixtureEvents,replayDiscovery} from '../shared/discovery-model.mjs';
import {orthographyFamilies} from '../shared/rules-library.mjs';
import {encodeShare,decodeShare,previewLink,validateFeedback} from './project-share.mjs';
import {planPanel,screensPanel,learningPanel,testPanel,copyPanel,copyFields,releasePanel,summaryHTML,button,field,select,info} from './project-panels.mjs';

export class StudioProject{
  constructor(options){Object.assign(this,options);this.tab='plan';this.screenId='';this.elementId='';this.pane='preview';this.editing=true;this.stateOverride='initial';this.fixture='six';this.seed=42;this.copyView='new';this.copyRows=[];this.trace=[];this.active=false;
    this.workspace.addEventListener('click',e=>{if(this.active)void this.click(e).catch(error=>this.notice(error.message));});
    this.workspace.addEventListener('change',e=>{if(this.active)void this.change(e).catch(error=>this.notice(error.message));});
    this.workspace.addEventListener('input',e=>{if(this.active&&e.target.matches('input[type=range]'))void this.change(e).catch(error=>this.notice(error.message));});
    window.addEventListener('message',e=>this.message(e));
    try{this.access=localStorage.getItem('mn-project-preview-access')||'';}catch{}
  }
  get data(){return this.getData();}
  get project(){return this.data.config.project||emptyProject();}
  get events(){return fixtureEvents(this.fixture,this.seed,this.data.words.map(w=>({...w,families:orthographyFamilies(w.word)})));}
  get fixtureState(){return replayDiscovery(this.events,this.project.rules);}
  get trialKey(){return this.fixture+':'+this.seed;}
  update(fn,key=''){this.changeProject(fn,key);}
  leave(){this.active=false;this.resize?.disconnect();this.flowResize?.disconnect();this.frame=null;this.copyFrame=null;}
  render(){
    this.leave();this.active=true;
    const p=this.project;
    if(!this.data.config.project){this.workspace.innerHTML=`<div class="content-page project-workspace"><section class=project-welcome><span class=project-eyebrow>Następny etap</span><h2>Od pomysłu do sprawdzonej przygody</h2><p>Ułóż plan, zbuduj ekrany, sprawdź naukę na przykładowych danych i pokaż wersję testową. Zapisany szkic może poczekać na zatwierdzenie.</p><div class=project-actions>${button('Uruchom scenariusz wyspy','id=project-start-scenario',true)}${button('Pusty projekt','id=project-start-empty')}</div><div class=project-onboarding>${[['Plan','Priorytety, terminy i zależności.'],['Ekrany','Komponenty, teksty i działające przyciski.'],['Próba','Syntetyczne dane, punkty i uwagi.'],['Wydanie','Zamrożone wersje i kontrola przed zapisem.']].map(([n,d])=>`<div><strong>${n}</strong><p>${d}</p></div>`).join('')}</div></section></div>`;return;}
    if(!p.screens.some(s=>s.id===this.screenId))this.screenId=p.entry||p.screens[0]?.id||'';
    const s=p.screens.find(s=>s.id===this.screenId);if(!s?.elements.some(e=>e.id===this.elementId))this.elementId=s?.elements[0]?.id||'';
    const panels={plan:planPanel,screens:screensPanel,copy:copyPanel,learning:learningPanel,test:testPanel,release:releasePanel};
    this.workspace.innerHTML=`<div class="content-page project-workspace"><header class=project-header><div><span class=project-eyebrow>Projekt w szkicu</span><h2>${html(p.name)}</h2></div>${button('Zmień nazwę','id=project-rename')}${button('Pobierz projekt','id=project-export')}</header><nav class=project-tabs aria-label="Etapy projektu">${Object.entries(PROJECT_TABS).map(([k,n])=>`<button data-project-tab="${k}" aria-current="${this.tab===k?'page':'false'}">${n}</button>`).join('')}</nav><div class=project-panel>${(panels[this.tab]||planPanel)(this)}</div></div>`;
    this.frame=this.workspace.querySelector('#project-frame');this.copyFrame=this.workspace.querySelector('#project-copy-frame');
    if(this.frame){this.frame.onload=()=>this.sendPreview();const holder=this.frame.parentElement;this.resize=new ResizeObserver(()=>{const scale=Math.min(1,holder.clientWidth/390);this.frame.style.transform=`scale(${scale})`;holder.style.height=(844*scale)+'px';});this.resize.observe(holder);}
    if(this.copyFrame){const view=this.registry.views.find(v=>v.id===this.copyView),url=new URL(view.route,location.origin);url.search=new URLSearchParams({studio:'1',mode:view.mode,screen:view.screen,state:view.state,viewId:view.id});this.copyFrame.src=url.href;this.copyFrame.onload=()=>this.sendCopy();}
    const flow=this.workspace.querySelector('#project-flow');if(flow){this.flowResize=new ResizeObserver(()=>this.drawFlow());this.flowResize.observe(flow);this.drawFlow();}
  }
  sendPreview(){
    if(!this.frame||!this.project.screens.length)return;const snapshot=projectSnapshot(this.project,this.data.config);
    if(this.longCopy){snapshot.screens=snapshot.screens.map(s=>({...s,elements:s.elements.map(e=>e.type==='title'?{...e,text:'Każdy mały krok otwiera kolejną część naszej wielkiej przygody'}:e)}));}
    this.frame.contentWindow?.postMessage({channel:'mala-nauka-project',type:'load',snapshot,events:this.trialKey===this.savedTrialKey&&this.trialEvents?this.trialEvents:this.events,words:this.data.words.map(w=>({word:w.word,families:orthographyFamilies(w.word)})),screen:this.screenId,editing:this.tab==='screens'&&this.editing,selected:this.elementId,stateOverride:this.stateOverride,previewURLs:this.data.previewURLs},location.origin);
  }
  sendCopy(){if(!this.copyFrame)return;const config={...this.data.config,copyOverrides:this.project.copy};this.copyFrame.contentWindow?.postMessage({channel:'mala-nauka-studio',type:'design',config,assets:this.data.assets,rules:this.data.rules,previewURLs:this.data.previewURLs},location.origin);this.copyFrame.contentWindow?.postMessage({channel:'mala-nauka-studio',type:'copy-scan'},location.origin);}
  message(event){
    if(!this.active||event.origin!==location.origin)return;const m=event.data;
    if(m?.channel==='mala-nauka-project'&&event.source===this.frame?.contentWindow){
      if(m.type==='ready')this.sendPreview();
      if(m.type==='selected'){this.elementId=m.id;this.pane=matchMedia('(max-width:690px)').matches?'edit':this.pane;this.render();}
      if(m.type==='notice')this.notice(m.message);
      if(m.type==='state'){
        this.summary=m.summary;this.screenId=m.screenId;this.trialEvents=m.trialEvents;this.savedTrialKey=this.trialKey;
        const caption=this.workspace.querySelector('#project-preview-caption');if(caption)caption.textContent=this.project.screens.find(s=>s.id===m.screenId)?.name||'';
        const summary=this.workspace.querySelector('#project-test-summary');if(summary)summary.innerHTML=summaryHTML(m.summary,m.points);
        const live=this.workspace.querySelector('#project-live-summary');if(live)live.textContent=(m.overflow?'Układ wychodzi poza szerokość telefonu. ':'')+(m.events.map(e=>e.text).join(' ')||`Pamięć ${m.summary.balance} · do następnego punktu ${m.summary.remaining} odpowiedzi.`);
        const picker=this.workspace.querySelector('#project-screen,#project-test-screen');if(picker)picker.value=m.screenId;
      }
      if(m.type==='action'){this.trace.unshift(`${({answer:'Samodzielna odpowiedź',wrong:'Pomyłka',reveal:'Odkrycie fragmentu',skin:'Zmiana skórki'})[m.kind]||'Akcja'} · pamięć ${m.summary.balance} · umiem ${m.summary.mastered}`);this.trace=this.trace.slice(0,20);const list=this.workspace.querySelector('#project-trace');if(list)list.innerHTML=this.trace.map(t=>`<li>${html(t)}</li>`).join('');}
    }
    if(m?.channel==='mala-nauka-studio'&&event.source===this.copyFrame?.contentWindow){
      if(m.type==='ready')this.sendCopy();
      if(m.type==='copy-list'){this.copyRows=m.rows;const fields=this.workspace.querySelector('#project-copy-fields');if(fields)fields.innerHTML=copyFields(this);const status=this.workspace.querySelector('#project-copy-status');if(status)status.textContent=`${m.rows.length} napisów. Zmiany dotyczą tylko wybranego widoku.`;}
    }
  }
  drawFlow(){
    const flow=this.workspace.querySelector('#project-flow');if(!flow)return;const r=flow.getBoundingClientRect(),svg=flow.querySelector('svg');svg.setAttribute('viewBox',`0 0 ${r.width} ${r.height}`);svg.innerHTML='';
    const ns='http://www.w3.org/2000/svg';for(const s of this.project.screens)for(const e of s.elements.filter(e=>e.action.kind==='navigate')){
      const from=flow.querySelector(`[data-flow-node="${s.id}"]`),to=flow.querySelector(`[data-flow-node="${e.action.target}"]`);if(!from||!to||from===to)continue;const a=from.getBoundingClientRect(),b=to.getBoundingClientRect(),path=document.createElementNS(ns,'path');const x=a.x+a.width/2-r.x,y=a.bottom-r.y,tx=b.x+b.width/2-r.x,ty=b.top-r.y;path.setAttribute('d',`M${x},${y} C${x},${y+24} ${tx},${ty-24} ${tx},${ty}`);svg.append(path);
    }
  }
  async click(event){
    const b=event.target.closest('button');if(!b)return;
    if(b.dataset.projectTab){this.tab=b.dataset.projectTab;this.render();return;}
    if(b.id==='project-start-scenario'||b.id==='project-start-empty'){this.changeProject(()=>b.id==='project-start-scenario'?discoveryProject():emptyProject());this.render();return;}
    if(b.id==='project-rename'){this.dialog(`<h2>Nazwa projektu</h2><form id=project-name-form>${field('Nazwa',this.project.name,'id=project-name maxlength=80 required')}<div class=modal-actions>${button('Anuluj','type=button data-close')}${button('Zapisz nazwę','type=submit',true)}</div></form>`);this.modal.querySelector('form').onsubmit=e=>{e.preventDefault();try{this.update(p=>{p.name=this.modal.querySelector('#project-name').value.trim();});this.modal.close();this.render();}catch(e){this.notice(e.message);}};}
    if(b.id==='project-add-task'||b.dataset.editTask)this.taskDialog(b.dataset.editTask);
    if(b.id==='project-add-screen'){this.dialog(`<h2>Nowy ekran</h2><form>${field('Nazwa ekranu','Nowa przygoda','id=project-screen-name required maxlength=80')}<div class=modal-actions>${button('Anuluj','data-close type=button')}${button('Utwórz ekran','type=submit',true)}</div></form>`);this.modal.querySelector('form').onsubmit=e=>{e.preventDefault();const s=newScreen(this.modal.querySelector('#project-screen-name').value);this.update(p=>{p.screens.push(s);p.entry||=s.id;});this.screenId=s.id;this.elementId=s.elements[0].id;this.modal.close();this.render();};}
    if(b.id==='project-set-entry'){this.update(p=>{p.entry=this.screenId;});this.render();}
    if(b.id==='project-duplicate-screen'){const s=structuredClone(this.project.screens.find(s=>s.id===this.screenId));s.id=newId('screen');s.name+=' · kopia';s.elements=s.elements.map(e=>({...e,id:newId('element')}));this.update(p=>p.screens.push(s));this.screenId=s.id;this.render();}
    if(b.id==='project-remove-screen'){this.update(p=>{p.screens=p.screens.filter(s=>s.id!==this.screenId);if(p.entry===this.screenId)p.entry=p.screens[0]?.id||'';p.tasks.forEach(t=>{if(t.screen===this.screenId)t.screen='';});});this.render();}
    if(b.dataset.projectElement){this.elementId=b.dataset.projectElement;this.pane=matchMedia('(max-width:690px)').matches?'edit':this.pane;this.render();}
    if(b.id==='project-add-element'){const e=newElement(this.workspace.querySelector('#project-component-type').value);this.update(p=>p.screens.find(s=>s.id===this.screenId).elements.push(e));this.elementId=e.id;this.pane=matchMedia('(max-width:690px)').matches?'edit':this.pane;this.render();}
    if(b.id==='project-remove-element'){this.update(p=>{const s=p.screens.find(s=>s.id===this.screenId);s.elements=s.elements.filter(e=>e.id!==this.elementId);});this.render();}
    if(b.dataset.projectMove){this.update(p=>{const s=p.screens.find(s=>s.id===this.screenId),i=s.elements.findIndex(e=>e.id===this.elementId),j=Math.max(0,Math.min(s.elements.length-1,i+Number(b.dataset.projectMove)));[s.elements[i],s.elements[j]]=[s.elements[j],s.elements[i]];});this.render();}
    if(b.dataset.projectPane){this.pane=b.dataset.projectPane;this.workspace.querySelector('.project-screen-grid').dataset.projectPane=this.pane;for(const el of this.workspace.querySelectorAll('[data-project-pane]'))el.setAttribute('aria-pressed',String(el.dataset.projectPane===this.pane));}
    if(b.dataset.flowScreen){this.screenId=b.dataset.flowScreen;this.tab='screens';this.render();}
    if(b.id==='project-flow-expand'){this.workspace.querySelector('.project-flow-panel').classList.toggle('expanded');this.drawFlow();}
    if(b.dataset.projectAsset)this.assetDialog(b.dataset.projectAsset);
    if(b.id==='project-remove-background'){this.update(p=>{p.screens.find(s=>s.id===this.screenId).asset='';});this.render();}
    if(b.id==='project-add-challenge'){this.update(p=>p.rules.challenges.push({id:newId('challenge'),name:'Nowe wyzwanie',family:'wszystkie',target:5}));this.render();}
    if(b.id==='project-regenerate'||b.dataset.projectReset!==undefined){this.trialEvents=null;this.summary=null;this.trace=[];this.longCopy=false;this.sendPreview();this.workspace.querySelector('#project-trace').innerHTML='';}
    if(b.dataset.projectTestAction)this.frame?.contentWindow.postMessage({channel:'mala-nauka-project',type:'action',action:{kind:b.dataset.projectTestAction}},location.origin);
    if(b.id==='project-long-copy'){this.longCopy=!this.longCopy;this.sendPreview();this.notice(this.longCopy?'Próba z długim tytułem. Treść projektu pozostaje zapisana.':'Przywrócono teksty projektu.');}
    if(b.id==='project-scan-copy')this.sendCopy();
    if(b.id==='project-record-release')this.releaseDialog();
    if(b.dataset.releaseCheck||b.dataset.releaseId)return;
    if(b.dataset.releaseOpen||b.dataset.releaseShare)await this.shareRelease(b.dataset.releaseOpen||b.dataset.releaseShare,Boolean(b.dataset.releaseOpen));
    if(b.dataset.releaseApprove){this.update(p=>{p.releases=p.releases.map(r=>r.id===b.dataset.releaseApprove?approveRelease(r):r);});this.render();}
    if(b.dataset.releasePublish){this.update(p=>Object.assign(p,publishRelease(p,b.dataset.releasePublish)));this.render();this.notice('Pilot ustawiony w szkicu. Zapisz projekt na GitHub, aby go wydać.');}
    if(b.dataset.releaseRestore){this.update(p=>{const s=p.releases.find(r=>r.id===b.dataset.releaseRestore).snapshot;p.screens=structuredClone(s.screens);p.rules=structuredClone(s.rules);p.copy=structuredClone(s.copy);p.entry=s.entry;});this.applyDraftDesign(this.project.releases.find(r=>r.id===b.dataset.releaseRestore).snapshot.design);this.render();}
    if(b.dataset.releaseExport)this.download(this.project.releases.find(r=>r.id===b.dataset.releaseExport),'mala-nauka-wersja-testowa.json');
    if(b.dataset.issueScreen){this.screenId=b.dataset.issueScreen;this.tab='screens';this.render();}
    if(b.id==='project-export')this.download(this.project,'mala-nauka-projekt.json');
    if(b.id==='project-import')this.importDialog('project');
    if(b.id==='project-import-feedback')this.importDialog('feedback');
    if(b.id==='project-save-git')document.getElementById('save-git').click();
  }
  async change(event){
    const t=event.target;
    if(t.id==='project-screen'||t.id==='project-test-screen'){this.screenId=t.value;this.elementId='';this.render();}
    if(t.id==='project-interaction'){this.editing=t.value==='edit';this.render();}
    if(t.id==='project-state'){this.stateOverride=t.value;this.sendPreview();}
    if(t.dataset.projectDate){this.update(p=>{p[t.dataset.projectDate]=t.value;});this.render();}
    if(t.dataset.screenField){const k=t.dataset.screenField;this.update(p=>{p.screens.find(s=>s.id===this.screenId)[k]=t.type==='number'?Number(t.value):t.value;},'screen-'+k);this.sendPreview();}
    if(t.dataset.elementField){const k=t.dataset.elementField;this.update(p=>{p.screens.find(s=>s.id===this.screenId).elements.find(e=>e.id===this.elementId)[k]=k==='options'?t.value.split('\n').map(v=>v.trim()).filter(Boolean):t.type==='number'?Number(t.value):t.value;},'element-'+this.elementId+'-'+k);this.sendPreview();if(k==='text')this.updateElementLabels();}
    if(t.dataset.elementAction){const k=t.dataset.elementAction;this.update(p=>{p.screens.find(s=>s.id===this.screenId).elements.find(e=>e.id===this.elementId).action[k]=t.value;});this.render();}
    if(t.id==='project-blueprint'){this.update(p=>{const e=p.screens.find(s=>s.id===this.screenId).elements.find(e=>e.id===this.elementId);e.blueprint=structuredClone(this.data.config.blueprints.find(b=>b.id===t.value));});this.sendPreview();}
    if(t.dataset.projectRule){const k=t.dataset.projectRule;this.update(p=>{p.rules[k]=Number(t.value);},'discovery-'+k);for(const input of this.workspace.querySelectorAll(`[data-project-rule="${k}"]`))input.value=t.value;this.summary=null;}
    if(t.id==='project-levels'){this.update(p=>{p.rules.levelThresholds=t.value.split(',').map(v=>Number(v.trim()));});}
    for(const group of ['skin','trophy','challenge'])if(t.dataset[group+'Field']){const key=t.dataset[group+'Field'],index=Number(t.dataset[group+'Index']),list={skin:'skins',trophy:'trophies',challenge:'challenges'}[group];this.update(p=>{p.rules[list][index][key]=t.type==='number'?Number(t.value):t.value;});}
    if(t.id==='project-fixture'){this.trialEvents=null;this.fixture=t.value;this.summary=null;this.trace=[];this.sendPreview();}
    if(t.id==='project-seed'){this.trialEvents=null;this.seed=Math.max(1,Math.min(99999,Number(t.value)||42));this.summary=null;this.sendPreview();}
    if(t.id==='project-copy-view'){this.copyView=t.value;this.copyRows=[];this.render();}
    if(t.dataset.projectCopyElement){this.update(p=>{p.screens.find(s=>s.id===t.dataset.projectCopyScreen).elements.find(e=>e.id===t.dataset.projectCopyElement).text=t.value;});}
    if(t.dataset.nativeCopy){const row=this.copyRows.find(r=>r.id===t.dataset.nativeCopy);this.update(p=>{const old=p.copy.find(r=>r.id===row.id&&r.viewId===this.copyView);if(old)old.text=t.value;else p.copy.push({id:row.id,viewId:this.copyView,tag:row.tag,original:row.original,text:t.value});});this.sendCopy();}
    if(t.dataset.releaseCheck){this.update(p=>{p.releases.find(r=>r.id===t.dataset.releaseId).checks[t.dataset.releaseCheck]=t.checked;});}
    if(t.dataset.reviewDone){this.update(p=>{p.releases.find(r=>r.id===t.dataset.releaseId).reviews[Number(t.dataset.reviewDone)].status=t.checked?'addressed':'open';});}
  }
  updateElementLabels(){const s=this.project.screens.find(s=>s.id===this.screenId);for(const b of this.workspace.querySelectorAll('[data-project-element]')){const e=s.elements.find(e=>e.id===b.dataset.projectElement);if(e)b.textContent=e.type+' · '+e.text;}this.drawFlow();}
  taskDialog(id){
    const old=this.project.tasks.find(t=>t.id===id),t=old||{id:newId('task'),title:'',days:1,priority:'normal',status:'todo',deadline:'',screen:'',depends:[]};
    this.dialog(`<h2>${old?'Zadanie':'Nowe zadanie'}</h2><form id=project-task-form>${field('Co jest do zrobienia?',t.title,'id=task-title required maxlength=120')}${select('Priorytet',t.priority,{critical:'Krytyczne',high:'Ważne',normal:'Zwykłe',later:'Później'},'id=task-priority')}${select('Stan',t.status,{todo:'Do zrobienia',doing:'W toku',review:'Do sprawdzenia',done:'Gotowe'},'id=task-status')}${field('Szacowane dni',t.days,'id=task-days min=1 max=30','number')}${field('Deadline',t.deadline,'id=task-deadline','date')}${select('Powiązany ekran',t.screen,{'':'Bez powiązania',...Object.fromEntries(this.project.screens.map(s=>[s.id,s.name]))},'id=task-screen')}<fieldset class=project-dependencies><legend>Najpierw muszą być gotowe</legend>${this.project.tasks.filter(v=>v.id!==t.id).map(v=>`<label><input type=checkbox value="${v.id}" ${t.depends.includes(v.id)?'checked':''}>${html(v.title)}</label>`).join('')||'<p>To pierwsze zadanie.</p>'}</fieldset><p id=project-task-error class=modal-error role=alert></p><div class=modal-actions>${old?button('Usuń zadanie','id=task-remove type=button'):''}${button('Anuluj','data-close type=button')}${button('Zapisz zadanie','type=submit',true)}</div></form>`);
    this.modal.querySelector('form').onsubmit=e=>{e.preventDefault();try{const v={...t,title:this.modal.querySelector('#task-title').value.trim(),priority:this.modal.querySelector('#task-priority').value,status:this.modal.querySelector('#task-status').value,days:Number(this.modal.querySelector('#task-days').value),deadline:this.modal.querySelector('#task-deadline').value,screen:this.modal.querySelector('#task-screen').value,depends:[...this.modal.querySelectorAll('.project-dependencies input:checked')].map(i=>i.value)};this.update(p=>{const index=p.tasks.findIndex(r=>r.id===t.id);if(index<0)p.tasks.push(v);else p.tasks[index]=v;});this.modal.close();this.render();}catch(error){this.modal.querySelector('#project-task-error').textContent=error.message;}};
    this.modal.querySelector('#task-remove')?.addEventListener('click',()=>{this.update(p=>{p.tasks=p.tasks.filter(r=>r.id!==t.id);p.tasks.forEach(r=>r.depends=r.depends.filter(d=>d!==t.id));});this.modal.close();this.render();});
  }
  assetDialog(target){
    const all=this.data.assets.assets.filter(a=>/\.(png|jpe?g|webp|avif|svg)$/.test(a.path));
    this.dialog(`<h2>Wspólna ilustracja</h2>${info('Wybierasz istniejący plik. Ekran i słowa mogą korzystać z tego samego assetu.')}${field('Szukaj ilustracji','','id=project-asset-search placeholder="np. mapa, reading, morze"')}<div id=project-asset-options class=project-asset-grid></div><div class=modal-actions>${button('Wgraj nowy asset','id=project-upload-asset')}${button('Zamknij','data-close')}</div>`);
    const draw=()=>{const q=this.modal.querySelector('#project-asset-search').value.toLocaleLowerCase('pl');this.modal.querySelector('#project-asset-options').innerHTML=all.filter(a=>!q||a.path.toLocaleLowerCase('pl').includes(q)).slice(0,48).map(a=>`<button data-pick-project-asset="${a.path}"><img src="${this.picture(a.path)}" alt=""><span>${html(a.path.split('/').at(-1))}</span></button>`).join('');};draw();this.modal.querySelector('#project-asset-search').oninput=draw;
    this.modal.querySelector('#project-asset-options').onclick=e=>{const b=e.target.closest('[data-pick-project-asset]');if(!b)return;this.update(p=>{const s=p.screens.find(s=>s.id===this.screenId);if(target==='screen')s.asset=b.dataset.pickProjectAsset;else s.elements.find(e=>e.id===this.elementId).asset=b.dataset.pickProjectAsset;});this.modal.close();this.render();};
    this.modal.querySelector('#project-upload-asset').onclick=()=>{this.modal.close();this.upload();};
  }
  releaseDialog(){this.dialog(`<h2>Zapisz wersję testową</h2><form>${field('Nazwa wersji','Próba '+(this.project.releases.length+1),'id=project-release-name required maxlength=80')}<p>Ta wersja zachowa własne ekrany, teksty, wygląd i zasady. Kolejne zmiany zostają w szkicu.</p><p class=modal-error id=project-release-error role=alert></p><div class=modal-actions>${button('Anuluj','type=button data-close')}${button('Zapisz wersję','type=submit',true)}</div></form>`);this.modal.querySelector('form').onsubmit=e=>{e.preventDefault();try{const r=makeRelease(this.project,this.data.config,this.modal.querySelector('#project-release-name').value.trim());this.update(p=>p.releases.push(r));this.modal.close();this.tab='release';this.render();}catch(e){this.modal.querySelector('#project-release-error').textContent=e.message;}};}
  async shareRelease(id,open=false){
    const r=this.project.releases.find(r=>r.id===id);
    const pending=new Set(this.getPendingAssets());if(r.snapshot.screens.some(s=>pending.has(s.asset)||s.elements.some(e=>pending.has(e.asset))))throw Error('Zapisz nowe ilustracje na GitHub przed udostępnieniem. Projekt może pozostać szkicem.');
    const encoded=await encodeShare({kind:'mala-nauka-preview',schemaVersion:1,releaseId:r.id,name:r.name,fingerprint:r.fingerprint,snapshot:r.snapshot});const make=()=>previewLink(encoded,this.access);
    this.dialog(`<h2>${open?'Otwórz wersję':'Udostępnij wersję testową'}</h2><p>Osoba testująca może klikać, zmieniać dane przykładowe i przekazać pakiet uwag. Ten link zachowuje aktualnie wybraną wersję.</p>${field('Link dostępu do tego preview (opcjonalnie)',this.access,'id=project-preview-access placeholder="Wklej otrzymany link preview, jeśli hosting wymaga dostępu"')}<p>Jeśli hosting jest chroniony, wklej udostępniony link tego samego deploymentu. Nie wpisuj hasła ani tokenu GitHub.</p><label class=form-field><span>Link wersji</span><textarea id=project-preview-link readonly rows=3>${html(make())}</textarea></label><p id=project-share-status role=status></p><div class=modal-actions>${button('Zamknij','data-close')}${button('Skopiuj link','id=project-copy-link',true)}<a class=quiet-button id=project-open-link href="${html(make())}" target=_blank rel=noopener>Otwórz podgląd</a></div>`);
    this.modal.querySelector('#project-preview-access').onchange=e=>{try{const access=e.target.value.trim(),url=previewLink(encoded,access);this.access=access;this.modal.querySelector('#project-preview-link').value=url;this.modal.querySelector('#project-open-link').href=url;localStorage.setItem('mn-project-preview-access',this.access);}catch(error){this.modal.querySelector('#project-share-status').textContent=error.message;}};
    this.modal.querySelector('#project-copy-link').onclick=async()=>{try{await navigator.clipboard.writeText(this.modal.querySelector('#project-preview-link').value);this.modal.querySelector('#project-share-status').textContent='Link skopiowany.';}catch{this.modal.querySelector('#project-preview-link').select();this.modal.querySelector('#project-share-status').textContent='Skopiuj zaznaczony link.';}};
  }
  importDialog(kind){
    this.dialog(`<h2>${kind==='feedback'?'Importuj uwagi':'Importuj projekt'}</h2><p>${kind==='feedback'?'Wklej link z pakietem uwag otrzymany od osoby testującej.':'Wklej zawartość wyeksportowanego projektu. Import zastąpi projekt w szkicu; Cofnij odtworzy poprzedni.'}</p><form><label class=form-field><span>${kind==='feedback'?'Pakiet uwag':'Projekt'}</span><textarea id=project-import-value required></textarea></label><p id=project-import-error class=modal-error role=alert></p><div class=modal-actions>${button('Anuluj','data-close type=button')}${button('Wczytaj','type=submit',true)}</div></form>`);
    this.modal.querySelector('form').onsubmit=async e=>{e.preventDefault();try{const text=this.modal.querySelector('#project-import-value').value.trim();if(kind==='project'){const parsed=validateProject(JSON.parse(text));this.changeProject(()=>parsed);}
      else{let raw=text;if(text.startsWith('https://'))raw=new URLSearchParams(new URL(text).hash.slice(1)).get('feedback');const value=validateFeedback(await decodeShare(raw));const r=this.project.releases.find(r=>r.id===value.releaseId);if(!r||r.fingerprint!==value.fingerprint)throw Error('Uwagi dotyczą innej wersji. Wczytaj właściwy projekt zamiast przypisywać je do bieżącego szkicu.');this.update(p=>{const target=p.releases.find(r=>r.id===value.releaseId);for(const c of value.comments)if(!target.reviews.some(v=>v.text===c.text&&v.screen===c.screen))target.reviews.push({...c,status:'open'});if(target.status!=='published')target.status='test';});}
      this.modal.close();this.tab='release';this.render();}catch(error){this.modal.querySelector('#project-import-error').textContent=error.message;}};
  }
}
