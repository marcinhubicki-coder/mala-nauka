export const COMPONENT_IDS = ['layout','card','jelly','toggle','button','answer','flashcard','slider','popup','progress','profile','trophy','atom-container','atom-text','atom-icon','atom-image','atom-button','atom-background','game-timer','result-progress','pin-toggle','pin-key'];

export const FIELD_LABELS = {
  canvasWidth:'Szerokość ekranu',sidePadding:'Odstęp od boków ekranu',safeTop:'Miejsce na górny pasek telefonu',safeBottom:'Miejsce na dolny pasek telefonu',
  sectionGap:'Odstęp między sekcjami',headerHeight:'Wysokość nagłówka',headerGap:'Odstęp w nagłówku',headerBottom:'Odstęp pod nagłówkiem',missionHeight:'Wysokość misji',missionBottom:'Odstęp pod misją',
  height:'Wysokość',compactHeight:'Wysokość mniejszej odpowiedzi',compactFontSize:'Tekst mniejszej odpowiedzi',radius:'Zaokrąglenie',paddingX:'Wewnętrzny odstęp po bokach',paddingTop:'Wewnętrzny odstęp u góry',paddingBottom:'Wewnętrzny odstęp u dołu',padding:'Wewnętrzny odstęp',borderWidth:'Grubość obrysu',
  inset:'Odstęp od brzegu przełącznika',labelSize:'Wielkość napisu',labelWeight:'Grubość liter',trackShadowY:'Przesunięcie cienia',trackShadowBlur:'Rozmycie cienia',trackShadowOpacity:'Widoczność cienia',duration:'Czas animacji',stretch:'Rozciągnięcie',recoil:'Powrót po przeskoku',bounce:'Sprężystość',inertia:'Bezwładność',magnet:'Przyciąganie do opcji',squish:'Ściśnięcie bryły',tilt:'Przechylenie',glow:'Poświata',shine:'Blask powierzchni',blur:'Rozmycie bryły',saturation:'Nasycenie',contrast:'Kontrast',inkDelay:'Opóźnienie zmiany koloru napisu',inkDuration:'Czas zmiany koloru napisu',inkBump:'Podbicie napisu',inkGlow:'Poświata napisu',inkFade:'Tempo zanikania napisu',inkBlur:'Rozmycie napisu',
  springDuration:'Czas sprężystego powrotu',springOvershoot:'Wychylenie przy powrocie',fillDuration:'Czas wypełnienia toru',completionDelay:'Pauza przed zmianą ekranu',glowBlur:'Poświata uchwytu',sparkDuration:'Czas iskry',doneDuration:'Czas komunikatu końcowego',easePower:'Łagodność narastania',wobble:'Falowanie paska',startKick:'Impuls na starcie',flash:'Błysk na końcu',finishDuration:'Czas finału paska',settlePercent:'Moment wyhamowania cyfr',rollDuration:'Czas ostatniego obrotu',hundredPause:'Pauza przy 99',hundredStagger:'Odstęp między cyframi',hundredRevealDelay:'Opóźnienie cyfry setek',kickDuration:'Czas wejścia setki',handoffDelay:'Pauza po zakończeniu',
  width:'Szerokość',widthPercent:'Szerokość względem miejsca',fontSize:'Wielkość tekstu',shadowY:'Przesunięcie podstawy',shadowBlur:'Rozmycie podstawy',gap:'Odstęp między elementami',handleSize:'Wielkość uchwytu',threshold:'Jak daleko trzeba przeciągnąć',maxHeightPercent:'Maksymalna wysokość okna',avatarSize:'Wielkość avatara',size:'Wielkość',
};

export const MODE_NAMES = {spelling:'Ortografia',english:'Angielski',flags:'Flagi',reading:'Czytanie',math:'Matematyka'};
export const STATE_NAMES = {default:'Zwykły',idle:'Przed wyborem',selected:'Wybrany',dragging:'Przeciągany',disabled:'Nieaktywny',pressed:'Wciśnięty',initial:'Przed odpowiedzią',correct:'Poprawny',wrong:'Błędny',prompt:'Pytanie',reveal:'Pokazanie odpowiedzi',feedback:'Po odpowiedzi',closed:'Zamknięty',open:'Otwarty',scrolling:'Przewijany',running:'W trakcie',paused:'Pauza',finished:'Koniec',empty:'Pusty',locked:'Zablokowany',unlocked:'Odblokowany',complete:'Ukończony','spring-back':'Powrót uchwytu'};
export const html = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export const number = value => Number(value).toLocaleString('pl-PL',{maximumFractionDigits:3});
export const componentName = (component, config) => config.componentNames?.[component.id] || component.name;
export const effectiveValue = (config,viewId,group,key,scope='global') => (scope==='view' ? config.overrides?.[viewId]?.[group]?.[key] : undefined) ?? config.tokens[group][key];
export const savedMarker = (value,min,max) => Math.max(0,Math.min(100,(value-min)/(max-min)*100));
export function rangeFor(group,key) {
  if(key==='canvasWidth')return[320,480,1,'px'];
  if(key==='duration')return[0,5000,50,'ms'];
  if(/Duration|Delay/.test(key))return[0,1500,10,'ms'];
  if(['stretch','recoil','bounce','inertia','magnet','glow','shine','saturation','contrast','inkBump','inkGlow','inkFade','easePower','wobble','startKick','flash'].includes(key))return[0,key==='startKick'?6:4,.05,'×'];
  if(key==='squish')return[0,40,1,'%'];
  if(key==='tilt')return[0,8,.1,'°'];
  if(['blur','inkBlur','glowBlur'].includes(key))return[0,30,.5,'px'];
  if(key==='springOvershoot')return[0,15,.5,'px'];
  if(key==='labelWeight')return[400,950,50,''];
  if(key==='trackShadowOpacity')return[0,.5,.005,''];
  if(key==='threshold')return[70,100,1,'%'];
  if(key==='settlePercent')return[50,95,1,'%'];
  if(/Percent$/.test(key))return[50,100,1,'%'];
  if(key==='height'&&group==='jelly')return[28,96,1,'px'];
  if(key==='height')return[16,120,1,'px'];
  if(key==='width')return[60,220,1,'px'];
  if(/Size|size/.test(key))return[8,key==='avatarSize'||key==='size'?180:64,.2,'px'];
  if(/radius/.test(key))return[4,60,1,'px'];
  if(/Height/.test(key))return[20,150,1,'px'];
  if(/Opacity/.test(key))return[0,1,.01,''];
  return[0,60,.5,'px'];
}

export function relatedViews(registry,componentId) {
    return registry.views.filter(view=>view.components.includes(componentId));
}
export function compareSelection(registry,componentId,selected,preferred) {
  const allowed = new Set(relatedViews(registry,componentId).map(view=>view.id));
  const result = [...new Set(selected)].filter(id=>allowed.has(id));
  if(!result.length && allowed.has(preferred))result.push(preferred);
  if(!result.length && allowed.size)result.push(allowed.values().next().value);
  return result;
}
