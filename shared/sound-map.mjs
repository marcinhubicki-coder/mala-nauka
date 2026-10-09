// Semantic sound slots are shared by the view map and the real controls.
// A fallback slot gives new controls a sound before an individual override exists.
export const SOUND_COLUMNS=[['Logowanie',['players-empty','players','player-create','player-pin','player-unlock']],['Ekran startowy',['home','settings']],['Opcje rozgrywki',['spelling-settings','english-settings','flags-settings','reading-settings','math-settings']],['Gra',['spelling-initial','english-initial','flags-initial','reading-initial','math-initial']],['Koniec gry',['spelling-results','english-results','flags-results','reading-results','math-results']],['Statystyki',['progress','collection','trophies','categories','rules','sessions']]];
const row=(key,label,cue='tap',group='Przyciski')=>({key,label,cue,group});
const actions=rows=>rows.map(([id,label,cue])=>row('action:'+id,label,cue));
const common=[row('button','Pozostałe przyciski i linki'),row('control','Pozostałe przełączniki i suwaki','toggle','Ustawienia'),row('field','Pola do wpisywania','tap','Ustawienia'),row('summary','Rozwiń / zwiń sekcję','toggle')];
const player=actions([['choose-player','Wybierz kartę gracza','toggle'],['continue-player','Wejdź do gry','next'],['add-player','Dodaj gracza','next'],['guest-player','Zagraj bez profilu','next']]);
const profile=actions([['players','Wróć do graczy'],['edit-player','Wróć do profilu'],['choose-avatar','Wybierz avatar','toggle'],['pin-digit','Cyfra PIN'],['pin-backspace','Usuń cyfrę PIN'],['submit-pin','Zatwierdź PIN / bez PIN-u','next']]);
const preferences=actions([['home','Powrót'],['edit-profile','Edytuj profil'],['enable-pin','Włącz PIN','toggle'],['disable-pin','Wyłącz PIN','toggle'],['switch-player','Zmień gracza','next'],['delete-profile','Usuń profil'],['cancel-delete-profile','Anuluj usunięcie'],['confirm-delete-profile','Potwierdź usunięcie'],['export-backup','Eksportuj dane'],['import-backup','Importuj dane'],['cancel-import','Anuluj import'],['confirm-import','Zatwierdź import'],['clear','Wyczyść wyniki'],['cancel-clear','Anuluj czyszczenie'],['confirm-clear','Potwierdź czyszczenie']]);
const game=actions([['answer','Wybierz odpowiedź'],['pause','Pauza'],['exit','Wyjdź'],['resume','Kontynuuj','next'],['exit-confirm','Potwierdź wyjście'],['next','Następne zadanie','next'],['phrase-word','Wybierz słowo w zdaniu'],['phrase-remove','Usuń słowo'],['memory-digit','Wybierz cyfrę'],['memory-backspace','Usuń cyfrę']]);
const progress=['mode','collection','categories','achievements','previous','next','rules','rules-category','rule','filter','practice','dashboard'].map(id=>row('progress:'+id,({mode:'Wybierz tryb',collection:'Otwórz kolekcję',categories:'Kategorie do ćwiczenia',achievements:'Osiągnięcia',previous:'Poprzednie osiągnięcia',next:'Kolejne osiągnięcia',rules:'Otwórz zasady','rules-category':'Kategoria zasad',rule:'Otwórz zasadę słowa',filter:'Filtr kolekcji',practice:'Ćwiczymy',dashboard:'Wróć do wyników'})[id],['mode','filter','rules-category'].includes(id)?'toggle':id==='rule'?'hint':'tap'));
export const SOUND_EVENTS=[['roundStart','Początek rundy'],['correct','Poprawna odpowiedź'],['incorrect','Błędna odpowiedź'],['star','Combo / gwiazdka'],['roundEnd','Koniec rundy']].map(([id,label])=>row('event:'+id,label,id,'Zdarzenia gry'));
export function soundViewKey(id){return String(id||'home').replace(/-rule$/,'-results').replace(/-(correct|wrong|hint|pause)$/,'-initial');}
export function soundSlots(view){
 const id=soundViewKey(view?.id||view),screen=view?.screen;
 let rows=[];
 if(id==='players'||id==='players-empty')rows=player;
 else if(id==='player-create')rows=[...profile.filter(r=>['action:players','action:choose-avatar'].includes(r.key)),row('field:nickname','Pole imienia'),row('submit:player-create-form','Dalej · imię','next')];
 else if(id==='player-pin'||id==='player-unlock')rows=[...profile.filter(r=>r.key!=='action:choose-avatar'),...(id==='player-pin'?[row('control:profilePinMode','PIN / bez PIN-u','toggle','Ustawienia')]:[])];
 else if(id==='home')rows=[...['spelling','english','reading','flags','math'].map(mode=>row('action:choose-mode:'+mode,({spelling:'Ortografia',english:'Angielski',reading:'Czytanie',flags:'Flagi',math:'Matematyka'})[mode],'next')),...actions([['settings','Ustawienia'],['history','Moje wyniki']])];
 else if(id==='settings')rows=[...preferences,...['sound','animations','difficulty','category'].map(key=>row('control:'+key,({sound:'Włącz / wyłącz dźwięki',animations:'Animacje',difficulty:'Pokazuj trudność',category:'Pokazuj kategorie'})[key],'toggle','Ustawienia'))];
 else if(id.endsWith('-settings'))rows=[...actions([['home','Powrót']]),row('submit:setup-form','Rozpocznij rundę','next'),...['category','difficulty','duration','wordLimit','limitMode','dyktando','spellingScope','englishScope','readingScope','selectedDictationTag','englishEditAction'].map(key=>row('control:'+key,({category:'Kategoria',difficulty:'Trudność',duration:'Czas rundy',wordLimit:'Liczba słów',limitMode:'Czas / liczba słów',dyktando:'Dyktando',spellingScope:'Zakres ćwiczeń',englishScope:'Zakres ćwiczeń',readingScope:'Zakres czytania',selectedDictationTag:'Wybór dyktanda',englishEditAction:'Zatwierdź kategorie'})[key],'toggle','Ustawienia')),row('math:category','Wybierz dział matematyki','toggle','Ustawienia'),row('math:duration','Czas matematyki','toggle','Ustawienia'),row('math:start','Rozpocznij matematykę','next'),SOUND_EVENTS[0]];
 else if(id.endsWith('-initial')||screen==='game')rows=[...game,row('hint','Otwórz podpowiedź','hint'),row('hint-close','Zamknij podpowiedź'),row('continue','Przesuń do następnego zadania','next'),row('math:back','Powrót z matematyki'),row('math:retry','Spróbuj ponownie','next'),row('math:next','Następne zadanie','next'),row('math:explain','Obejrzyj wyjaśnienie','hint'),...SOUND_EVENTS.filter(r=>!['event:roundStart','event:roundEnd'].includes(r.key))];
 else if(id.endsWith('-results'))rows=[...actions([['again','Nowa runda','next'],['history','Moje wyniki'],['result-back','Wróć do ustawień'],['home','Ekran startowy'],['show-result-rule','Zasada słowa','hint'],['toggle-result','Rozwiń wynik','toggle']]),row('rule-close','Zamknij zasadę'),row('continue','Przesuń: nowa runda','next'),row('math:again','Nowa runda matematyki','next'),row('math:results','Wyniki matematyki'),row('math:back','Powrót do ustawień matematyki'),SOUND_EVENTS.at(-1)];
 else rows=[...actions([['home','Powrót do startu'],['return-results','Powrót do rundy']]),...progress,row('rule-close','Zamknij zasadę')];
 // Entries unique to another mode do not obscure the selected map card.
 rows=rows.filter(r=>id.startsWith('math-')?!r.key.startsWith('control:')&&!(r.key==='submit:setup-form'):!r.key.startsWith('math:'));
 if(id.endsWith('-settings')&&!id.startsWith('math-')){
  const extra=({spelling:['spellingCategory','dictationTag'],english:['englishCategories'],reading:['readingTraining'],flags:['flagGameType','flagScope','flagContinents','flagDifficulty','flagLanguage']})[id.split('-')[0]]||[];
  rows.push(...extra.map(key=>row('control:'+key,({spellingCategory:'Kategorie pisowni',dictationTag:'Rodzaj dyktanda',englishCategories:'Kategorie angielskiego',readingTraining:'Ćwiczenie czytania',flagGameType:'Wariant flag',flagScope:'Zasięg flag',flagContinents:'Kontynenty',flagDifficulty:'Trudność flag',flagLanguage:'Język flag'})[key],'toggle','Ustawienia')));
  rows=rows.filter(r=>!r.key.startsWith('control:')||!(/spelling|dyktando|dictation|wordLimit|limitMode/.test(r.key)&&!id.startsWith('spelling-')||/english/.test(r.key)&&!id.startsWith('english-')||/reading/.test(r.key)&&!id.startsWith('reading-')));
 }
 if(id.endsWith('-initial'))rows=rows.filter(r=>id.startsWith('reading-')||!r.key.startsWith('action:phrase-')&&!r.key.startsWith('action:memory-'));
 return [...new Map([...rows,...common].map(r=>[r.key,r])).values()];
}
export function soundInteraction(node){
 if(!node)return null;
 const d=node.dataset||{},tag=node.tagName?.toLowerCase();
 if(d.action)return row('action:'+d.action+(d.action==='choose-mode'&&d.mode?':'+d.mode:''),node.getAttribute?.('aria-label')||d.action);
 if(d.progress)return row('progress:'+d.progress,d.progress,['mode','filter','rules-category'].includes(d.progress)?'toggle':d.progress==='rule'?'hint':'tap');
 if(node.matches?.('.spelling-hint,[data-hint]'))return row('hint','Podpowiedź','hint');
 if(node.matches?.('.spelling-hint-close,.hint-dismiss,[data-close-hint]'))return row('hint-close','Zamknij podpowiedź');
 if(node.matches?.('.rule-close'))return row('rule-close','Zamknij zasadę');
 if(node.matches?.('.continue-handle,.spelling-continue-rail,.result-continue-rail'))return row('continue','Kontynuuj','next');
 if(d.start!==undefined)return row('math:start','Start','next');
 if(d.answer!==undefined)return row('action:answer','Odpowiedź');
 if(d.category!==undefined)return row('math:category','Dział','toggle');
 if(d.duration!==undefined)return row('math:duration','Czas','toggle');
 if(d.retry!==undefined)return row('math:retry','Spróbuj ponownie','next');
 if(d.nextQuestion!==undefined)return row('math:next','Dalej','next');
 if(d.explainStep!==undefined||node.matches?.('[data-demo]'))return row('math:explain','Wyjaśnienie','hint');
 if(node.id==='back')return row('math:back','Powrót');
 if(node.matches?.('.math-result-again'))return row('math:again','Nowa runda','next');
 if(node.matches?.('.math-result-history'))return row('math:results','Moje wyniki');
 if(tag==='summary')return row('summary','Rozwiń / zwiń','toggle');
 if(tag==='input'||tag==='select')return row((node.type==='text'?'field:':'control:')+(node.name||node.id||'input'),node.name||node.id||'Pole',node.type==='text'?'tap':'toggle');
 if(tag==='button'&&node.type==='submit')return row('submit:'+(node.form?.id||'form'),'Zatwierdź','next');
 return row('button',node.getAttribute?.('aria-label')||'Przycisk');
}
export function soundBinding(settings,view,slot){
 const key=soundViewKey(view),local=settings.bindings?.[key]?.[slot.key],global=settings.bindings?.['*']?.[slot.key];
 const base=soundSlots({id:key}).find(row=>row.key===slot.key);
 const fallback=slot.key.startsWith('event:')?null:slot.key.startsWith('control:')?'control':slot.key.startsWith('field:')?'field':'button';
 return {cue:base?.cue||slot.cue||'tap',volume:100,...(!base&&fallback?settings.bindings?.['*']?.[fallback]:{}),...(!base&&fallback?settings.bindings?.[key]?.[fallback]:{}),...global,...local};
}

export function soundSceneView(app){
 const d=app.dataset||{},mode=d.mode||'spelling';
 if(d.view==='game')return mode+'-initial';
 if(d.view==='wizard')return mode+'-settings';
 if(d.view==='results')return mode+'-results';
 if(d.view==='history')return ({dashboard:'progress',achievements:'trophies'})[d.historyState]||d.historyState||'progress';
 if(d.view==='player-pin'&&d.pinPurpose==='unlock')return 'player-unlock';
 if(d.view==='players')return app.querySelector?.('.player-card')?'players':'players-empty';
 return soundViewKey(d.view);
}
