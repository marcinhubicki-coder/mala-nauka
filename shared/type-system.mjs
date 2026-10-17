// One Text atom, ten visual styles. h7-h9 are style names, not HTML tags.
// Opt-in: existing production typography stays visually unchanged until assigned.
export const TYPE_STYLES=Object.freeze({
 h1:{size:44,weight:700,lineHeight:1.08,tracking:-0.8,fontRole:'display'},
 h2:{size:38,weight:700,lineHeight:1.12,tracking:-0.6,fontRole:'display'},
 h3:{size:34,weight:700,lineHeight:1.15,tracking:-0.4,fontRole:'display'},
 h4:{size:29,weight:800,lineHeight:1.18,tracking:-0.3,fontRole:'ui'},
 h5:{size:25,weight:800,lineHeight:1.2,tracking:-0.2,fontRole:'ui'},
 h6:{size:22,weight:800,lineHeight:1.23,tracking:-0.1,fontRole:'ui'},
 h7:{size:20,weight:700,lineHeight:1.26,tracking:0,fontRole:'ui'},
 h8:{size:18,weight:700,lineHeight:1.3,tracking:0,fontRole:'ui'},
 h9:{size:15,weight:700,lineHeight:1.34,tracking:0,fontRole:'ui'},
 body:{size:16,weight:600,lineHeight:1.45,tracking:0,fontRole:'body'}
});
export const TYPE_STYLE_IDS=Object.freeze(Object.keys(TYPE_STYLES));
export const TYPE_PROPERTIES=Object.freeze({size:[10,64],weight:[400,900],lineHeight:[1,2],tracking:[-2,3]});
const ROLES=['body','ui','display','flag'];
export function validateTypeScale(config){
 const styles=config?.typeScale;if(styles===undefined)return true;
 if(!styles||Array.isArray(styles)||typeof styles!=='object')throw Error('Nieprawidłowa skala typografii.');
 for(const [id,fields]of Object.entries(styles)){
  if(!Object.hasOwn(TYPE_STYLES,id)||!fields||typeof fields!=='object'||Array.isArray(fields))throw Error('Nieznany styl tekstu.');
  for(const [key,value]of Object.entries(fields)){
   if(key==='fontRole'){if(!ROLES.includes(value))throw Error('Nieprawidłowa rola fontu.');continue;}
   const range=TYPE_PROPERTIES[key];
   if(!range||!Number.isFinite(value)||value<range[0]||value>range[1])throw Error('Nieprawidłowy parametr stylu tekstu.');
  }
 }
 return true;
}
export function resolvedTypeScale(config={}){
 validateTypeScale(config);
 return Object.fromEntries(TYPE_STYLE_IDS.map(id=>[id,{...TYPE_STYLES[id],...config.typeScale?.[id]}]));
}
export function typeScaleCSS(config={}){
 const roles=resolvedTypeScale(config);
 let css='';
 for(const [name,style]of Object.entries(roles)){
  css+='--ds-type-'+name+'-size:'+style.size+'px;';
  css+='--ds-type-'+name+'-weight:'+style.weight+';';
  css+='--ds-type-'+name+'-line-height:'+style.lineHeight+';';
  css+='--ds-type-'+name+'-tracking:'+style.tracking+'px;';
  css+='--ds-type-'+name+'-family:var(--ds-font-'+style.fontRole+');';
 }
 return css;
}
export function typeStyleDeclaration(name){
 if(!Object.hasOwn(TYPE_STYLES,name))throw Error('Nieznany styl tekstu.');
 const base='--ds-type-'+name;
 return 'font-size:var('+base+'-size)!important;'+
  'font-weight:var('+base+'-weight)!important;'+
  'font-family:var('+base+'-family)!important;'+
  'line-height:var('+base+'-line-height)!important;'+
  'letter-spacing:var('+base+'-tracking)!important;';
}
