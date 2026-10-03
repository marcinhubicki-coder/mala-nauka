import {readFile,writeFile,readdir,stat} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
const root=resolve(new URL('../',import.meta.url).pathname);
async function walk(dir){const out=[];for(const item of await readdir(dir,{withFileTypes:true})){if(['.git','dist','node_modules'].includes(item.name))continue;const path=resolve(dir,item.name);out.push(...(item.isDirectory()?await walk(path):[path]));}return out;}
const files=(await walk(root)).filter(path=>/\.(css|js|mjs|html)$/.test(path)&&!path.includes('/docs/')&&!path.includes('/tools/')&&!path.includes('/tests/')&&!path.includes('/design-system/'));
const largeFiles=[];let cssBytes=0,jsBytes=0;
for(const path of files){const bytes=(await stat(path)).size;if(path.endsWith('.css'))cssBytes+=bytes;else if(/\.(js|mjs)$/.test(path))jsBytes+=bytes;if(bytes>18000)largeFiles.push({path:relative(root,path),bytes});}
const wordSources={};let wordCount=0;
for(let batch=1;batch<=8;batch++){const path=`data/words-0${batch}.json`;for(const word of JSON.parse(await readFile(resolve(root,path),'utf8'))){wordSources[word.word]=path;wordCount++;}}
let previous;try{previous=JSON.parse(await readFile(resolve(root,'design-system/audit.json'),'utf8'));}catch{}
const registry=JSON.parse(await readFile(resolve(root,'design-system/registry.json'),'utf8'));
const fontUsage=[];for(const path of files.filter(path=>path.endsWith('.css'))){const text=await readFile(path,'utf8');for(const match of text.matchAll(/([^{}]+)\{([^{}]*--ds-font-(body|ui|display|flag)[^{}]*)\}/g))fontUsage.push({file:relative(root,path),selector:match[1].replace(/\/\*[\s\S]*?\*\//g,'').trim().slice(-600),role:match[3]});}
const audit={schemaVersion:1,date:new Date().toISOString(),sourceCommit:'f16b7770c6473f692284ecd44f3a282bfa5d3829',cleanup:previous?.cleanup||{removedAssets:28,savedAssetBytes:7473392,removedCodeFiles:0,savedCodeBytes:0},wordCount,wordSources,fontUsage,fontViews:Object.fromEntries(registry.views.map(view=>[view.id,view.fontRoles])),cssBytes,jsBytes,largeFiles:largeFiles.sort((a,b)=>b.bytes-a.bytes),fonts:[{name:'MN Body',file:'nunito-variable.woff',aliases:['ResultBody','MN Soft','Flag Body'],roles:['body']},{name:'MN UI',file:'dosis-variable.woff',aliases:['Home Rounded'],roles:['ui']},{name:'MN Display',file:'dynapuff-polish-700.woff',aliases:['ResultDisplay','Spelling'],roles:['display']},{name:'MN Flag',file:'fredoka-polish-v1.woff',aliases:['Flag Display'],roles:['flag']} ]};
await writeFile(resolve(root,'design-system/audit.json'),JSON.stringify(audit,null,2)+'\n');
console.log(JSON.stringify({cssBytes,jsBytes,wordCount,largeFiles:largeFiles.length,cleanup:audit.cleanup}));
