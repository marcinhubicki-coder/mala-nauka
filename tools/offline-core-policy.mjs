// Runtime pre-cache excludes visual editor modules; editor loads on demand.
// All non-editor game JS/HTML/CSS/JSON modules remain available offline.
const RUNTIME_DATA=new Set(['design-system/config.json','design-system/assets.json','design-system/rules.json']);
const staticImportPattern=/^\s*(?:import\s+(?:[^;\n]*?\s+from\s+)?|export\s+(?:[^;\n]*?\s+from\s+))['"]([^'"]+)['"]/gm;
export function selectOfflineCore(paths,sourceFor){
 const list=[...paths],present=new Set(list),selected=new Set();
 const visit=path=>{
  if(!path||selected.has(path)||!present.has(path))return;
  selected.add(path);
  if(!/\.(?:mjs|js)$/.test(path))return;
  const body=sourceFor(path)||'';
  staticImportPattern.lastIndex=0;
  const imports=[...body.matchAll(staticImportPattern)].map(m=>m[1]);
  for(const imported of imports){
   if(!imported.startsWith('.'))continue;
   const resolved=new URL(imported,'https://local.invalid/'+path).pathname.slice(1).split('?')[0];
   if(present.has(resolved))visit(resolved);
  }
 };
 for(const path of list){
  if(RUNTIME_DATA.has(path))visit(path);
  else if(path==='design-system/bridge.mjs')visit(path);
  else if(!path.startsWith('design-system/')&&/\.(?:html|css|mjs|js|json|webmanifest)$/.test(path))visit(path);
 }
 return list.filter(path=>selected.has(path));
}
export function coreBudget(paths,sourceFor){
 const core=selectOfflineCore(paths,sourceFor);
 return {files:core.length,excluded:paths.length-core.length};
}
