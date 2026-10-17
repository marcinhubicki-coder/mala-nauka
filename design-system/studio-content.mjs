import {playableWords} from '../shared/asset-loader.mjs';
import {auditWordPools,spellingPool,questionForWord} from '../spelling/word-pools.mjs';
import {html} from './preview-model.mjs';
import {RULE_CATEGORIES,orthographyFamilies,validateRules,wordRuleIds,wordsForRule,applyRules} from '../shared/rules-library.mjs';
import {wordsUsingAsset,mergeAssetAssignments} from './content-model.mjs';

export class StudioContent {
  constructor(options){
    Object.assign(this,options);this.tab='words';this.search='';this.filter='all';this.page=0;this.selected=new Set();
    this.workspace.addEventListener('click',event=>this.click(event));
    this.workspace.addEventListener('input',event=>this.input(event));
    this.workspace.addEventListener('change',event=>this.change(event));
  }
  get assets(){return this.getData().assets;}
  get rules(){return this.getData().rules;}
  get words(){return this.getData().words;}
  get isOpen(){return Boolean(this.workspace.querySelector('[data-content-library]'));}
  image(path){return path?this.picture(path):'';}
  chips(values){return `<div class=family-chips>${values.map(value=>`<span>${html(value)}</span>`).join('')}</div>`;}
  render(){
    const shared=this.assets.assets.filter(asset=>!this.assets.aliases[asset.path]&&wordsUsingAsset(this.assets,asset.path).length>1).length;
    this.workspace.innerHTML=`<div class=content-page data-content-library><div class=page-intro><div><h2>Słowa, grafiki i wspólne zasady</h2><p>Wybierz słowo, żeby zobaczyć jego powiązania. Zmień zasadę raz — skorzystają z niej wszystkie powiązane słowa.</p></div><div><button class=quiet-button id=refresh-git>Odśwież bazę z GitHub</button> <button class=solid-button id=upload-asset>Dodaj grafikę</button></div></div><div class=library-tabs role=group aria-label='Wybierz część bazy'>${[['words','Słowa',this.words.length],['pictures','Grafiki',shared+' współdzielonych'],['rules','Zasady',Object.keys(this.rules.rules).length],['pools','Pule i kontrola','auto']].map(([id,label,count])=>`<button data-library-tab=${id} class='${this.tab===id?'active':''}'>${label} <span>${count}</span></button>`).join('')}</div><div class=searchbar><input id=library-search aria-label='Szukaj w bazie' placeholder='${this.tab==='rules'?'Znajdź zasadę po nazwie lub grupie liter…':this.tab==='pictures'?'Znajdź grafikę po słowie…':'Znajdź słowo lub grupę liter…'}' value='${html(this.search)}'><select id=library-filter aria-label='Filtr bazy'>${this.filters()}</select>${this.tab==='pictures'?'<button class=quiet-button id=asset-inventory>Pełny rejestr plików</button>':''}</div>${this.tab==='pictures'?`<div class=merge-bar><span id=merge-count>${this.selected.size} wybranych grafik</span><button class=small-button id=clear-asset-selection>Odznacz</button><button class=solid-button id=merge-selected-assets ${this.selected.size<2?'disabled':''}>Scal wybrane grafiki</button></div>`:''}<div id=library-results>${this.results()}</div>${this.tab==='rules'?this.analyzer():''}</div>`;
  }
  filters(){
    const choices=this.tab==='pools'?[['all','Wszystkie poziomy'],['basic','Podstawowe'],['hard','Trudne']]:this.tab==='words'?[['all','Wszystkie słowa'],['shared','Współdzielą grafikę'],['multi','Kilka grup liter'],['missing','Bez grafiki']]:this.tab==='pictures'?[['all','Wszystkie ilustracje słów'],['shared','Używane przez kilka słów'],['unused','Bez przypisanych słów']]:[['all','Wszystkie grupy'],...RULE_CATEGORIES.map(id=>[id,id])];
    return choices.map(([id,label])=>`<option value='${id}' ${id===this.filter?'selected':''}>${label}</option>`).join('');
  }
  matches(...values){const term=this.search.trim().toLocaleLowerCase('pl');return !term||values.join(' ').toLocaleLowerCase('pl').includes(term);}
  pager(pool){
    const pages=Math.max(1,Math.ceil(pool.length/24));this.page=Math.min(this.page,pages-1);
    return {slice:pool.slice(this.page*24,this.page*24+24),footer:`<div class=pagination><button class=small-button data-library-page=${this.page-1} ${this.page===0?'disabled':''}>Poprzednia</button><span>${this.page+1} / ${pages} · ${pool.length} wyników</span><button class=small-button data-library-page=${this.page+1} ${this.page===pages-1?'disabled':''}>Następna</button></div>`};
  }
  results(){
    if(this.tab==='pools')return this.poolCards();
    if(this.tab==='rules')return this.ruleCards();
    if(this.tab==='pictures')return this.pictureCards();
    const pool=this.words.filter(word=>{
      const row=this.assets.words[word.word],families=this.rules.assignments[word.word]?.families||orthographyFamilies(word.word);
      return this.matches(word.word,...families)&&(this.filter==='all'||this.filter==='missing'&&!row||this.filter==='shared'&&row&&wordsUsingAsset(this.assets,row.path).length>1||this.filter==='multi'&&families.length>1);
    }).sort((a,b)=>a.word.localeCompare(b.word,'pl'));
    const {slice,footer}=this.pager(pool);
    return `<div class=word-grid>${slice.map(word=>{
      const path=this.assets.words[word.word]?.path,picture=this.image(path),uses=path?wordsUsingAsset(this.assets,path):[];
      return `<article class=word-card><button class=word-picture data-word-details='${html(word.word)}' aria-label='Otwórz słowo: ${html(word.word)}'>${picture?`<img src='${html(picture)}' alt='${html(word.word)}' loading=lazy width=300 height=300>`:'<div class=missing-picture>＋</div>'}</button><strong>${html(word.word)}</strong>${this.chips(this.rules.assignments[word.word]?.families||orthographyFamilies(word.word))}<small>${!path?'Czeka na grafikę · poza grą':uses.length>1?`Ta sama grafika: ${uses.length} słów`:'Własna ilustracja'} · poziom ${word.difficulty}</small><div class=word-actions><button type=button data-word-details='${html(word.word)}'>Zobacz powiązania</button><button data-upload-word='${html(word.word)}'>${path?'Zmień grafikę':'Dodaj grafikę'}</button></div></article>`;
    }).join('')||'<p class=empty-hint>Nie znaleziono słów. Zmień wyszukiwanie lub filtr.</p>'}</div>${footer}`;
  }
  poolCards(){
    const audit=auditWordPools(this.words,this.assets),ready=auditWordPools(playableWords(this.words,this.assets),this.assets);this.poolCategory||='rz/ż';
    const difficulty=this.filter==='basic'?1:this.filter==='hard'?2:0;
    const pool=spellingPool(this.words,{category:this.poolCategory,difficulty},()=>0,this.rules).filter(row=>this.matches(row.word));
    const {slice,footer}=this.pager(pool),brzuch=this.words.find(row=>row.word==='brzuch');
    return `<div class=summary-strip><div class=summary-card><b>${audit.uniqueWords}</b><span>unikalnych słów</span></div><div class=summary-card><b>${audit.duplicates.length}</b><span>powtórzonych rekordów</span></div><div class=summary-card><b>${audit.multipleCategories}</b><span>słów w kilku pulach</span></div><div class=summary-card><b>${audit.missingAssets.length}</b><span>bez przypisanej grafiki</span></div></div><p class=description>Pule wynikają z pisowni słowa i zasad ćwiczenia automatycznie. Słowa bez przypisanej ilustracji czekają w bazie i nie są losowane w grze. Przypisanie do kilku pul jest relacją, nie kopią słowa. W rundzie wybieramy jedną lukę i jedno użycie słowa. Po wyczerpaniu puli runda kończy się.</p><div class=pool-grid>${audit.pools.map(row=>`<button class="pool-card ${this.poolCategory===row.category?'active':''}" data-pool-category="${row.category}" aria-pressed=${this.poolCategory===row.category}><strong>${row.category} · ${row.total}</strong><span>Gotowe do gry: ${ready.pools.find(p=>p.category===row.category)?.total||0}</span><small>Podstawowe: ${row.basic} · trudne: ${row.total-row.basic}</small></button>`).join('')}</div>${audit.duplicates.length?`<p class=budget-note>Wykryto powtórzone rekordy: ${audit.duplicates.map(r=>html(r.word)).join(', ')}. Gra scala je według słowa; sprzeczne poziomy blokują wczytanie.</p>`:''}<section class=panel><h3>„Brzuch”: jedno słowo, trzy pule, jedna grafika</h3><div class=pool-example><img src="${html(this.image(this.assets.words.brzuch?.path))}" alt="Ilustracja słowa brzuch"><div><div class=pool-slots>${['rz/ż','u/ó','ch/h'].map(category=>{const q=questionForWord(brzuch,category,this.rules);return `<button data-word-details=brzuch><strong>${html(q.masked)}</strong><span>${category} · odpowiedź ${q.answer}</span></button>`;}).join('')}</div><p>Ta sama ilustracja przy każdym wariancie. Losowanie kilku kategorii nadal daje jedną pozycję w rundzie.</p></div></div></section><h3>Słowa w puli ${html(this.poolCategory)} · ${pool.length} pasujących do filtra</h3><div class=linked-words>${slice.map(row=>`<button data-word-details="${html(row.word)}"><img src="${html(this.image(this.assets.words[row.word]?.path))}" alt=""><span>${html(row.word)}<small>${html(row.masked)}</small></span></button>`).join('')||'<p>Brak słów dla tego filtra.</p>'}</div>${footer}<details class="panel pool-roadmap"><summary>Jak rozwijać poziomy bez mnożenia kategorii?</summary><p>Na start: u/ó, rz/ż i ch/h. Następnie istniejące pary zmiękczeń. Wybór „Podstawowe” i „Trudne” filtruje poziom, a nie tworzy nowych kopii.</p><p>„Przód” już jest w bazie, także w puli u/ó. „Portfel” jest poprawnym zapisem; „portwel” to pomyłka f/w, a „potfel” pomija r. Takie pomyłki można później ćwiczyć w jednym trybie „pełny zapis”, z porównaniem dwóch słów. Nie dodajemy teraz osobnej kategorii dla każdej pomyłki ani nie mieszamy mechaniki z jedną bańką.</p></details>`;
  }
  activePictures(){return this.assets.assets.filter(asset=>['scenes','managed'].includes(asset.group)&&!this.assets.aliases[asset.path]);}
  pictureCards(){
    const pool=this.activePictures().filter(asset=>{
      const labels=wordsUsingAsset(this.assets,asset.path);return this.matches(...labels,asset.path.split('/').at(-1))&&(this.filter==='all'||this.filter==='shared'&&labels.length>1||this.filter==='unused'&&!labels.length);
    });
    const {slice,footer}=this.pager(pool);
    return `<div class=word-grid>${slice.map(asset=>{
      const labels=wordsUsingAsset(this.assets,asset.path);
      return `<article class='word-card ${this.selected.has(asset.path)?'selected-picture':''}'><button class=word-picture data-picture-details='${html(asset.path)}' aria-label='Powiązania grafiki: ${html(labels[0]||'bez słów')}'><img src='${html(this.image(asset.path))}' alt='${html(labels.slice(0,3).join(', ')||'Ilustracja bez przypisania')}' loading=lazy width=300 height=300></button><strong>${labels.length} ${labels.length===1?'słowo':'słów'}</strong><small>${html(labels.slice(0,3).join(', ')||'Jeszcze bez przypisania')}${labels.length>3?'…':''}</small><label class=select-picture><input type=checkbox data-merge-picture='${html(asset.path)}' ${this.selected.has(asset.path)?'checked':''}>Wybierz do scalenia</label><button class=small-button data-picture-details='${html(asset.path)}'>Zobacz użycia</button></article>`;
    }).join('')||'<p class=empty-hint>Nie znaleziono grafik. Zmień filtr lub wyszukiwanie.</p>'}</div>${footer}`;
  }
  ruleCards(){
    const types={memory:'Zapamiętaj',pattern:'Wzór pisowni',exchange:'Wymiana',exception:'Wyjątek'};
    const pool=Object.entries(this.rules.rules).filter(([,rule])=>this.matches(rule.title,rule.category)&&(this.filter==='all'||rule.category===this.filter));
    return `<div class=rule-grid>${pool.map(([id,rule])=>{
      const labels=wordsForRule(this.rules,id);
      return `<article class=rule-card><div>${this.chips([rule.category])}<span class=tag>${types[rule.type]}</span></div><h3>${html(rule.title)}</h3><p>${html(rule.explanation)}</p><div class=rule-word-previews>${labels.slice(0,5).map(label=>`<button type=button data-word-details='${html(label)}' title='${html(label)}'><img src='${html(this.image(this.assets.words[label]?.path))}' alt='${html(label)}' loading=lazy></button>`).join('')}</div><small>${labels.length} powiązanych słów${rule.edited?' · wspólna treść aktywna':''}</small><button class=small-button data-edit-rule=${id}>Zobacz i edytuj zasadę</button></article>`;
    }).join('')||'<p class=empty-hint>Nie znaleziono zasady.</p>'}</div>`;
  }
  analyzer(){return `<section class='panel letter-analyzer'><h3>Sprawdź grupy liter w dowolnym słowie</h3><p>Jedno słowo może należeć do kilku grup. To wykrywa litery; dobór konkretnej zasady sprawdzasz osobno.</p><label class=form-field><span>Słowo do sprawdzenia</span><input id=analyze-word value='chrzanić' maxlength=80></label><div id=analysis-result>${this.analysis('chrzanić')}</div><p>Sprawdzanie nie dodaje słowa do gry.</p></section>`;}
  analysis(word){const families=orthographyFamilies(word);return `${this.chips(families)}<p>${this.words.some(row=>row.word===word)?'Słowo jest w bazie.':'Tego słowa nie ma w obecnej bazie.'} ${families.length?'':'Nie znaleziono grup ortograficznych.'}</p>`;}
  miniWords(labels){return `<div class=linked-words>${labels.map(label=>`<button type=button data-word-details='${html(label)}'><img src='${html(this.image(this.assets.words[label]?.path))}' alt='' loading=lazy><span>${html(label)}</span></button>`).join('')}</div>`;}
  wireDialog(){
    this.modal.querySelectorAll('[data-word-details]').forEach(button=>button.onclick=()=>this.openWord(button.dataset.wordDetails));
    this.modal.querySelectorAll('[data-edit-rule]').forEach(button=>button.onclick=()=>this.openRule(button.dataset.editRule));
  }
  openWord(label){
    const word=this.words.find(row=>row.word===label);if(!word)return;
    const assignment=this.rules.assignments[label],ids=wordRuleIds(this.rules,label),path=this.assets.words[label]?.path,uses=path?wordsUsingAsset(this.assets,path):[];
    const resolved=applyRules([word],this.rules)[0];
    this.dialog(`<h2>${html(label)}</h2><div class=word-detail-layout><div><img class=word-detail-picture src='${html(this.image(path))}' alt='${html(label)}'><div class=modal-actions><button class=small-button id=pick-word-picture>Wybierz z bazy</button><button class=small-button id=upload-word-picture>Dodaj nową grafikę</button></div></div><div><p>${html(word.masked)} · poziom ${word.difficulty}</p><h3>Warianty jednej luki w grze</h3><div class=pool-slots>${(assignment?.families||orthographyFamilies(label)).map(category=>{const q=questionForWord(word,category,this.rules);return q?`<a class=small-button href="../ortografia/?studio=1&mode=spelling&screen=game&state=initial&word=${encodeURIComponent(label)}&category=${encodeURIComponent(category)}" target=_blank rel=noopener><strong>${html(q.masked)}</strong> · ${category} ↗</a>`:'';}).join('')}</div><p>Jedno słowo w rundzie. Wybór grafiki obejmuje wszystkie warianty.</p><h3>Grupy liter w słowie</h3>${this.chips(assignment?.families||orthographyFamilies(label))}<h3>Powiązane zasady</h3>${ids.map((id,index)=>`<button class=rule-link data-edit-rule=${id}><span>${index===0?'Zasada ćwiczona w grze':'Dodatkowe powiązanie'}</span><strong>${html(this.rules.rules[id].title)}</strong>Edytuj wspólną treść ↗</button>`).join('')}<p>${html(resolved.learning?.explanation||'')}</p><details class=additional-rules><summary>Powiąż z kolejną zasadą</summary><p>Treść pozostaje wspólna. Wariant pytania korzysta ze wspólnej treści odpowiedniej grupy. Konkretne reguły dobieraj po sprawdzeniu słowa.</p>${Object.entries(this.rules.rules).filter(([id,rule])=>id!==assignment?.primary&&(assignment?.families||[]).includes(rule.category)).map(([id,rule])=>`<label><input type=checkbox data-additional-rule=${id} ${assignment?.additional.includes(id)?'checked':''}>${html(rule.title)}</label>`).join('')}<button class=small-button id=save-rule-links>Zapisz powiązania do szkicu</button></details></div></div><section><h3>Ta sama grafika: ${uses.length} ${uses.length===1?'słowo':'słów'}</h3>${this.miniWords(uses)}${uses.length>1?'<p>Wybór innej grafiki dla tego słowa zachowa ilustracje pozostałych słów.</p>':''}</section><div class=modal-actions><button class=quiet-button data-close>Zamknij</button></div>`);
    this.modal.querySelector('#pick-word-picture').onclick=()=>this.openPicker(label);
    this.modal.querySelector('#upload-word-picture').onclick=()=>{this.modal.close();this.upload(label);};
    this.modal.querySelector('#save-rule-links').onclick=()=>{
      const next=structuredClone(this.rules);next.assignments[label].additional=[...this.modal.querySelectorAll('[data-additional-rule]:checked')].map(node=>node.dataset.additionalRule);validateRules(next);this.update({rules:next});this.openWord(label);this.notice('Powiązania zapisane w szkicu.');
    };
    this.wireDialog();
  }
  openRule(id){
    const rule=this.rules.rules[id];if(!rule)return;
    const labels=wordsForRule(this.rules,id),baseRule=this.getBaseRules().rules[id];
    this.dialog(`<h2>Wspólna zasada</h2>${this.chips([rule.category])}<p>Ta zasada jest powiązana z <strong>${labels.length} słowami</strong>. Jedna zmiana treści obejmie wszystkie słowa, w których jest zasadą ćwiczoną.</p>${!rule.edited?'<p>Obecne wyjaśnienia słów są zachowane. Zapisanie zmiany uaktywni poniższą wspólną treść.</p>':''}<form id=shared-rule-form><label class=form-field><span>Nazwa zasady</span><input id=shared-rule-title value='${html(rule.title)}' maxlength=120 required></label><label class=form-field><span>Treść wspólna dla słów</span><textarea aria-label='Treść wspólna dla słów' id=shared-rule-text maxlength=600 required>${html(rule.explanation)}</textarea></label><details><summary>Ostatnio zapisano</summary><p>${html(baseRule?.explanation||'Nowa zasada')}</p></details><h3>Powiązane słowa</h3>${this.miniWords(labels)}<p class=modal-error id=rule-error role=alert></p><div class=modal-actions><button type=button class=quiet-button data-close>Anuluj</button><button type=submit class=solid-button>Zapisz zasadę do szkicu</button></div></form>`);
    this.wireDialog();
    this.modal.querySelector('form').onsubmit=event=>{
      event.preventDefault();try{const next=structuredClone(this.rules);Object.assign(next.rules[id],{title:this.modal.querySelector('#shared-rule-title').value.trim(),explanation:this.modal.querySelector('#shared-rule-text').value.trim(),edited:true});validateRules(next);this.update({rules:next});this.modal.close();if(this.isOpen)this.render();this.notice(`Wspólna zasada zapisana w szkicu. Powiązane słowa: ${labels.length}.`);}catch(error){this.modal.querySelector('#rule-error').textContent=error.message;}
    };
  }
  openPicker(label){
    let term='',currentPage=0;
    this.dialog(`<h2>Grafika dla: ${html(label)}</h2><p>Kliknij obrazek. Przypisanie zmieni się tylko dla tego słowa.</p><input id=picture-picker-search aria-label='Szukaj grafiki po słowie' placeholder='Znajdź grafikę po używającym jej słowie…'><div id=picture-picker-results></div><div class=modal-actions><button class=quiet-button id=picker-back>Wróć do słowa</button></div>`);
    const paint=()=>{
      const pool=this.activePictures().filter(asset=>!term||wordsUsingAsset(this.assets,asset.path).join(' ').toLocaleLowerCase('pl').includes(term)),pages=Math.max(1,Math.ceil(pool.length/20));currentPage=Math.min(currentPage,pages-1);
      const node=this.modal.querySelector('#picture-picker-results');
      node.innerHTML=`<div class=picture-picker-grid>${pool.slice(currentPage*20,currentPage*20+20).map(asset=>{const labels=wordsUsingAsset(this.assets,asset.path);return `<button data-pick-picture='${html(asset.path)}' class='${this.assets.words[label]?.path===asset.path?'active':''}'><img src='${html(this.image(asset.path))}' alt='${html(labels.slice(0,2).join(', ')||'Ilustracja')}' loading=lazy><span>${html(labels.slice(0,2).join(', ')||'Bez słów')}</span></button>`;}).join('')}</div><div class=pagination><button class=small-button id=picker-prev ${currentPage===0?'disabled':''}>Poprzednie</button><span>${currentPage+1} / ${pages}</span><button class=small-button id=picker-next ${currentPage===pages-1?'disabled':''}>Następne</button></div>`;
      node.querySelector('#picker-prev').onclick=()=>{currentPage--;paint();};node.querySelector('#picker-next').onclick=()=>{currentPage++;paint();};
      node.querySelectorAll('[data-pick-picture]').forEach(button=>button.onclick=()=>{const next=structuredClone(this.assets);next.words[label]={...next.words[label],path:button.dataset.pickPicture,manual:true};this.update({assets:next});this.openWord(label);this.notice('Przypisanie grafiki zmienione w szkicu.');});
    };
    this.modal.querySelector('#picture-picker-search').oninput=event=>{term=event.target.value.toLocaleLowerCase('pl');currentPage=0;paint();};
    this.modal.querySelector('#picker-back').onclick=()=>this.openWord(label);paint();
  }
  openPicture(path){
    const labels=wordsUsingAsset(this.assets,path);
    this.dialog(`<h2>Użycia grafiki</h2><img class=word-detail-picture src='${html(this.image(path))}' alt='Wybrana ilustracja'><p><strong>${labels.length} słów</strong> korzysta z tej ilustracji.</p>${this.miniWords(labels)}<details><summary>Informacje o pliku</summary><p>${html(path)}</p></details><div class=modal-actions><button class=quiet-button data-close>Zamknij</button><button class=solid-button id=select-this-picture>Wybierz do scalenia</button></div>`);
    this.wireDialog();this.modal.querySelector('#select-this-picture').onclick=()=>{this.selected.add(path);this.modal.close();this.tab='pictures';this.render();};
  }
  openMerge(){
    const paths=[...this.selected].filter(path=>this.activePictures().some(asset=>asset.path===path));if(paths.length<2)return;
    const affected=[...new Set(paths.flatMap(path=>wordsUsingAsset(this.assets,path)))];
    this.dialog(`<h2>Scal w jedną grafikę</h2><p>Wybierz obrazek docelowy. Wszystkie <strong>${affected.length} powiązane słowa</strong> będą korzystać z niego.</p><form id=merge-pictures-form><div class=merge-picture-options>${paths.map((path,index)=>`<label><input type=radio name=merge-target value='${html(path)}' ${index===0?'checked':''}><img src='${html(this.image(path))}' alt='${html(wordsUsingAsset(this.assets,path).slice(0,2).join(', '))}'><span>${wordsUsingAsset(this.assets,path).length} słów</span></label>`).join('')}</div><h3>Słowa objęte zmianą</h3>${this.miniWords(affected)}<p>Poprzednie pliki zostają dostępne. Cofnięcie przywróci przypisania w szkicu.</p><p class=modal-error id=merge-picture-error role=alert></p><div class=modal-actions><button type=button class=quiet-button data-close>Anuluj</button><button class=solid-button type=submit>Scal przypisania do szkicu</button></div></form>`);
    this.modal.querySelector('form').onsubmit=event=>{event.preventDefault();try{const target=this.modal.querySelector('[name=merge-target]:checked').value;this.update({assets:mergeAssetAssignments(this.assets,paths,target)});this.selected.clear();this.modal.close();this.render();this.notice(`Scalono grafiki w szkicu. Powiązane słowa: ${affected.length}.`);}catch(error){this.modal.querySelector('#merge-picture-error').textContent=error.message;}};
  }
  refreshResults(){const node=this.workspace.querySelector('#library-results');if(node)node.innerHTML=this.results();}
  click(event){
    if(!this.isOpen)return;const button=event.target.closest('button');if(!button)return;
    if(button.dataset.libraryTab){this.tab=button.dataset.libraryTab;this.page=0;this.filter='all';this.search='';this.render();}
    if(button.dataset.poolCategory){this.poolCategory=button.dataset.poolCategory;this.page=0;this.refreshResults();}
    if(button.dataset.libraryPage!==undefined){this.page=Number(button.dataset.libraryPage);this.refreshResults();}
    if(button.dataset.wordDetails)this.openWord(button.dataset.wordDetails);
    if(button.dataset.editRule)this.openRule(button.dataset.editRule);
    if(button.dataset.pictureDetails)this.openPicture(button.dataset.pictureDetails);
    if(button.id==='clear-asset-selection'){this.selected.clear();this.render();}
    if(button.id==='merge-selected-assets')this.openMerge();
  }
  input(event){
    if(!this.isOpen)return;
    if(event.target.id==='library-search'){this.search=event.target.value;this.page=0;this.refreshResults();}
    if(event.target.id==='analyze-word')this.workspace.querySelector('#analysis-result').innerHTML=this.analysis(event.target.value);
  }
  change(event){
    if(!this.isOpen)return;
    if(event.target.id==='library-filter'){this.filter=event.target.value;this.page=0;this.refreshResults();}
    if(event.target.dataset.mergePicture){if(event.target.checked)this.selected.add(event.target.dataset.mergePicture);else this.selected.delete(event.target.dataset.mergePicture);this.workspace.querySelector('#merge-count').textContent=this.selected.size+' wybranych grafik';this.workspace.querySelector('#merge-selected-assets').disabled=this.selected.size<2;event.target.closest('.word-card').classList.toggle('selected-picture',event.target.checked);}
  }
}
