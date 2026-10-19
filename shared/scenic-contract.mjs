// The scenic renderer is the same editable family in Studio and ordinary PWA.
const part=(id,name,kind,selector,level='atom',children=[])=>({id,name,kind,selector,level,children});
export const SCENIC_PARTS=[
 part('family-scenic-game','Atlas i rozgrywka','container','#scenic-screen','family'),
 part('image-scenic-scenery','Pejzaż gry','image','.scenic-scenery'),part('image-scenic-boy','Chłopiec','image','.scenic-boy'),
 part('group-scenic-hud','Sterowanie i czas','container','.scenic-header','group'),
 part('text-scenic-clock','Zegar','text','#scenic-clock'),part('text-scenic-mode','Tryb i zatrzymanie czasu','text','#scenic-clock-caption'),
 part('text-scenic-task','Numer zadania','text','#scenic-task'),part('button-scenic-language','Język PL / EN','button','#scenic-language'),
 part('image-scenic-flag','Duża flaga','image','#scenic-flag-host'),
 part('family-scenic-paper','Pergamin i atlas','container','#scenic-map-scroll','family'),
 part('image-scenic-map','Ilustracja i granice','image','#scenic-map-ink'),part('image-scenic-heading','Nagłówek z tuszu','image','#scenic-map-heading'),part('image-scenic-small-flag','Flaga na mapie','image','#scenic-map-flag-ink'),
 part('image-scenic-compass','Kompas pergaminu','image','#scenic-compass'),part('text-scenic-question','Pytanie','text','.scenic-prompt,#scenic-map-question'),
 part('text-scenic-country','Nazwa kraju','text','#scenic-country-name'),part('text-scenic-capital','Stolica','text','#scenic-country-capital'),
 part('group-scenic-choices','Odpowiedzi','container','#scenic-answers','group'),part('button-scenic-answer','Odpowiedź na pergaminie','button','.scenic-answer'),
 part('group-scenic-neighbors','Sąsiedzi','container','#scenic-neighbors','group'),part('button-scenic-neighbor','Sąsiad','button','[data-neighbor]'),
 part('slider-scenic-next','Kompas — następne zadanie','slider','#scenic-swipe'),part('button-scenic-camera','Zasięg mapy','button','[data-map-view]')
];
const b=(id,recipe,kind,parent,selector,extra={})=>({id,recipe,kind,parent,selector,level:kind==='container'?'group':'atom',mode:'flags',...(kind==='button'?{action:id.replace('scenic-',''),actionAttribute:'event',event:id}:{}),...extra});
export const SCENIC_BINDINGS=[
 b('scenic-scene','family-scenic-game','container','layout-root','#scenic-screen',{level:'family'}),
 b('scenic-scenery','image-scenic-scenery','image','scenic-scene','.scenic-scenery'),b('scenic-boy','image-scenic-boy','image','scenic-scene','.scenic-boy'),
 b('scenic-hud','group-scenic-hud','container','scenic-scene','.scenic-header'),
 b('scenic-exit','button-spelling-exit','button','scenic-hud','[data-action=restart]'),b('scenic-timer','text-scenic-clock','text','scenic-hud','#scenic-clock'),
 b('scenic-mode','text-scenic-mode','text','scenic-hud','#scenic-clock-caption'),b('scenic-pause','button-spelling-pause','button','scenic-hud','[data-action=pause]'),
 b('scenic-task','text-scenic-task','text','scenic-scene','#scenic-task'),b('scenic-language','button-scenic-language','button','scenic-scene','#scenic-language'),
 b('scenic-large-flag','image-scenic-flag','image','scenic-scene','#scenic-flag-host'),
 b('scenic-paper','family-scenic-paper','container','scenic-scene','#scenic-map-scroll',{level:'family'}),
 b('scenic-map','image-scenic-map','image','scenic-paper','#scenic-map-ink'),b('scenic-heading','image-scenic-heading','image','scenic-paper','#scenic-map-heading'),b('scenic-small-flag','image-scenic-small-flag','image','scenic-paper','#scenic-map-flag-ink'),
 b('scenic-map-prompt','text-scenic-question','text','scenic-paper','#scenic-map-question'),b('scenic-country','text-scenic-country','text','scenic-paper','#scenic-country-name'),b('scenic-capital','text-scenic-capital','text','scenic-paper','#scenic-country-capital'),
 b('scenic-camera','button-scenic-camera','button','scenic-paper','[data-map-view]',{repeatKey:'data-map-view',min:2,max:2}),
 b('scenic-compass','image-scenic-compass','image','scenic-scene','#scenic-compass'),b('scenic-folded-prompt','text-scenic-question','text','scenic-scene','.scenic-prompt'),
 b('scenic-choices','group-scenic-choices','container','scenic-scene','#scenic-answers'),b('scenic-answer','button-scenic-answer','button','scenic-choices','.scenic-answer',{repeatKey:'data-id',min:4,max:4}),
 b('scenic-neighbors','group-scenic-neighbors','container','scenic-scene','#scenic-neighbors'),b('scenic-neighbor','button-scenic-neighbor','button','scenic-neighbors','[data-neighbor]',{repeatKey:'data-neighbor',max:20}),
 b('scenic-next','slider-scenic-next','slider','scenic-scene','#scenic-swipe')
];
