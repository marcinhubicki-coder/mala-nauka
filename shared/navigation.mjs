export const GAME_MODES=['spelling','english','flags','reading','math'];
export const routeKey=(from,action,context='')=>[from,action,context].filter(Boolean).join('--');
export const routeTargets=['home','settings','players','progress',...GAME_MODES.flatMap(mode=>[mode+'-settings',mode+'-results'])];
export function defaultTarget(from,action,mode='spelling',context=''){
 if(action==='exit-confirm'||action==='result-back'||action==='wizard')return mode+'-settings';
 if(action==='home')return 'home';if(action==='settings')return 'settings';
 if(action==='history')return 'progress';if(action==='switch-player')return 'players';
 if(action==='return-results')return context||mode+'-results';
 if(action==='choose-mode')return mode+'-settings';
 return '';
}
export function resolveRoute(config,from,action,mode,context=''){return config?.navigation?.routes?.[routeKey(from,action,context)]||config?.navigation?.routes?.[routeKey(from,action)]||defaultTarget(from,action,mode,context);}
export function validateNavigation(value){if(!value||Object.keys(value).some(k=>k!=='routes')||!value.routes||Array.isArray(value.routes)||Object.keys(value.routes).length>150)throw Error('Nieprawidłowa mapa nawigacji.');for(const [key,to]of Object.entries(value.routes))if(!/^[a-z0-9-]+--[a-z0-9-]+$/.test(key)||!routeTargets.includes(to))throw Error('Nieprawidłowe połączenie widoków.');}
export function architectureLinks(mode){return [
 {from:mode+'-settings',action:'home',label:'Powrót',to:'home'},
 {from:mode+'-initial',action:'exit-confirm',label:'Wyjdź · po potwierdzeniu',to:mode+'-settings'},
 {from:mode+'-results',action:'result-back',label:'Powrót',to:mode+'-settings'},
 {from:mode+'-results',action:'again',label:'Nowa runda',to:mode+'-initial',fixed:true},
 {from:mode+'-results',action:'history',label:'Moje wyniki',to:'progress'},
 {from:'progress',action:'return-results',context:mode+'-results',label:'Powrót do rundy',to:mode+'-results'},
 {from:'progress',action:'home',label:'Powrót do startu',to:'home'}
 ];}
