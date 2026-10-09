export const GAME_MODES=['spelling','english','flags','reading','math'];
export const routeKey=(from,action,context='')=>[from,action,context].filter(Boolean).join('--');
export const routeTargets=['home','settings','players','player-create','progress',...GAME_MODES.flatMap(mode=>[mode+'-settings',mode+'-results'])];
export const PLAYER_SELECTION_DEFAULTS={autoContinue:true,delay:360,fadeDuration:280,otherOpacity:.28};
export function playerSelectionSettings(config){return {...PLAYER_SELECTION_DEFAULTS,...config?.navigation?.playerSelection};}
export const STARTUP_LINKS=[
 {from:'players',action:'add-player',label:'Dodaj gracza',to:'player-create',condition:'Dostępne przy 0–2 profilach.',targets:['player-create','players']},
 {from:'players',action:'enter-player',label:'Wybrany gracz · bez PIN-u',to:'home',condition:'Po zaznaczeniu karty; profil został odblokowany.',targets:['home','settings','progress']},
 {from:'players',action:'choose-pin',label:'Wybrany gracz · ma PIN',to:'player-unlock',fixed:true,condition:'Najpierw wpisanie i sprawdzenie PIN-u.'},
 {from:'players',action:'guest-player',label:'Później · gra bez profilu',to:'home',condition:'Pierwsze uruchomienie: brak graczy.',targets:['home','settings','progress']},
 {from:'player-create',action:'players',label:'Powrót',to:'players',targets:['players','player-create']},
 {from:'player-create',action:'submit-name',label:'Dalej · poprawne imię',to:'player-pin',fixed:true,condition:'Walidacja imienia, potem wybór PIN / bez PIN-u.'},
 {from:'player-pin',action:'edit-player',label:'Powrót do imienia i avatara',to:'player-create',targets:['player-create','players']},
 {from:'player-pin',action:'pin-mode',label:'PIN ↔ bez PIN-u',to:'player-pin',fixed:true,condition:'Zmiana stanu tego kafla, bez zmiany widoku.'},
 {from:'player-pin',action:'submit-pin',label:'Dalej · zapisany profil',to:'home',condition:'4 cyfry PIN-u lub wybór Bez PIN-u; zapis profilu.',targets:['home','settings','progress']},
 {from:'player-unlock',action:'players',label:'Powrót',to:'players',targets:['players','player-create']},
 {from:'player-unlock',action:'unlock-player',label:'Wejdź · poprawny PIN',to:'home',condition:'Dopiero po sprawdzeniu 4 cyfr PIN-u.',targets:['home','settings','progress']}
];
export function startupLinks(id){return STARTUP_LINKS.filter(e=>e.from===(id.startsWith('players')?'players':id));}
export function defaultTarget(from,action,mode='spelling',context=''){
 if(action==='exit-confirm'||action==='result-back'||action==='wizard')return mode+'-settings';
 if(action==='home')return 'home';if(action==='settings')return 'settings';
 if(action==='history')return 'progress';if(action==='switch-player')return 'players';
 if(action==='return-results')return context||mode+'-results';
 if(action==='choose-mode')return mode+'-settings';
 const startup=STARTUP_LINKS.find(e=>e.from===(from.startsWith('players')?'players':from)&&e.action===action);if(startup)return startup.to;
 return '';
}
export function resolveRoute(config,from,action,mode,context=''){return config?.navigation?.routes?.[routeKey(from,action,context)]||config?.navigation?.routes?.[routeKey(from,action)]||defaultTarget(from,action,mode,context);}
export function validateNavigation(value){
 if(!value||Object.keys(value).some(k=>!['routes','playerSelection'].includes(k))||!value.routes||Array.isArray(value.routes)||Object.keys(value.routes).length>150)throw Error('Nieprawidłowa mapa nawigacji.');
 for(const [key,to]of Object.entries(value.routes)){
  if(!/^[a-z0-9-]+--[a-z0-9-]+$/.test(key)||!routeTargets.includes(to))throw Error('Nieprawidłowe połączenie widoków.');
  const [from,action]=key.split('--'),startup=STARTUP_LINKS.find(e=>e.from===from&&e.action===action);
  if(startup&&(startup.fixed||!startup.targets.includes(to)))throw Error('To połączenie zachowuje sprawdzenie i zapis profilu.');
 }
 for(const [key,v]of Object.entries(value.playerSelection||{})){const bounds={delay:[0,2000],fadeDuration:[0,1500],otherOpacity:[0,1]}[key];if(key==='autoContinue'?typeof v!=='boolean':!bounds||!Number.isFinite(v)||v<bounds[0]||v>bounds[1])throw Error('Nieprawidłowe przejście wyboru gracza.');}
}
export function architectureLinks(mode){return [
 {from:mode+'-settings',action:'home',label:'Powrót',to:'home'},
 {from:mode+'-initial',action:'exit-confirm',label:'Wyjdź · po potwierdzeniu',to:mode+'-settings'},
 {from:mode+'-results',action:'result-back',label:'Powrót',to:mode+'-settings'},
 {from:mode+'-results',action:'again',label:'Nowa runda',to:mode+'-initial',fixed:true},
 {from:mode+'-results',action:'history',label:'Moje wyniki',to:'progress'},
 {from:'progress',action:'return-results',context:mode+'-results',label:'Powrót do rundy',to:mode+'-results'},
 {from:'progress',action:'home',label:'Powrót do startu',to:'home'}
 ];}
