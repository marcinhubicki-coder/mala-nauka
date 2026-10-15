// Source-owned mount bindings. These selectors name components in the real
// renderers; they never classify arbitrary DOM or derive identities from shape.
const b=(id,recipe,kind,parent,selector,extra={})=>({id,recipe,kind,parent,selector,level:kind==='container'?'group':'atom',...extra});
const group=(id,recipe,parent,selector,extra={})=>b(id,recipe,'container',parent,selector,extra);
const text=(id,parent,selector,extra={})=>b(id,'text-'+id,'text',parent,selector,extra);
const button=(id,recipe,parent,selector,action,extra={})=>b(id,recipe,'button',parent,selector,{action,...extra});
const optional={optional:true};
const repeat=(id,recipe,kind,parent,selector,key,extra={})=>b(id,recipe,kind,parent,selector,{repeatKey:key,min:0,...extra});
const within=(id,recipe,kind,parent,selector,extra={})=>b(id,recipe,kind,parent,selector,{within:parent,...extra});
const progressAction={actionAttribute:'data-progress'};
const header=(parent='layout-root',backAction='home')=>[
 button('page-back','button-back',parent,'.navigation-back',backAction,{actionAttribute:'data-action',actions:['home','return-results','dashboard'],optional:false}),
 text('page-title',parent,'h1')
];

const players=[
 group('player-shell','family-player-list','layout-root','.player-shell',{level:'family'}),
 b('player-brand-art','image-player-brand-art','image','player-shell','.player-brand-art'),
 group('player-title','container-player-title','player-shell','.player-title'),
 b('player-heading','text-player-title','text','player-title','.player-title h1'),b('player-subtitle','text-player-copy','text','player-title','.player-title p'),
 group('player-grid','container-player-grid','player-shell','.player-grid'),
 repeat('profile','button-player-card','button','player-grid','.player-card','data-player',{min:1,max:3,action:'choose-player',level:'group'}),
 within('profile-avatar','image-player-avatar-art','image','profile','.player-avatar-art'),
 within('profile-name','text-nickname','text','profile',':scope > strong'),
 within('profile-selected','icon-player-select','icon','profile','.player-select-mark'),
 group('player-actions','group-player-actions','player-shell','.player-actions'),
 button('player-add','button-main','player-actions','[data-action="add-player"]','add-player',optional),
 button('player-continue','button-main','player-actions','[data-action="continue-player"]','continue-player')
];
const settings=[...header(),group('settings-screen','family-settings','layout-root','.settings-screen',{level:'family'}),
 ...['profile','media','information','data'].flatMap((name,i)=>[
  group('settings-'+name,'group-settings-'+name,'settings-screen',`.settings-group:nth-of-type(${i+1})`),
  text('settings-'+name+'-title','settings-'+name,`.settings-group:nth-of-type(${i+1}) > h2`),
  group('settings-'+name+'-card','container-card','settings-'+name,`.settings-group:nth-of-type(${i+1}) > .settings-card`)
 ]),
 b('settings-avatar','image-player-avatar-art','image','settings-profile-card','.settings-avatar'),
 text('settings-nickname','settings-profile-card','.settings-profile-main strong'),
 text('settings-profile-description','settings-profile-card','.settings-profile-main small'),
 ...['edit-profile','switch-player','add-player','enable-pin','disable-pin','delete-profile'].map(action=>button('settings-'+action,'button-local','settings-profile-card',`[data-action="${action}"]`,action,optional)),
 ...['sound','animations','difficulty','category'].flatMap((id,i)=>{
  const parent='settings-'+(i<2?'media':'information')+'-card';
  return [b('settings-'+id,'control-toggle','toggle',parent,`label[for="${id}"]`,{level:'group'}),
   text('settings-'+id+'-title','settings-'+id,`label[for="${id}"] strong`),
   text('settings-'+id+'-copy','settings-'+id,`label[for="${id}"] small`)];
 }),
 text('settings-backup-title','settings-data-card','.settings-data-head strong'),
 text('settings-backup-copy','settings-data-card','.settings-data-head small'),
 ...['export-backup','import-backup','clear'].map(action=>button('settings-'+action,'button-local','settings-data-card',`[data-action="${action}"]`,action)),
 text('settings-backup-status','settings-data-card','#backup-status'),text('settings-offline-status','settings-data-card','#offline-status'),
 text('settings-caption','settings-screen','.settings-screen > .caption')
];

function wizard(mode){
 const prefix=mode==='flags'?'flag':mode,section=mode==='reading'?'.reading-v2-section':'.'+prefix+'-v2-section';
 const rows=[...header(),group('mission','container-mission','layout-root','.wizard-intro'),
  b('mission-illustration','image-mission','image','mission','.mission-illustration'),
  text('mission-title','mission','.wizard-intro h2'),text('mission-copy','mission','.wizard-intro p'),
  group('setup-form','family-game-setup','layout-root','#setup-form',{level:'family'}),
  group('setup-card','container-card','setup-form','.setup-card'),
  text('wizard-note','setup-form','.wizard-note'),text('setup-error','setup-form','#setup-error'),
  button('setup-start','button-game-start','setup-form','.start-button','submit-setup',{actionAttribute:'submit'})];
 const kinds=mode==='english'?['scope','level','time']:mode==='reading'?['training','level','time']:['game','scope','time'];
 for(const [i,kind] of kinds.entries()){
  const selector=`${section}:nth-of-type(${i+1})`,id='setup-'+kind;
  rows.push(group(id,'group-setup-'+kind,'setup-card',selector),text(id+'-label',id,selector+' > legend'),
   b(id+'-jelly','control-jelly','toggle',id,selector+' [data-segmented="'+kind+'"]',{level:'group'}),
   repeat(id+'-option','jelly-option','text',id+'-jelly',selector+' [data-segmented="'+kind+'"] > label','input@value',{min:2,max:8}));
 }
 if(mode==='english')rows.push(group('category-panel','group-category-panel','setup-scope','[data-category-panel]'),
  group('category-grid','container-category-grid','category-panel','.english-category-grid'),
  repeat('category-option','jelly-option','text','category-grid','.english-category-grid > label','input@value',{min:18,max:18}),
  b('category-actions','control-jelly','toggle','category-panel','[data-category-actions]',{level:'group'}),
  repeat('category-action','jelly-option','text','category-actions','[data-category-actions] > label','input@value',{min:2,max:2}));
 if(mode==='flags')rows.push(group('continent-panel','group-category-panel','setup-scope','[data-continent-panel]'),
  repeat('continent-option','jelly-option','text','continent-panel','.flag-continent-grid > label','input@value',{min:5,max:5}));
 return rows.map(row=>({...row,mode}));
}

function game(mode){return [
 group('game-hud','group-game-hud','layout-root','.game-bar'),
 button('game-exit','button-back','game-hud','[data-action="exit"]','exit'),
 group('game-clock','container-game-clock','game-hud','.time-block'),
 b('game-timer','text-game-clock','timer','game-clock','.timer'),text('game-clock-copy','game-clock','.time-block small'),
 button('game-pause','button-local','game-hud','[data-action="pause"]','pause'),
 b('game-progress','meter-round-progress-fill','meter','layout-root','progress'),
 group('game-meta','group-game-meta','layout-root','.game-meta'),
 text('game-question-count','game-meta','.game-meta > span'),text('game-score','game-meta','.game-meta > strong'),
 group('game-question','family-game-question','layout-root','.question-card',{level:'family'}),
 group('game-badges','group-game-badges','game-question','.badges',optional),
 text('game-category','game-badges','.badge:not(.level):not(.english-seen-badge)',optional),text('game-level','game-badges','.badge.level',optional),
 text('game-seen','game-badges','.english-seen-badge',optional),
 group('game-content','container-game-content','game-question','.question-content'),
 text('game-question-text','game-content','.question-text,.reading-text,.memory-flash',optional),
 text('game-translation','game-content','.translation,.reading-answer',optional),
 b('game-flag','image-game-flag','image','game-content','.flag-on-pole,.question-content > img.flag',optional),
 text('game-country','game-content','.flag-adventure-name,.flag-adventure-country',optional),
 text('game-capital','game-content','.flag-adventure-capital,.flag-adventure-capital-question',optional),
 group('game-memory','group-memory-slots','game-content','.memory-recall,.memory-feedback,.phrase-build,.phrase-feedback,.phrase-complete',optional),
 button('game-backspace','button-local','game-memory','[data-action="memory-backspace"]','memory-backspace',optional),
 repeat('game-phrase-slot','button-answer','button','game-memory','[data-action="phrase-remove"]','data-index',{action:'phrase-remove'}),
 text('game-prompt','layout-root','p.prompt'),
 group('game-answers','group-game-answers','layout-root','.answers,.phrase-word-bank'),
 repeat('game-answer','button-answer','button','game-answers','[data-action="answer"],[data-action="memory-digit"],[data-action="phrase-word"]','data-index|data-value',{actions:['answer','memory-digit','phrase-word'],action:'answer',max:10}),
 group('game-feedback','group-game-feedback','layout-root','div.feedback'),
 text('game-feedback-title','game-feedback','.feedback-message strong',optional),text('game-feedback-copy','game-feedback','.feedback-message small,div.feedback > p',optional),
 button('game-next','button-main','game-feedback','[data-action="next"]','next',optional)
 ].map(row=>({...row,mode}));}
const mathGame=[
 group('math-hud','group-game-hud','layout-root','.topbar'),
 button('math-exit','button-back','math-hud','#back','exit',{actionAttribute:'event',event:'math-request-exit'}),
 text('math-brand','math-hud','.topbar .brand'),
 group('math-quiz','family-math-quiz','layout-root','[data-math-quiz]',{level:'family'}),
 group('math-stage','group-math-stage','math-quiz','.quiz-stage'),group('math-question','container-math-question','math-stage','.question-block'),
 text('math-question-label','math-question','.question-label'),group('math-equation','group-math-equation','math-question','.equation'),
 text('math-left','math-equation','.equation-left'),text('math-operation','math-equation','.equation-sign'),text('math-right','math-equation','.equation-right'),
 group('math-answers','group-game-answers','math-stage','.answer-grid',optional),
 repeat('math-answer','button-answer','button','math-answers','[data-answer]','data-answer',{max:6,action:'answer',actionAttribute:'event',event:'chooseAnswer'}),
 text('math-feedback','math-stage','p.feedback',optional),text('math-wrong-notice','math-question','.wrong-answer-note',optional),
 group('math-explainer','group-math-explainer','math-stage','.explainer-reveal',optional),
 group('math-explainer-actions','group-math-actions','math-stage','[data-explainer-actions]',optional),
 button('math-retry','button-local','math-explainer-actions','[data-retry]','retry',{...optional,actionAttribute:'event',event:'retryQuestion'}),
 button('math-next','button-main','math-explainer-actions','[data-next-question]','next',{...optional,actionAttribute:'event',event:'nextQuestion'})
].map(row=>({...row,mode:'math'}));

const progressBase=(sub=false)=>[
 button('progress-back','button-back','layout-root','.navigation-back',sub?'dashboard':'home',{actionAttribute:sub?'data-progress':'data-action',actions:sub?['dashboard']:['home','return-results']}),
 text('progress-title','layout-root','h1'),
 group('progress-canvas','family-progress','layout-root','.progress-canvas',{level:'family'})
];
const progress=[...progressBase(),group('progress-hero','group-progress-hero','progress-canvas','.progress-hero'),
 group('progress-modes','group-progress-modes','progress-hero','.progress-modes'),
 repeat('progress-mode','button-progress-mode','button','progress-modes','[data-progress="mode"]','data-mode',{min:5,max:5,action:'mode',...progressAction}),
 text('progress-hero-title','progress-hero','.progress-hero-copy h2'),text('progress-hero-copy','progress-hero','.progress-hero-copy p'),
 group('progress-content','group-progress-content','progress-canvas','.progress-content'),
 group('progress-stats','group-progress-stats','progress-content','.progress-stats'),
 repeat('progress-stat','container-progress-stat','button','progress-stats','.progress-stat','data-filter',{min:3,max:3,action:'collection',...progressAction,level:'group'}),
 within('stat-icon','icon-progress-stat','icon','progress-stat','.progress-stat-icon'),within('stat-value','text-progress-stat','text','progress-stat','b'),within('stat-label','text-progress-stat-label','text','progress-stat','small'),
 group('progress-links','group-progress-links','progress-content','.progress-links'),
 button('progress-collection','container-progress-collection','progress-links','[data-progress="collection"]:not(.progress-stat)','collection',{...progressAction,level:'group'}),
 b('progress-collection-art','background-progress-collection','background','progress-collection','.progress-collection-art'),
 text('progress-collection-title','progress-collection','.progress-collection-title'),
 button('progress-categories','container-progress-categories','progress-links','[data-progress="categories"]','categories',progressAction),
 group('progress-achievements','group-progress-achievements','progress-content','.progress-achievements'),
 text('progress-achievements-title','progress-achievements','.progress-achievements h2'),
 button('progress-show-trophies','button-local','progress-achievements','[data-progress="achievements"]','achievements',progressAction),
 button('progress-previous','button-local','progress-achievements','[data-progress="previous"]','previous',progressAction),
 button('progress-next','button-local','progress-achievements','[data-progress="next"]','next',progressAction),
 repeat('progress-trophy','container-achievement','container','progress-achievements','.achievement','data-achievement',{min:3,max:3}),
 within('trophy-art','image-trophy','image','progress-trophy','svg'),within('trophy-title','text-trophy-title','text','progress-trophy','span'),within('trophy-detail','text-trophy-detail','text','progress-trophy','strong'),within('trophy-progress','text-trophy-progress','text','progress-trophy','small'),
 button('progress-rules','button-progress-rules','progress-content','[data-progress="rules"]','rules',{...progressAction,level:'group'}),
 b('progress-rules-art','background-progress-rules','background','progress-rules','.progress-rule-art'),
 text('progress-rules-title','progress-rules','.progress-rule-copy strong'),text('progress-rules-copy','progress-rules','.progress-rule-copy small')
];
const collection=[...progressBase(true),group('collection-content','family-collection','progress-canvas','.collection-content',{level:'family'}),
 group('collection-filters','container-collection-filters','collection-content','.collection-filters'),
 ...['all','mastered','learning','review'].map(key=>button('collection-filter-'+key,'button-collection-filter','collection-filters',`[data-progress="filter"][data-filter="${key}"]`,'filter',progressAction)),
 group('collection-grid','container-collection-grid','collection-content','.collection-word-grid',optional),
 repeat('collection-word','container-collection-word','button','collection-grid','.collection-word','data-word',{action:'rule',...progressAction,level:'group'}),
 within('word-image','image-collection-word','image','collection-word','img'),within('word-title','text-collection-word','text','collection-word','strong'),within('word-state','text-collection-state','text','collection-word','small'),
 group('collection-empty','group-progress-empty','collection-content','.progress-empty',optional),text('collection-empty-title','collection-empty','.progress-empty h2',optional),text('collection-empty-copy','collection-empty','.progress-empty p',optional),
 button('collection-practice','button-main','collection-empty','[data-progress="practice"]','practice',{...progressAction,...optional})
];
const trophies=[...progressBase(true),text('trophies-copy','progress-canvas','.progress-subtitle'),group('trophies-list','group-trophies','progress-canvas','.progress-achievement-list'),
 repeat('trophy','container-achievement','container','trophies-list','.progress-achievement-list > article','data-achievement',{min:5,max:5}),within('trophy-art','image-trophy','image','trophy','svg'),within('trophy-title','text-trophy-title','text','trophy','h2'),within('trophy-copy','text-trophy-copy','text','trophy','p')];
const categories=[...progressBase(true),text('categories-copy','progress-canvas','.progress-subtitle'),group('categories-list','group-progress-categories','progress-canvas','.progress-category-list'),
 repeat('category','button-practice-category','button','categories-list','.progress-category-list > button','data-category',{min:8,max:8,action:'practice',...progressAction,level:'group'}),within('category-pair','text-category-pair','text','category','.category-pair'),within('category-copy','text-category-copy','text','category',':scope > span')];
const rules=[...progressBase(true),b('rules-views','control-jelly','toggle','progress-canvas','.rules-views',{level:'group'}),
 repeat('rules-view','jelly-option','text','rules-views','.rules-views > label','input@value',{min:2,max:2}),
 group('rules-content','group-rules-content','progress-canvas','[data-rules-content]'),group('rules-categories','group-rules-categories','rules-content','.rules-categories'),
 repeat('rules-category','button-rule-category','button','rules-categories','[data-progress="rules-category"]','data-category',{min:8,max:8,action:'rules-category',...progressAction}),
 group('rules-list','group-learning-rules','rules-content','.learning-rule-list',optional),
 repeat('rule','container-learning-rule','container','rules-list','.learning-rule','data-rule',{level:'group'}),within('rule-title','text-rule-title','text','rule','summary'),within('rule-copy','text-rule-copy','text','rule','.learning-rule-body > p'),
 group('rules-word-grid','container-collection-grid','rules-content','.collection-word-grid',optional),
 repeat('rule-word','container-collection-word','button','rules-word-grid','.collection-word','data-word',{action:'rule',...progressAction,level:'group'}),within('rule-word-image','image-collection-word','image','rule-word','img'),within('rule-word-title','text-collection-word','text','rule-word','strong')];
const sessions=[...progressBase(true),text('sessions-copy','progress-canvas','.progress-subtitle'),group('sessions-list','group-progress-sessions','progress-canvas','.progress-session-list',optional),
 repeat('session','container-session','container','sessions-list','.progress-session-list > article','data-session'),within('session-title','text-session-title','text','session','h2'),within('session-copy','text-session-copy','text','session','p'),within('session-duration','text-session-duration','text','session','small'),
 group('sessions-empty','group-progress-empty','progress-canvas','.progress-empty',optional),text('sessions-empty-title','sessions-empty','.progress-empty h2',optional),text('sessions-empty-copy','sessions-empty','.progress-empty p',optional)];

const views={players,settings,progress,collection,trophies,categories,rules,sessions};
for(const mode of ['english','flags','reading']){
 views[mode+'-settings']=wizard(mode);
 for(const state of ['initial','correct','wrong'])views[mode+'-'+state]=game(mode);
}
for(const state of ['initial','correct','wrong'])views['math-'+state]=mathGame;
// Results reuse exactly the Orthography result family, with mode-scoped IDs.
export function resultBindings(spellingResults,mode){const recipes={'container-result-points':'result-points-bubble','text-result-heading':'text-result-title','text-result-intro':'text-result-subtitle'};return spellingResults.map(item=>({...item,recipe:recipes[item.recipe]||item.recipe,id:item.id.replace('spelling-',mode+'-'),parent:item.parent.replace('spelling-',mode+'-'),mode}));}
export const BOUND_VIEW_CONTRACTS=Object.freeze(Object.fromEntries(Object.entries(views).map(([id,items])=>[id,Object.freeze(items.map(item=>Object.freeze(item)))])));

// Nested, explicitly owned component families. Optional means that the real
// stateful renderer has not mounted that part in this state, never a fallback
// to guessing classes or hashes. Dynamic content stays inside its named atom.
const companions={};
for(const mode of ['spelling','english','flags','reading','math']){
 const prefix=mode+'-result-';
 const parts=[
  group('result-line','container-result-line',prefix+'summary','.round-summary-line'),
  text('result-mode','result-line','.round-mode-pill',{recipe:'text-result-mode'}),
  b('result-progress-fill','meter-round-progress-fill','meter',prefix+'progress','.round-progress-fill'),
  b('result-progress-cap','icon-round-progress-cap','icon','result-progress-fill','.round-progress-cap'),
  b('result-family-art','image-result-family-art','image',prefix+'root','.result-family-art',optional),
  repeat('result-stat','container-result-stat','container',prefix+'stats','.result-stat','data-result',{level:'group'}),
  within('stat-icon','icon-result-stat','icon','result-stat','.result-stat-icon'),within('stat-copy','text-result-stat','text','result-stat','.result-stat-copy'),within('stat-sprig','icon-result-sprig','icon','result-stat','.result-sprig'),
  repeat('result-panel','group-result-panel','container',prefix+'details','[data-result-panel]','data-result-panel'),
  within('panel-title','text-result-detail-title','text','result-panel','.result-detail-head strong'),within('panel-copy','text-result-detail-description','text','result-panel','.result-detail-head p'),
  repeat('result-word','container-result-word','container',prefix+'details','.result-word-row','data-result-word'),
  within('word-thumb','image-result-word','image','result-word','.result-word-thumb'),within('word-copy','text-result-word','text','result-word','.result-word-copy strong'),within('word-caption','text-result-word-caption','text','result-word','.result-word-copy small'),
  within('word-rule','button-rule','button','result-word','.result-word-state',{action:'show-result-rule'}),
  b('continue-handle','icon-continue-handle','icon',prefix+'repeat','.continue-handle'),
  text('continue-copy',prefix+'repeat','.continue-copy',{recipe:'text-continue-copy'}),text('continue-done',prefix+'repeat','.continue-done',{recipe:'text-continue-done'}),
  b('result-rays-left','icon-result-rays-left','icon',prefix+'heading','.result-rays-left',optional),b('result-rays-right','icon-result-rays-right','icon',prefix+'heading','.result-rays-right',optional)
 ];
 // The stat and panel hosts already belong to the base contract. Only their
 // children are new components: select a declared host as a traversal scope.
 for(const row of parts.filter(row=>['result-stat','result-panel'].includes(row.id)))row.scopeOnly=true;
 companions[mode+'-results']=parts;
}
companions['spelling-rule']=companions['spelling-results'];
for(const state of ['initial','correct','wrong','hint','pause'])companions['spelling-'+state]=[
 b('mn-soap-picture','image-mn-soap-picture','image','spelling-game-visual','.mn-production-photo',optional),
 b('word','text-spelling-word','text','spelling-game-word','.word',optional),
 b('continue-handle','icon-continue-handle','icon','spelling-game-next','.continue-handle',optional),
 b('continue-copy','text-continue-copy','text','spelling-game-next','.continue-copy',optional)
];
companions['spelling-settings']=[
 b('mission-illustration','image-mission','image','spelling-mission','.mission-illustration'),
 b('mission-title','text-mission-title','text','spelling-mission','.mission-card h2'),
 b('mission-copy','text-mission-hint','text','spelling-mission','.mission-card p'),
 group('setup-form','container-setup-form','layout-root','#setup-form'),group('setup-card','container-card','setup-form','.setup-card'),
 group('category-panel','container-spelling-category-panel','spelling-scope-section','[data-category-panel]'),
 repeat('category-option','text-spelling-category-chip','text','category-panel','[data-category-panel] label','input@value'),
 group('dictation-panel','container-spelling-category-panel','spelling-scope-section','[data-dictation-panel]'),
 repeat('dictation-option','text-spelling-category-chip','text','dictation-panel','[data-dictation-panel] label','input@value'),
 text('setup-error','setup-form','#setup-error')
];
for(const view of ['player-pin','player-unlock'])companions[view]=[
 b('pin-instruction','text-pin-instruction','text','pin-fields','.pin-instruction'),b('pin-description','text-player-copy','text','pin-fields','.pin-fields > p')
];
export const VIEW_COMPANIONS=Object.freeze(Object.fromEntries(Object.entries(companions).map(([view,rows])=>[view,Object.freeze(rows.map(row=>Object.freeze({...row,optional:row.optional||Boolean(row.within)})))])));

// Editor labels describe the declared role; content remains editable separately.
export const VIEW_PART_LABELS={
 'player-shell':'Wybór gracza','player-title':'Nagłówek graczy','player-grid':'Lista graczy','player-actions':'Akcje gracza',
 mission:'Misja','setup-form':'Ustawienia przygody','setup-card':'Karta ustawień','setup-scope':'Zakres ćwiczenia','setup-level':'Poziom','setup-time':'Czas rundy','setup-game':'Rodzaj gry','setup-training':'Rodzaj treningu','category-panel':'Wybór kategorii','category-grid':'Kategorie','category-actions':'Zatwierdzenie kategorii','continent-panel':'Kontynenty',
 'game-hud':'Pasek gry','game-clock':'Czas rundy','game-meta':'Punkty i numer pytania','game-question':'Pytanie','game-badges':'Informacje o pytaniu','game-content':'Treść pytania','game-memory':'Zapamiętana odpowiedź','game-answers':'Odpowiedzi','game-feedback':'Informacja po odpowiedzi',
 'math-hud':'Pasek matematyki','math-quiz':'Zadanie matematyczne','math-stage':'Zadanie i odpowiedzi','math-question':'Pytanie','math-equation':'Działanie','math-answers':'Odpowiedzi','math-explainer':'Wyjaśnienie','math-explainer-actions':'Dalsze ćwiczenie',
 'settings-screen':'Ustawienia','settings-profile':'Profil','settings-media':'Dźwięk i animacje','settings-information':'Informacje w grze','settings-data':'Dane i urządzenie',
 'progress-canvas':'Postępy','progress-hero':'Nagłówek postępów','progress-modes':'Tryby gry','progress-content':'Wyniki i kolekcja','progress-stats':'Etapy nauki','progress-links':'Kolekcja i kategorie','progress-achievements':'Osiągnięcia',
 'collection-empty':'Pusta kolekcja','trophies-list':'Osiągnięcia','categories-list':'Kategorie ćwiczeń','rules-content':'Zasady i słowa','rules-categories':'Kategorie zasad','rules-list':'Lista zasad','sessions-list':'Historia rund','sessions-empty':'Pusta historia','result-line':'Wynik rundy','dictation-panel':'Dyktanda'
};
