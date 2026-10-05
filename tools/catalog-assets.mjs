import {readFile,writeFile,readdir,stat,unlink} from 'node:fs/promises';
import {resolve,relative,basename} from 'node:path';
import {createHash} from 'node:crypto';
import {validateAssets} from '../design-system/validation.mjs';
const root=resolve(new URL('../',import.meta.url).pathname);
async function walk(dir){const out=[];for(const item of await readdir(dir,{withFileTypes:true})){if(['.git','dist','node_modules'].includes(item.name))continue;const path=resolve(dir,item.name);out.push(...(item.isDirectory()?await walk(path):[path]));}return out;}
const all=await walk(root);
let previous;try{previous=JSON.parse(await readFile(resolve(root,'design-system/assets.json'),'utf8'));}catch{}
const sources=await Promise.all(all.filter(path=>/\.(css|mjs|js|html|json)$/.test(path)&&!path.includes('/docs/')&&!path.includes('/design-system/')&&!path.endsWith('/sw.js')&&!path.includes('/tools/')&&!path.includes('/tests/')).map(async path=>({path:relative(root,path),text:await readFile(path,'utf8')})));
const groups=new Map(),dimensions={};
for(const path of all.filter(path=>path.includes('/assets/'))){const bytes=await readFile(path);const sha=createHash('sha256').update(bytes).digest('hex');const list=groups.get(sha)||[];list.push({path:relative(root,path),size:bytes.length,sha});groups.set(sha,list);}
const aliases={...previous?.aliases},assets=[];
for(const group of groups.values()){
 group.sort((a,b)=>a.path.localeCompare(b.path));const old=previous?.assets.find(row=>row.sha===group[0].sha&&group.some(item=>item.path===row.path));if(old)group.sort((a,b)=>(a.path===old.path?-1:b.path===old.path?1:0));const canonical=group[0];
 const references=sources.filter(source=>source.text.includes(canonical.path)||source.text.includes(basename(canonical.path))).map(source=>source.path);
 assets.push({...old,...canonical,id:canonical.sha.slice(0,16),type:canonical.path.split('.').at(-1),group:canonical.path.split('/')[1],references});
 for(const copy of group.slice(1))aliases[copy.path]=canonical.path;
}
// The manifest owns assignments. Scanning files must never infer or overwrite them.
const words=structuredClone(previous?.words||{});
for(const row of Object.values(words))row.path=aliases[row.path]||row.path;
const paths=new Set(assets.map(row=>row.path));for(const [from,to]of Object.entries(aliases))if(!paths.has(to))throw Error(`Brak celu aliasu: ${from}`);
const catalog={schemaVersion:1,revision:(previous?.revision||0)+1,assets:assets.sort((a,b)=>a.path.localeCompare(b.path)),aliases,words};
validateAssets(catalog);
await writeFile(resolve(root,'design-system/assets.json'),JSON.stringify(catalog,null,2)+'\n');
if(process.argv.includes('--deduplicate'))for(const path of Object.keys(aliases))await unlink(resolve(root,path)).catch(()=>{});
console.log(JSON.stringify({files:assets.length,aliases:Object.keys(aliases).length,words:Object.keys(words).length,savedBytes:Object.keys(aliases).reduce((sum,path)=>sum+(groups.get(assets.find(row=>row.path===aliases[path]).sha)?.[0]?.size||0),0)}));
