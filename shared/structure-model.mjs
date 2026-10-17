// Shared, code-backed vocabulary for the library, view map and element inspector.
// Palettes are independent of families: a family is a complete view.
export const ATOMS={
 title:{name:'Tytuł ekranu',selector:'.page-head h1,.player-title h1',parents:['layout','profile','card'],role:'display',size:25,weight:700},
 subtitle:{name:'Podtytuł',selector:'.wizard-intro p,.result-subtitle,.player-title p',parents:['layout','card','profile'],role:'body',size:16,weight:600},
 section:{name:'Nagłówek sekcji',selector:'.rule-explanation h3,.progress-section-title',parents:['card','popup'],role:'ui',size:20,weight:800},
 numberText:{name:'Etykieta sekcji (tekst)',selector:'fieldset legend,.field-title',parents:['card'],role:'ui',size:20,weight:800},
 emphasis:{name:'Wyróżnik',selector:'.result-word,.collection-word-name',parents:['flashcard','card'],role:'display',size:24,weight:700},
 hint:{name:'Podpowiedź / treść zasady',selector:'.rule-explanation>p,.spelling-hint-description',parents:['popup','flashcard'],role:'body',size:17,weight:600},
 popupHeading:{name:'Nagłówek popupu',selector:'.result-rule-dialog h2,.spelling-hint-sheet h2,.pause-dialog h2',parents:['popup'],role:'display',size:24,weight:700},
 buttonLabel:{name:'Etykieta przycisku',selector:'.start-button,.player-continue,.result .primary,.math-start-button,.math-result-again',parents:['button'],role:'ui',size:24,weight:800}
};
const atom=(id,name,kind,selector,extra={})=>({id,name,kind,selector,level:'atom',children:[],...extra});
const group=(id,name,selector,children,extra={})=>({id,name,kind:'container',selector,children,level:'group',...extra});
export const PARTS=[
 atom('container-card','Kafel / podkład','container','.setup-card,.settings-card,.card',{block:'card'}),
 atom('icon-step-dot','Numer w kółku','icon','.step-dot'),
 group('family-player-empty','Pierwszy gracz','.player-shell-empty',['image-player-brand-art','container-player-title','image-player-empty-art','group-player-benefit','button-main','button-player-later'],{level:'family'}),
 group('group-player-benefit','Korzyści z profilu','.player-benefit',['icon-player-benefit-icon','text-player-copy']),
 atom('icon-player-benefit-icon','Ikona postępów gracza','icon','.player-benefit-icon'),
 atom('button-player-later','Kontynuuj jako gość','button','.player-later'),
 atom('image-player-brand-art','Logo Małej Nauki','image','.player-brand-art',{asset:'assets/brand/player-logo-3d.webp'}),
 atom('image-player-empty-art','Ilustracja pierwszego gracza','image','.player-empty-art img',{asset:'assets/brand/player-empty-3d.webp'}),
 atom('image-player-avatar-art','Avatar gracza','image','.player-avatar-art'),
 atom('image-mission','Ilustracja misji','image','[data-ds-recipe="image-mission"]',{variantAxis:'mode',modes:['spelling','math','english','flags','reading'],views:['spelling-settings','math-settings','english-settings','flags-settings','reading-settings']}),
 atom('text-mission-title','Tytuł misji','text','.mission-card h2'),
 atom('text-mission-hint','Opis misji','text','.mission-card p',{variantAxis:'mode',modes:['spelling','math','english','flags','reading']}),
 atom('image-mn-soap-picture','Zdjęcie w bańce','image','.mn-production-photo,.mn-soap-picture'),
 atom('image-home-logo-art','Logo na ekranie startowym','image','.home-logo-art',{asset:'assets/brand/home-mark.png'}),
 atom('background-home-art-backdrop','Tło scenariusza gry','background','.home-art-backdrop,.spelling-art-layer,.spelling-screen-bg'),
 atom('background-home','Tło ekranu startowego','background','.home-background'),
 atom('button-home-settings','Przycisk ustawień · wektor','button','.home-settings-button',{states:['default']}),
 atom('background-home-hero','Podkład powitania','background','.home-hero-backing'),
 atom('image-home-hero','Ilustracja odkrywcy','image','.home-hero-photo',{asset:'assets/brand/home-adventure-3d.webp'}),
 atom('text-home-greeting','Powitanie odkrywcy','text','.home-greeting-live'),
 atom('text-home-headline','Sprawdź swoje postępy','text','.home-headline'),
 atom('text-home-subtitle','Opis powitania','text','.home-hero-copy'),
 group('container-home-hero','Powitanie odkrywcy','.home-hero',['background-home-hero','image-home-hero','text-home-greeting','text-home-headline','text-home-subtitle']),
 group('family-home-welcome','Powitanie i postępy','.home-welcome',['container-home-hero','container-home-stats'],{level:'family'}),
 atom('text-home-adventure-title','Wybierz swoją przygodę','text','.home-adventures h2'),
 atom('text-home-mode-count','Liczba trybów','text','.home-adventures p'),
 group('container-home-adventures','Nagłówek przygód','.home-adventures',['text-home-adventure-title','text-home-mode-count']),
 group('family-home-modes','Pięć przygód','.home-game-buttons',['button-home-card'],{level:'family',repeats:{'button-home-card':['spelling','math','english','flags','reading']}}),
 atom('background-progress-collection','Ilustracja kolekcji','background','.progress-collection-art',{asset:'assets/progress/collection-v1.webp'}),
 atom('text-progress-collection','Moja kolekcja','text','.progress-collection-title'),
 group('container-progress-collection','Moja kolekcja','.progress-illustrated.collection',['background-progress-collection','text-progress-collection','icon-home-chevron'],{kind:'button'}),
 group('container-collection-filters','Filtry kolekcji','.collection-filters',['button-collection-filter']),
 atom('button-collection-filter','Filtr kolekcji','button','[data-progress=filter]',{states:['default','selected']}),
 group('container-collection-word','Słowo w kolekcji','.collection-word',['image-collection-word','text-collection-word','text-collection-state'],{kind:'button'}),
 atom('image-collection-word','Ilustracja słowa','image','.collection-word img'),
 atom('text-collection-word','Słowo','text','.collection-word strong'),
 atom('text-collection-state','Etap nauki słowa','text','.collection-word small'),
 group('container-collection-grid','Odkryte słowa','.collection-word-grid',['container-collection-word']),
 group('family-collection','Kolekcja słów','.collection-content',['container-collection-filters','container-collection-grid'],{level:'family'}),
 group('control-jelly','Przełącznik jelly','.ds-jelly:not(.pin-mode),.jelly-v4-container:not(.pin-mode)',['jelly-option'],{kind:'toggle',block:'jelly'}),
 group('control-pin','PIN / bez PIN-u','.pin-mode',['pin-option'],{kind:'toggle',inherits:'control-jelly',sample:'pin'}),
 group('control-toggle','Przełącznik czasu / słów','.compact-toggle',['jelly-option'],{kind:'toggle',block:'toggle'}),
 atom('jelly-option','Opcja jelly','text','.ds-jelly:not(.pin-mode)>label,.jelly-v4-container:not(.pin-mode)>label,.jelly-v4-label:not(.pin-mode>label),.category-card,.math-duration-choice',{states:['default','selected','dragging','disabled']}),
 atom('pin-option','Opcja PIN','text','.pin-mode label',{inherits:'jelly-option'}),
 atom('control-pin-key','Klawisz klawiatury PIN','key','.pin-key',{inherits:'button-main',sample:'key'}),
 atom('icon-pin-dot','Cyfra PIN · wskaźnik','icon','.pin-dots>span'),
 atom('input-player-name','Pole imienia','input','.player-name-input',{sample:'input'}),
 atom('button-main','Przycisk główny','button','.primary,.start-button,.player-continue,.math-start-button',{block:'button'}),
 atom('button-game-start','Rozpocznij przygodę','button','.start-button,.math-start-button',{inherits:'button-main',states:['default','pressed','disabled']}),
 atom('button-answer','Odpowiedź','button','.answer,.math-answer',{block:'answer'}),
 group('button-avatar-choice','Wybór avatara','.avatar-choice',['image-player-avatar-art'],{kind:'button',inherits:'button-main'}),
 group('button-player-card','Karta wyboru gracza','.player-card',['image-player-avatar-art','text-nickname','icon-player-select'],{kind:'button',sample:'player',states:['default','selected','disabled']}),
 atom('icon-player-select','Znacznik wybranego gracza','icon','.player-select-mark'),
 group('button-home-card','Kafel trybu gry','[data-action=choose-mode]',['icon-home-tile-surface','container-home-decoration','container-home-badge','text-mode-name'],{kind:'button',variantAxis:'mode',modes:['spelling','math','english','flags','reading'],states:['default','pressed']}),
 atom('icon-home-tile-surface','Podkład kafla trybu','icon','.home-tile-surface'),
 group('container-home-decoration','Dekoracje tła','.home-tile-decoration',['icon-home-decoration-star','icon-home-decoration-plus','icon-home-decoration-rays','icon-home-decoration-cloud','icon-home-decoration-mountains']),
 atom('icon-home-decoration-star','Gwiazda dekoracyjna','icon','[data-ds-key="home-spelling-star"],[data-ds-key^="home-reading-star-"]'),
 atom('icon-home-decoration-plus','Plus dekoracyjny','icon','[data-ds-key^="home-math-plus-"]'),
 atom('icon-home-decoration-rays','Promienie · angielski','icon','[data-ds-key="home-english-rays"]'),
 atom('icon-home-decoration-cloud','Chmurka · angielski','icon','[data-ds-key="home-english-cloud"]'),
 atom('icon-home-decoration-mountains','Góry · flagi','icon','[data-ds-key="home-flags-mountains"]'),
 group('container-home-badge','Ikona i podkład','.home-mode-badge',['icon-home-badge-surface','icon-home-mode-glyph','text-home-mode-symbol']),
 atom('icon-home-badge-surface','Podkład ikony trybu','icon','.home-badge-surface'),
 atom('icon-home-mode-glyph','Symbol trybu · wektor','icon','.home-mode-glyph'),
 atom('text-home-mode-symbol','Symbol trybu · tekst','text','.home-mode-symbol'),
 group('container-home-stats','Moje postępy','.home-stats',['background-home-stats-outer','background-home-stats-inner','container-home-stat','background-home-stat-divider','container-home-last']),
 atom('background-home-stats-outer','Podkład wyników · zewnętrzny','background','.home-stats-outer'),
 atom('background-home-stats-inner','Podkład wyników · wewnętrzny','background','.home-stats-inner'),
 group('container-home-stat','Dziś rozwiązane','.home-stat-today',['icon-home-target','text-home-stat-value','text-home-stat-label']),
 group('container-home-last','Ostatni wynik i moje wyniki','.home-stat-last',['icon-home-star','text-home-stat-value','text-home-stat-label','button-home-progress']),
 atom('icon-home-target','Tarcza ze strzałą','icon','[data-ds-recipe="icon-home-target"]'),
 atom('icon-home-star','Złota gwiazda','icon','[data-ds-recipe="icon-home-star"]'),
 atom('background-home-stat-divider','Kreska między wynikami','background','.home-stat-divider'),
 atom('text-home-stat-value','Wartość wyniku','text','.home-stat-value'),
 atom('text-home-stat-label','Opis wyniku','text','.home-stat-label'),
 atom('text-mode-name','Nazwa trybu gry','text','.home-tile-name'),
 atom('icon-home-chevron','Chevron · moje wyniki','icon','[data-ds-key=home-arrow-icon]'),
 atom('button-home-progress','Przycisk wyników','button','.home-progress-arrow',{inherits:'button-main'}),
 atom('button-back','Powrót · koło i strzałka','button','.navigation-back',{states:['default']}),
 atom('text-player-title','Tytuł wyboru gracza','text','.player-title h1'),
 atom('text-nickname','Imię gracza','text','.player-card strong,.pin-profile h2'),
 atom('text-pin-instruction','Instrukcja PIN','text','.pin-instruction'),
 atom('text-player-copy','Opis profilu','text','.player-title p,.player-form-card>p,.pin-fields>p'),
 atom('text-field-label','Etykieta pola','text','label[for=player-nickname],.avatar-label'),
 atom('text-nickname-help','Opis poprawności imienia','text','.nickname-help'),
 atom('text-result-detail-title','Tytuł odpowiedzi rundy','text','.result-detail-head strong'),
 atom('text-result-detail-description','Opis odpowiedzi rundy','text','.result-detail-head p'),
 atom('text-result-title','Tytuł podsumowania','text','.result-title-wrap h1'),
 atom('text-result-subtitle','Opis podsumowania','text','.result-heading>p,.result-subtitle'),
 atom('text-result-score','Liczba odpowiedzi','text','.round-score'),
 atom('icon-result-rays-left','Promienie podsumowania · lewo','icon','.result-rays-left'),
 atom('icon-result-rays-right','Promienie podsumowania · prawo','icon','.result-rays-right'),
  atom('text-pin-error','Komunikat PIN','text','.pin-error-outside'),
 group('container-math-duration-setup','Ustawienia czasu matematyki','.math-duration-setup',['button-math-duration']),
 group('group-math-categories','Kategorie matematyki','.category-grid',['button-math-category']),
 atom('button-math-duration','Wybór czasu rozgrywki','button','.math-duration-choice',{states:['default','selected'],inherits:'button-main'}),
 atom('button-math-category','Wybór rodzaju działań','button','.category-card',{states:['default','selected'],inherits:'button-main'}),
 atom('text-math-setup-title','Tytuł matematyki','text','[data-ds-recipe="text-math-setup-title"]'),
 group('group-spelling-hud','Nagłówek gry · czas i nawigacja','.game-bar',['button-spelling-exit','container-spelling-clock','button-spelling-pause']),
 atom('button-spelling-exit','Zakończ rundę','button','.game-bar [data-action=exit]',{inherits:'button-back'}),
 atom('button-spelling-pause','Wstrzymaj grę','button','.game-bar [data-action=pause]',{inherits:'button-back'}),
 group('container-spelling-clock','Czas i postęp rundy','.time-block',['text-game-clock','meter-round-progress-fill']),
 atom('text-game-clock','Pozostały czas / pytania','text','.time-block .timer'),
 atom('text-spelling-title','Tytuł pytania','text','.spelling-title'),
 group('container-spelling-visual','Scena ilustracji ortografii','.spelling-visual',['image-spelling-scene']),
 atom('image-spelling-scene','Obraz słowa / bańka','image','.spelling-visual',{variantAxis:'state',states:['default','correct','wrong']}),
 group('group-spelling-question','Karta pytania','.spelling-question-card',['container-spelling-word']),
 group('container-spelling-word','Zawartość słowa','.question-content',['text-spelling-word']),
 group('group-spelling-answers','Dwa pola odpowiedzi','.answers.count-2',['button-answer']),
 group('group-spelling-actions','Podpowiedź i przejście dalej','.spelling-action-row',['button-game-hint','container-result-continue-rail']),
 atom('text-spelling-feedback','Komunikat poprawnej odpowiedzi','text','.feedback'),
 atom('text-spelling-word','Treść pytania ortografii','text','.question-content>.word'),
 atom('result-points-bubble','Bańka punktów','container','.result-points-bubble'),
 group('container-player-title','Powitanie gracza','.player-title',['text-player-title','text-player-copy']),
 group('container-player-grid','Lista graczy','.player-grid',['button-player-card']),
 group('container-player-form-card','Formularz nowego gracza','.player-form-card',['image-player-avatar-art','text-player-form-title','text-player-copy','container-player-form'],{level:'family'}),
 atom('text-player-form-title','Tytuł nowego gracza','text','.player-form-card>h2'),
 group('container-player-form','Dane nowego gracza','#player-create-form',['text-field-label','input-player-name','text-nickname-help','container-avatar-picker','button-main']),
 group('container-avatar-picker','Lista avatarów','.avatar-picker',['button-avatar-choice']),
 group('container-pin-profile','Profil nad PIN-em','.pin-profile',['image-player-avatar-art','text-nickname']),
 group('container-pin-dots','Wpisane cyfry PIN','.pin-dots',['icon-pin-dot']),
 group('container-pin-keypad','Klawiatura PIN','.pin-keypad',['control-pin-key']),
 group('container-pin-fields','PIN / informacja bez PIN-u','.pin-fields',['text-pin-instruction','text-player-copy','container-pin-dots','container-pin-keypad','button-main'],{states:['default','pin','no-pin']}),
 group('container-pin-card','Kafel ustawienia PIN-u','.pin-card',['container-pin-profile','control-pin','container-pin-fields'],{level:'family',states:['default','pin','no-pin']}),
 group('container-field-title','Numer + tekst','.field-title,fieldset legend',['icon-step-dot','text-field-label']),
 group('container-mission','Kafel misji','.wizard-intro',['image-mission','text-mission-title','text-mission-hint']),
 group('family-education-popup','Edukacyjne okno dialogowe','.spelling-hint-sheet,.result-rule-dialog,#modal',['group-popup-head','text-popup-title','text-popup-copy','button-popup-close','button-main']),
 group('group-popup-head','Nagłówek dialogu','.hint-sheet-head,.rule-dialog-head',['text-popup-title','button-popup-close']),
 atom('button-popup-close','Zamknij okno','button','.hint-dismiss,.rule-close',{inherits:'button-back'}),
 atom('text-popup-title','Tytuł podpowiedzi / zasady','text','.spelling-hint-sheet h2,.result-rule-dialog h2,#modal h2'),
 atom('text-popup-copy','Treść podpowiedzi / zasady','text','.spelling-hint-sheet p,.rule-explanation>p,#modal>p'),
 atom('text-popup-badge','Typ wyjaśnienia','text','.rule-type'),
 group('container-rule-visual','Obraz zasady','.rule-visual',[]),
 group('group-rule-scroll','Przewijane wyjaśnienie','.rule-dialog-scroll',['group-rule-explanation']),
 group('group-rule-explanation','Treść zasady','.rule-explanation',['text-popup-title','text-popup-copy']),
 group('family-spelling-results','Podsumowanie ortografii','.result.learning-result',['button-back','container-result-points','group-result-sheet'],{level:'family'}),
 group('container-result-points','Zdobyte punkty','.result-points-bubble',['text-result-points']),
 atom('text-result-points','Liczba zdobytych punktów','text','.result-points-core strong'),
 group('group-result-sheet','Arkusz wyników','.result-sheet',['group-result-heading','container-result-summary','group-result-stats','group-result-details','container-result-continue-rail','button-main']),
 group('group-result-heading','Nagłówek wyniku','.result-heading',['text-result-heading','text-result-intro']),
 atom('text-result-heading','Tytuł wyniku','text','.result-heading h1'),
 atom('text-result-intro','Pochwała wyniku','text','.result-heading>p'),
 group('group-result-stats','Statystyki utrwalone/powtórka','.learning-stats-two',['container-result-stat']),
 group('group-result-details','Dwa panele szczegółów','.result-details',['group-result-panel']),
 group('group-result-panel','Szczegóły kategorii','.result-detail',[]),
 group('container-result-line','Wynik i procent','.round-summary-line',['text-result-score','text-result-mode','text-progress-value']),
 group('container-result-summary','Podsumowanie rundy','.round-summary',['container-result-line','container-round-progress'],{level:'family'}),
 group('container-result-details','Odpowiedzi rundy','.result-details',['container-result-review'],{level:'family'}),
 group('container-result-review','Do powtórki','.result-detail.is-review',['text-result-detail-title','text-result-detail-description']),
 group('container-result-header','Powitanie po rundzie','.result-heading',['text-result-title','text-result-subtitle','icon-result-rays-left','icon-result-rays-right']),
 group('container-result-stat','Etap nauki','.result-stat',['icon-result-stat','text-result-stat','icon-result-sprig'],{kind:'button',states:['default','selected']}),
 atom('icon-result-stat','Symbol etapu nauki','icon','.result-stat-icon'),
 atom('text-result-stat','Wartość i nazwa etapu','text','.result-stat-copy'),
 atom('icon-result-sprig','Gałązka etapu nauki','icon','.result-sprig'),
 atom('text-result-mode','Tryb ukończonej rundy','text','.round-mode-pill'),
 group('container-setting-field','Pole ustawień','fieldset[class*=v2-section]',['container-field-title','control-jelly']),
 group('group-spelling-scope','Zakres słów w ortografii','.spelling-v2-section:has([data-segmented=scope])',['control-jelly']),
 group('group-spelling-level','Poziom słów w ortografii','.spelling-v2-section:has([data-segmented=level])',['control-jelly']),
 group('group-spelling-round','Czas lub liczba słów','.spelling-round-section',['control-jelly']),
 group('container-setup-form','Konfiguracja przygody','.setup-form',['container-card','container-setting-field','text-wizard-note','button-game-start'],{level:'family'}),
 atom('text-wizard-note','Wskazówka pod konfiguracją','text','.wizard-note'),
 atom('button-game-hint','Podpowiedź w grze','button','.spelling-hint',{states:['default','pressed','disabled']}),
 group('container-result-continue-rail','Slider akcji','.result-continue-rail,.spelling-continue-rail',['icon-continue-handle','text-continue-copy'],{block:'slider'}),
 atom('icon-continue-handle','Uchwyt slidera','icon','.continue-handle'),
 atom('text-continue-copy','Etykieta slidera','text','.continue-copy'),
 group('container-round-progress','Postęp','.round-progress,.math-round-progress',['meter-round-progress-fill'],{block:'progress'}),
 atom('meter-round-progress-fill','Wypełnienie postępu','meter','.round-progress-fill'),
 atom('text-progress-value','Wartość postępu','text','[data-reel=percent]')
];
// The new view families retain the established shared recipe cascade.
PARTS.push(
 group('container-game-content','Treść pytania','.question-content',[]),
 group('family-game-setup','Ustawienia przygody','#setup-form',['container-card','button-game-start'],{level:'family',inherits:'container-setup-form'}),
 group('family-game-question','Pytanie w grze','.question-card',['container-game-content'],{level:'family',inherits:'container-card'}),
 atom('text-mission-copy','Opis misji','text','.wizard-intro p',{inherits:'text-mission-hint',variantAxis:'mode',modes:['english','flags','reading']})
);
PARTS.push(
 atom('image-reward-sprite','Puchar lub medal z atlasu','image','.reward-sprite',{states:['default','growing','earned']}),
 atom('icon-power','Symbol mocy','icon','.power-icon'),
 atom('meter-power-charge','Miernik naładowania mocy','meter','.power-charge progress'),
 atom('text-power-title','Nazwa mocy','text','.power-card h3'),atom('text-power-copy','Opis mocy','text','.power-card p'),
 atom('button-forge','Wykuj moc','button','[data-progress="forge-power"]',{inherits:'button-main',states:['default','disabled']}),
 atom('button-trophy-choice','Trwały wybór pucharu','button','[data-progress="trophy-base"],[data-progress="trophy-choice"]',{inherits:'button-main'}),
 group('container-power-card','Karta mocy','.power-card',['icon-power','text-power-title','text-power-copy','button-forge'],{inherits:'container-card'}),
 group('group-powers','Karty mocy','.power-grid',['container-power-card']),
 group('group-power-meter','Energia mocy','.power-charge',['meter-power-charge']),
 group('family-forge','Kuźnia mocy','.journey-forge',['group-power-meter','group-powers'],{level:'family'}),
 group('group-trophy-evolution','Rozwój pucharu','.trophy-evolution',['image-reward-sprite','button-trophy-choice']),
 atom('text-medal-title','Nazwa medalu','text','.medal-card h3'),atom('text-medal-copy','Postęp medalu','text','.medal-card p'),
 group('container-medal','Medal za zadanie','.medal-card',['image-reward-sprite','text-medal-title','text-medal-copy']),
 group('group-medals','Medale z przygód','.medal-grid',['container-medal']),
 group('family-awards','Puchary i medale','.journey-awards',['group-trophy-evolution','group-medals'],{level:'family'}),
 atom('image-rule-hero','Ilustracja reguły','image','.rule-hero img'),atom('text-rule-example','Przykład reguły','text','.rule-examples-grid > span'),
 group('group-rule-examples','Przykłady reguły','.rule-examples-grid',['text-rule-example']),
 group('group-rule-body','Treść karty reguły','.rule-dialog-copy',['group-rule-examples']),
 group('family-rule-card-dialog','Okno karty reguły','.learning-rule-dialog',['image-rule-hero','group-rule-body','button-popup-close'],{level:'family',inherits:'family-education-popup'}),
 group('family-round-rewards','Odkrycia i nagrody po rundzie','.round-rewards',[],{level:'family'}),
 group('group-power-game-hud','Moc i combo w grze','.power-game-hud',[])
);
for(const [id,name]of Object.entries({
 'text-forge-title':'Tytuł kuźni','text-forge-description':'Opis kuźni','text-forge-wallet':'Portfel iskier','text-forge-note':'Zasady mocy','text-forge-feedback':'Potwierdzenie wykucia',
 'text-power-meter-title':'Tytuł energii','text-power-meter-value':'Wartość energii','text-power-meter-copy':'Opis ładowania','text-power-tier':'Rzadkość mocy','text-power-owned':'Posiadana moc',
 'text-awards-heading':'Tytuł pucharów','text-awards-copy':'Opis pucharów','text-trophy-name':'Nazwa pucharu','text-trophy-status':'Postęp pucharu','text-trophy-milestone':'Próg osiągnięcia','text-trophy-choice-title':'Nagłówek trwałego wyboru','text-trophy-choice-label':'Nazwa ozdoby','text-trophy-permanent':'Informacja o trwałości wyboru',
 'text-medals-title':'Tytuł medali','text-goals-title':'Tytuł osiągnięć','text-achievement-goal':'Cel osiągnięcia','text-achievement-progress':'Postęp osiągnięcia','text-rule-heading':'Tytuł reguły','text-rule-explanation':'Wyjaśnienie reguły',
 'text-card-stars':'Gwiazdka karty','text-hud-sparks':'Iskry podczas rundy','text-hud-combo':'Mnożnik combo','text-hud-power':'Aktywna moc'
}))PARTS.push(atom(id,name,'text','[data-ds-recipe="'+id+'"]'));
PARTS.push(group('group-trophy-milestones','Etapy pucharu','.trophy-milestones',['text-trophy-milestone']),group('group-achievement-goals','Cele kolekcji','.achievement-goals',['container-achievement-goal']),group('container-achievement-goal','Cel i licznik','[data-goal]',['text-achievement-goal','text-achievement-progress']));
PARTS.push(
 atom('image-gallery-art','Ilustracja kuźni, podium lub prezentu','image','.forge-emblem,.trophy-podium,.trophy-gift,.award-mystery,.power-icon'),
 atom('button-award-tab','Przełącznik medali i pucharów','button','[data-progress=award-tab]',{inherits:'button-main'}),
 atom('button-trophy-upgrade','Odkryj ulepszenie pucharu','button','[data-progress=trophy-upgrade]',{inherits:'button-main',states:['default','disabled']}),
 atom('button-trophy-select','Wybierz puchar na podium','button','[data-progress=trophy-select]',{inherits:'button-main'}),
 group('group-award-switch','Medale i puchary','.award-switch',['button-award-tab']),
 group('group-trophy-stage','Podium z pucharem','.trophy-stage',['image-gallery-art','image-reward-sprite']),
 group('group-trophy-selector','Pasek pucharów','.trophy-selector',['button-trophy-select']),
 group('group-award-progress','Droga do nagrody','.award-progress',['meter-power-charge','text-achievement-progress']),
 group('family-trophy-dialog','Niespodzianka: trwały wybór','.trophy-upgrade-dialog',['button-trophy-choice','button-popup-close'],{level:'family',inherits:'family-education-popup'})
);
const explicitUses={'text-pin-error':['player-pin','player-unlock'],'text-math-setup-title':['math-settings'],'text-spelling-word':['spelling-initial','spelling-correct','spelling-wrong'],'button-game-hint':['spelling-initial','spelling-correct','spelling-wrong'],'jelly-option':['spelling-settings','english-settings','flags-settings','reading-settings','math-settings']};
for(const [id,views]of Object.entries(explicitUses)){const p=PARTS.find(p=>p.id===id);if(p)p.views=views;}
export const PART_BY_ID=Object.fromEntries(PARTS.map(p=>[p.id,p]));
export function recipeLineage(id){const chain=[],seen=new Set();while(id&&!seen.has(id)){seen.add(id);chain.unshift(id);id=PART_BY_ID[id]?.inherits;}return chain;}
export const LEVEL_NAMES={atom:'Atom',group:'Grupa · molekuła',family:'Rodzina · organizm',template:'Szablon',page:'Widok · strona'};
const types={login:['image-player-brand-art','image-player-empty-art','container-player-title','container-player-grid','button-main'],create:['button-back','container-player-form-card'],pin:['button-back','container-pin-card'],profile:['container-pin-profile','container-avatar-picker','control-pin','button-main'],home:['background-home','image-home-logo-art','button-home-settings','family-home-welcome','container-home-adventures','family-home-modes'],settings:['button-back','container-mission','container-card','container-field-title','control-jelly','button-game-start'],game:['background-home-art-backdrop','image-mn-soap-picture','button-answer','container-round-progress'],results:['background-home-art-backdrop','container-result-header','container-result-summary','container-result-stat','container-result-details','container-result-continue-rail','button-main','button-back','result-points-bubble'],collection:['button-back','family-collection'],progress:['button-back','container-progress-collection','container-card','container-round-progress']};
export function viewType(view){if(view?.id==='collection'||view?.state==='collection')return 'collection';const s=view?.screen||view?.id||'';return s==='players'?'login':s==='player-create'?'create':s==='player-pin'?'pin':s==='home'?'home':s==='settings'?'profile':s==='wizard'||view?.id?.endsWith('-settings')?'settings':s==='results'?'results':s==='game'?'game':'progress';}
export function partLevel(item,items=[]){return item.level||PART_BY_ID[item.recipe]?.level||(item.kind==='button'&&items.filter(n=>n.parent===item.id).length>1?'group':null)||(['button','key','input','toggle','text','icon','image','background','timer','meter'].includes(item.kind)?'atom':items.some(n=>n.parent===item.id)?'group':'atom');}
export function viewParts(view,inventory){
 const items=inventory?.items||[];
 if(items.length){const ids=new Set(items.map(n=>n.id));return items.filter(n=>n.id!=='layout-root'&&(!n.parent||n.parent==='layout-root'||!ids.has(n.parent))).map(n=>inventoryPart(n,items));}
 return (types[viewType(view)]||[]).map(id=>definitionPart(id));
}
export function definitionPart(id,seen=new Set()){const p=PART_BY_ID[id];if(!p||seen.has(id))return null;const next=new Set(seen).add(id);return {...p,recipe:p.id,children:p.children.map(child=>definitionPart(child,next)).filter(Boolean)};}
function inventoryPart(item,items,seen=new Set()){if(seen.has(item.id))return null;const next=new Set(seen).add(item.id),meta=PART_BY_ID[item.recipe];return {id:item.id,recipe:item.recipe||item.kind||'container',name:meta?.name||item.label,kind:item.kind,level:partLevel(item,items),selector:`[data-ds-element="${item.id}"]`,children:items.filter(n=>n.parent===item.id).map(n=>inventoryPart(n,items,next)).filter(Boolean)};}
export function structureCatalog(registry,inventories=new Map()){
 const records=new Map(PARTS.map(p=>[p.id,{...p,children:[...p.children],uses:[]} ]));
 const add=(p,view)=>{let record=records.get(p.recipe);if(!record){record={id:p.recipe,name:p.name,recipe:p.recipe,kind:p.kind,selector:p.selector,level:p.level,children:[],uses:[],discovered:true};records.set(p.recipe,record);}if(!record.uses.some(u=>u.view===view.id))record.uses.push({view:view.id,selector:p.selector});for(const child of p.children){if(record.level!=='atom'&&!record.children.includes(child.recipe))record.children.push(child.recipe);add(child,view);}};
 for(const view of registry.views)for(const p of viewParts(view,view.id==='home'?null:inventories.get(view.id)))add(p,view);
 for(const p of records.values())if(p.views)p.uses=p.views.map(view=>({view,selector:p.selector}));
 const textAtoms=Object.entries(ATOMS).map(([id,a])=>({id:'text-role-'+id,name:a.name,atom:id,kind:'text',level:'atom',selector:a.selector,children:[],uses:registry.views.filter(v=>a.parents.some(p=>v.components.includes(p))).map(v=>({view:v.id,selector:a.selector}))}));
 return [...records.values(),...textAtoms,...templateCatalog(registry,inventories),...registry.views.map(view=>({id:'view:'+view.id,name:view.name,level:'page',view:view.id,template:templateForView(view).id,children:viewParts(view,view.id==='home'?null:inventories.get(view.id)).map(p=>p.recipe),uses:[{view:view.id}]}))];
}
export function selectionStack(view,selected,items){if(!selected)return[];const chain=[],seen=new Set();let item=items.find(n=>n.id===selected.id)||selected;while(item&&!seen.has(item.id)){seen.add(item.id);if(item.id!=='layout-root')chain.unshift({...item,level:partLevel(item,items)});item=items.find(n=>n.id===item.parent);}return [{id:'view:'+view.id,label:view.name,level:'page'},...chain];}

export const GAME_MODES={spelling:'Ortografia',math:'Matematyka',english:'Angielski',flags:'Flagi',reading:'Czytanie'};
const contentModes=new Set(['container-home-decoration','container-home-badge','icon-home-tile-surface','icon-home-badge-surface','icon-home-mode-glyph','text-home-mode-symbol','text-mode-name','container-mission']);
export function partVariants(part){
 if(part?.variantAxis==='mode'||contentModes.has(part?.id))return {axis:'mode',label:'Tryb',choices:Object.fromEntries((part.modes||Object.keys(GAME_MODES)).map(id=>[id,GAME_MODES[id]])),defaultMode:part.modes?.[0]||'spelling'};
 if(['button','answer','jelly','toggle','slider'].includes(part?.block))return {axis:'palette',label:'Paleta',choices:{default:'Domyślny',...GAME_MODES},defaultMode:'default'};
 return {axis:'default',label:'Wariant',choices:{default:'Domyślny'},defaultMode:'default'};
}
export function partStates(part){return part?.states||({jelly:['default','selected','dragging','disabled'],toggle:['default','selected'],button:['default','pressed','disabled'],answer:['default','correct','wrong','disabled'],slider:['default','dragging','spring-back','complete'],progress:['default','complete']})[part?.block]||['default'];}
export const PAGE_TEMPLATES=Object.fromEntries(Object.entries(types).map(([id,children])=>[id,{id:'template:'+id,name:({home:'Ekran startowy',login:'Wybór gracza',create:'Tworzenie gracza',pin:'PIN',profile:'Ustawienia profilu',settings:'Ustawienia przygody',game:'Gra',results:'Wynik rundy',progress:'Moje wyniki',collection:'Kolekcja słów'})[id],level:'template',slots:children.map((recipe,index)=>({id:recipe,recipe,order:index,optional:id!=='home'})),children}]));
export function templateForView(view){return PAGE_TEMPLATES[viewType(view)];}
export function templateCatalog(registry){return Object.values(PAGE_TEMPLATES).map(t=>({...t,uses:registry.views.filter(v=>templateForView(v).id===t.id).map(v=>({view:v.id})),view:registry.views.find(v=>templateForView(v).id===t.id)?.id}));}
export function composeTemplate(id,slots){const template=PAGE_TEMPLATES[id];if(!template)throw Error('Nieznany szablon: '+id);return template.slots.map(s=>{if(!s.optional&&!slots[s.id])throw Error('Brak slotu: '+s.id);return slots[s.id]||'';}).join('');}

// Content-dependent children are alternatives, not extra invisible layers.
export function partChildren(part,mode='default'){
 if(part?.id==='container-home-decoration')return {spelling:['icon-home-decoration-star'],math:['icon-home-decoration-plus'],english:['icon-home-decoration-rays','icon-home-decoration-cloud'],flags:['icon-home-decoration-mountains'],reading:['icon-home-decoration-star']}[mode]||part.children;
 if(part?.id==='container-home-badge')return ['icon-home-badge-surface',...(['spelling','math'].includes(mode)?['text-home-mode-symbol']:['icon-home-mode-glyph'])];
 return part?.children||[];
}
