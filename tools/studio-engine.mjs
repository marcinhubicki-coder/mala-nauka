import {inventorySnapshot,VIEW_SNAPSHOT_IDS} from '../design-system/view-inventory-snapshots.mjs';
import {readFileSync} from 'node:fs';
// Headless Design Studio engine: controlled configuration edits, not source patches.
// The visual editor writes these same elementStyles/elementOverrides/familyStyles.
import {readFile,writeFile,rename,rm} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {viewContract,validateViewContract,inheritedMode} from '../shared/view-contracts.mjs';
import {SPELLING_SETTINGS_CONTRACT,validateSpellingSettingsContract} from '../shared/spelling-settings-contract.mjs';
import {STYLE_FIELDS,validateElementStyles,rawVisualValue} from '../shared/element-styles.mjs';
import {PART_BY_ID} from '../shared/structure-model.mjs';
import {HOME_RECTS,homeRect,homePosition,validateHomeLayout} from '../shared/home-layout.mjs';
import {STARTUP_LINKS,resolveRoute,routeKey,validateNavigation,routeTargets} from '../shared/navigation.mjs';

// A reusable recipe is a real source-level component shared across views.
// It can be edited without first scraping any screen's DOM or inventing IDs.
export function inspectRecipe(config,recipe){
 const part=PART_BY_ID[recipe];
 if(!part)throw Error('Unknown registered component recipe: '+recipe);
 return {id:part.id,name:part.name,level:part.level,kind:part.kind,states:part.states||['default'],style:config.elementStyles?.[recipe]||{}};
}
export function planRecipeEdit(config,{recipe,property,value,mode=null,reset=false}){
 const part=PART_BY_ID[recipe];
 if(!part)throw Error('Unknown registered component recipe: '+recipe);
 if(!STYLE_FIELDS.includes(property))throw Error('Unsupported component property: '+property);
 if(mode!==null&&!['spelling','english','flags','reading','math'].includes(mode))throw Error('Unknown mode: '+mode);
 const draft=structuredClone(config),path=mode?['familyStyles',mode,recipe]:['elementStyles',recipe];
 let dest=draft;for(const segment of path)dest=dest[segment]??=Object.create(null);
 const before=dest[property];
 if(reset)delete dest[property];else dest[property]=value;
 validateElementStyles(draft);
 return {config:draft,change:{recipe,kind:part.kind,scope:mode?'theme':'global',mode,path:path.concat(property).join('.'),before,after:reset?undefined:value}};
}


export function inspectRoute(config,{from,action,mode='spelling'}){
 if(!from||!action)throw Error('Route needs source view and action');
 const route=STARTUP_LINKS.find(row=>row.from===from&&row.action===action);
 if(!route)throw Error('Route is not in the explicitly supported startup map: '+routeKey(from,action));
 return {from,action,mode,fixed:Boolean(route.fixed),allowed:route.targets||[route.to],current:resolveRoute(config,from,action,mode),key:routeKey(from,action)};
}
export function planRouteEdit(config,{from,action,to,reset=false}){
 const info=inspectRoute(config,{from,action});
 if(info.fixed)throw Error('Fixed navigation step cannot be overridden: '+info.key);
 if(!reset&&(!routeTargets.includes(to)||!info.allowed.includes(to)))throw Error('Destination not allowed for '+info.key);
 const draft=structuredClone(config);
 draft.navigation??={routes:{}};
 draft.navigation.routes??={};
 const before=draft.navigation.routes[info.key]||null;
 if(reset)delete draft.navigation.routes[info.key];else draft.navigation.routes[info.key]=to;
 validateNavigation(draft.navigation);
 return {config:draft,change:{path:'navigation.routes.'+info.key,from,action,before,after:reset?null:to,current:resolveRoute(draft,from,action)}};
}

export function inspectHomeLayout(config,id){
 if(!Object.hasOwn(HOME_RECTS,id))throw Error('Unknown Home block: '+id);
 return {...homeRect(config,id),style:homePosition(config,id),override:config.layoutOverrides?.home?.[id]||null};
}
export function planLayoutEdit(config,{id,geometry={},reset=false}){
 if(!Object.hasOwn(HOME_RECTS,id))throw Error('Unknown Home layout block: '+id);
 if(!reset&&!Object.keys(geometry).length)throw Error('Select at least one coordinate: x, y, w or h');
 const draft=structuredClone(config),old=draft.layoutOverrides?.home?.[id]||null;
 draft.layoutOverrides??={};
 draft.layoutOverrides.home??={};
 if(reset)delete draft.layoutOverrides.home[id];
 else draft.layoutOverrides.home[id]={...(draft.layoutOverrides.home[id]||{}),...geometry};
 validateHomeLayout(draft);
 return {config:draft,change:{id,path:'layoutOverrides.home.'+id,before:old,after:draft.layoutOverrides.home[id]||null,rect:homeRect(draft,id).rect,style:homePosition(draft,id)}};
}

const VIEWS=new Map(JSON.parse(readFileSync(new URL('../design-system/registry.json',import.meta.url),'utf8')).views.map(view=>[view.id,view]));
export function findEditableBlock(view,id){
 if(view==='home'){validateViewContract('home');const row=viewContract('home').find(row=>row.id===id);return row?{...row,view,mode:inheritedMode(view,id),blockId:'block-'+row.recipe}:null;}
 if(view==='spelling-settings'){validateSpellingSettingsContract();const row=SPELLING_SETTINGS_CONTRACT[id];if(row)return {...row,view,blockId:'block-'+row.recipe};}
 const registryView=VIEWS.get(view);if(!registryView)return null;
 const item=inventorySnapshot(registryView)?.find(row=>row.id===id);
 return item?{...item,view,legacyAdapter:true}:null;
}
function targetPath(item,scope){
 if(scope==='shared')return ['elementStyles',item.blockId];
 if(scope==='view')return ['elementOverrides',item.view,item.id];
 if(scope==='theme'){if(!['spelling','english','reading','flags','math'].includes(item.mode))throw Error('Theme is only available for game modes');return ['familyStyles',item.mode,item.blockId];}
 throw Error('Scope must be shared, view or theme');
}
export function planStyleEdit(config,{view,id,property,value,scope='view',reset=false}){
 const item=findEditableBlock(view,id);
 if(!item)throw Error('Unknown or unported component '+view+'/'+id+'; migrate its contract before editing');
 if(!STYLE_FIELDS.includes(property))throw Error('Unsupported component property: '+property);
 const draft=structuredClone(config),path=targetPath(item,scope);
 let target=draft;for(const key of path)target=target[key]??=(Object.create(null));
 const before=target[property];
 if(reset)delete target[property];else target[property]=value;
 validateElementStyles(draft);
 const visual=rawVisualValue(draft,view,item);
 return {config:draft,change:{view,id,recipe:item.recipe,blockId:item.blockId,scope,path:path.concat(property).join('.'),before,after:reset?undefined:value,effective:visual[property],affected:scope==='view'?'this instance':scope==='shared'?'every use of this block':'this game theme'}};
}
export function inspectEditableBlock(config,{view,id}){
 const item=findEditableBlock(view,id);
 if(!item)throw Error('Not a migrated editable block: '+view+'/'+id);
 return {...item,style:rawVisualValue(config,view,item)};
}

export function planDesignBatch(config,operations){
 if(!Array.isArray(operations)||!operations.length||operations.length>100)throw Error('Batch requires 1-100 operations');
 let next=structuredClone(config);const changes=[];
 for(const [index,operation]of operations.entries()){
  try{
   if(!operation||Array.isArray(operation)||!['style','recipe','layout','route'].includes(operation.type))throw Error('Unknown edit operation');
   const {type,...args}=operation;
   const planned=type==='style'?planStyleEdit(next,args):type==='recipe'?planRecipeEdit(next,args):type==='layout'?planLayoutEdit(next,args):planRouteEdit(next,args);
   next=planned.config;changes.push({step:index+1,type,...planned.change});
  }catch(error){throw Error('Batch step '+(index+1)+' rejected: '+error.message);}
 }
 validateElementStyles(next);validateHomeLayout(next);if(next.navigation)validateNavigation(next.navigation);
 return {config:next,changes};
}
async function saveConfigAtomic(filename,config){
 const temp=filename+'.tmp-'+process.pid+'-'+randomUUID();
 try{await writeFile(temp,JSON.stringify(config,null,2)+'\n','utf8');await rename(temp,filename);}
 catch(error){await rm(temp,{force:true}).catch(()=>{});throw error;}
}


const normalizeName=value=>String(value??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function listEditableBlocks({view='',query='',kind='',limit=100}={}){
 if(!Number.isInteger(limit)||limit<1||limit>1000)throw Error('Limit must be 1-1000');
 if(view&&!VIEWS.has(view))throw Error('Unknown registered view: '+view);
 const result=[];
 for(const v of VIEWS.values()){
  if(view&&v.id!==view)continue;
  for(const row of inventorySnapshot(v)||[]){
   if(row.id==='layout-root'||(kind&&row.kind!==kind))continue;
   const part=PART_BY_ID[row.recipe],name=part?.name||row.label||row.id;
   if(query&&!normalizeName([v.id,row.id,row.recipe,row.kind,row.label,name].join(' ')).includes(normalizeName(query)))continue;
   result.push({view:v.id,id:row.id,name,kind:row.kind,recipe:row.recipe,level:part?.level||'unclassified',legacyAdapter:v.id!=='home',mode:v.mode});
   if(result.length>=limit)return result;
  }
 }
 return result;
}

function option(argv,key){const i=argv.indexOf('--'+key);return i===-1?null:argv[i+1]??null;}
function valueFromArg(raw){if(raw===null)throw Error('--value is required; use --reset to remove an override');try{return JSON.parse(raw);}catch{return raw;}}
async function main(argv=process.argv.slice(2)){
 const command=argv[0]||'help';
 if(command==='help'){console.log('Design Studio engine: inspect --view home --id home-mode-spelling | set --view home --id home-mode-spelling --property radius --value 28 [--apply] | inspect-recipe --recipe button-back | set-recipe --recipe button-back --property radius --value 22 [--apply] | check');return;}
 const filename=resolve(option(argv,'config')||'design-system/config.json');
 const current=JSON.parse(await readFile(filename,'utf8'));
 if(command==='check'){validateViewContract('home');validateSpellingSettingsContract();validateElementStyles(current);validateHomeLayout(current);if(VIEW_SNAPSHOT_IDS.length!==VIEWS.size)throw Error('View inventory snapshot coverage incomplete');console.log('VALID: '+VIEW_SNAPSHOT_IDS.length+' inventoried screens, Home renderer contract, Ortografia settings and design styles');return;}
 if(command==='batch'){
  const source=option(argv,'changes');if(!source)throw Error('--changes is required');
  const planned=planDesignBatch(current,JSON.parse(await readFile(resolve(source),'utf8')));
  if(argv.includes('--apply'))await saveConfigAtomic(filename,planned.config);
  console.log((argv.includes('--apply')?'APPLIED ':'DRY RUN ')+JSON.stringify(planned.changes));return;
 }
 if(command==='list'||command==='search'){
  const query=option(argv,'query')||'';
  if(command==='search'&&!query)throw Error('Search requires --query');
  if(command==='list'&&!option(argv,'view'))throw Error('List requires --view');
  const rows=listEditableBlocks({view:option(argv,'view')||'',query,kind:option(argv,'kind')||'',limit:option(argv,'limit')===null?100:Number(option(argv,'limit'))});
  console.log(JSON.stringify(rows,null,2));return;
 }
 if(command==='inspect-recipe'){console.log(JSON.stringify(inspectRecipe(current,option(argv,'recipe')),null,2));return;}
 if(command==='inspect-layout'){console.log(JSON.stringify(inspectHomeLayout(current,option(argv,'id')),null,2));return;}
 if(command==='set-layout'){
  const geometry={};
  for(const key of ['x','y','w','h']){const raw=option(argv,key);if(raw!==null)geometry[key]=Number(raw);}
  const planned=planLayoutEdit(current,{id:option(argv,'id'),geometry,reset:argv.includes('--reset')});
  if(argv.includes('--apply')){await saveConfigAtomic(filename,planned.config);console.log('APPLIED '+JSON.stringify(planned.change));}
  else console.log('DRY RUN '+JSON.stringify(planned.change));
  return;
 }
 if(command==='inspect-route'){console.log(JSON.stringify(inspectRoute(current,{from:option(argv,'from'),action:option(argv,'action'),mode:option(argv,'mode')||'spelling'}),null,2));return;}
 if(command==='set-route'){
  const planned=planRouteEdit(current,{from:option(argv,'from'),action:option(argv,'action'),to:option(argv,'to'),reset:argv.includes('--reset')});
  if(argv.includes('--apply')){await saveConfigAtomic(filename,planned.config);console.log('APPLIED '+JSON.stringify(planned.change));}
  else console.log('DRY RUN '+JSON.stringify(planned.change));
  return;
 }
 if(command==='set-recipe'){
  const reset=argv.includes('--reset'),property=option(argv,'property');
  if(!property)throw Error('--property is required');
  const planned=planRecipeEdit(current,{recipe:option(argv,'recipe'),property,mode:option(argv,'mode'),reset,value:reset?undefined:valueFromArg(option(argv,'value'))});
  if(argv.includes('--apply')){await saveConfigAtomic(filename,planned.config);console.log('APPLIED '+JSON.stringify(planned.change));}
  else console.log('DRY RUN '+JSON.stringify(planned.change));
  return;
 }
 const view=option(argv,'view'),id=option(argv,'id');
 if(!view||!id)throw Error('--view and --id are required');
 if(command==='inspect'){console.log(JSON.stringify(inspectEditableBlock(current,{view,id}),null,2));return;}
 if(command!=='set')throw Error('Unknown command '+command);
 const property=option(argv,'property'),scope=option(argv,'scope')||'view';
 if(!property)throw Error('--property is required');
 const reset=argv.includes('--reset');
 const planned=planStyleEdit(current,{view,id,property,scope,reset,value:reset?undefined:valueFromArg(option(argv,'value'))});
 if(argv.includes('--apply')){await saveConfigAtomic(filename,planned.config);console.log('APPLIED '+JSON.stringify(planned.change));}
 else console.log('DRY RUN (no files changed) '+JSON.stringify(planned.change));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error('DESIGN ENGINE ERROR: '+error.message);process.exitCode=1;});
