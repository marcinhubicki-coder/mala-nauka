// Headless Design Studio engine: controlled configuration edits, not source patches.
// The visual editor writes these same elementStyles/elementOverrides/familyStyles.
import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {viewContract,validateViewContract,inheritedMode} from '../shared/view-contracts.mjs';
import {SPELLING_SETTINGS_CONTRACT,validateSpellingSettingsContract} from '../shared/spelling-settings-contract.mjs';
import {STYLE_FIELDS,validateElementStyles,rawVisualValue} from '../shared/element-styles.mjs';
import {PART_BY_ID} from '../shared/structure-model.mjs';

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

export function findEditableBlock(view,id){
 if(view==='home'){validateViewContract('home');const row=viewContract('home').find(row=>row.id===id);return row?{...row,view,mode:inheritedMode(view,id),blockId:'block-'+row.recipe}:null;}
 if(view==='spelling-settings'){validateSpellingSettingsContract();const row=SPELLING_SETTINGS_CONTRACT[id];return row?{...row,view,blockId:'block-'+row.recipe}:null;}
 return null;
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
function option(argv,key){const i=argv.indexOf('--'+key);return i===-1?null:argv[i+1]??null;}
function valueFromArg(raw){if(raw===null)throw Error('--value is required; use --reset to remove an override');try{return JSON.parse(raw);}catch{return raw;}}
async function main(argv=process.argv.slice(2)){
 const command=argv[0]||'help';
 if(command==='help'){console.log('Design Studio engine: inspect --view home --id home-mode-spelling | set --view home --id home-mode-spelling --property radius --value 28 [--apply] | inspect-recipe --recipe button-back | set-recipe --recipe button-back --property radius --value 22 [--apply] | check');return;}
 const filename=resolve(option(argv,'config')||'design-system/config.json');
 const current=JSON.parse(await readFile(filename,'utf8'));
 if(command==='check'){validateViewContract('home');validateSpellingSettingsContract();validateElementStyles(current);console.log('VALID: Home, Ortografia settings and design styles');return;}
 if(command==='inspect-recipe'){console.log(JSON.stringify(inspectRecipe(current,option(argv,'recipe')),null,2));return;}
 if(command==='set-recipe'){
  const reset=argv.includes('--reset'),property=option(argv,'property');
  if(!property)throw Error('--property is required');
  const planned=planRecipeEdit(current,{recipe:option(argv,'recipe'),property,mode:option(argv,'mode'),reset,value:reset?undefined:valueFromArg(option(argv,'value'))});
  if(argv.includes('--apply')){await writeFile(filename,JSON.stringify(planned.config,null,2)+'\n','utf8');console.log('APPLIED '+JSON.stringify(planned.change));}
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
 if(argv.includes('--apply')){await writeFile(filename,JSON.stringify(planned.config,null,2)+'\n','utf8');console.log('APPLIED '+JSON.stringify(planned.change));}
 else console.log('DRY RUN (no files changed) '+JSON.stringify(planned.change));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error('DESIGN ENGINE ERROR: '+error.message);process.exitCode=1;});
