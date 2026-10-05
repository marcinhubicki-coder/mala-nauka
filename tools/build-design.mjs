import {readFile,writeFile,readdir,mkdir,rm} from 'node:fs/promises';
import {resolve,relative,dirname,posix} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root=process.cwd(),out=resolve(root,'dist'),canonicalBranch='design/system-v1';
let branch=process.env.VERCEL_GIT_COMMIT_REF;try{branch||=execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim();}catch{}
const consumer=process.argv.includes('--consumer')||Boolean(branch&&branch!==canonicalBranch);
const source=(process.env.DS_SOURCE_URL||`https://raw.githubusercontent.com/marcinhubicki-coder/mala-nauka/${canonicalBranch}/`).replace(/\/?$/,'/');
const centralFiles=['shared/rule-groups.mjs','spelling/bubble-dynamics.mjs','shared/element-system.mjs','shared/flow-model.mjs','home-screen.mjs','home-screen.css','progress-screen.mjs','progress-screen.css','design-system/config.json','design-system/rules.json','design-system/assets.json','design-system/registry.json','design-system/audit.json','design-system/model.mjs','design-system/project-model.mjs','shared/discovery-model.mjs','shared/screen-copy.mjs','design-system/preview-model.mjs','design-system/validation.mjs','design-system/bridge.mjs','shared/design-runtime.mjs','shared/asset-loader.mjs','shared/rules-library.mjs','shared/screen-motion.mjs','shared/component-recipes.mjs','shared/components.css','shared/jelly-v4.css','shared/jelly-v4.mjs','shared/mastery.mjs','shared/scroll-edges.mjs','spelling/scenes.mjs','spelling/continue-drag.mjs','spelling/word-pools.mjs','spelling/effect-model.mjs','spelling/performance-model.mjs','spelling/response-effects.mjs','spelling/scoring.mjs','spelling/round.mjs','spelling/art.mjs','spelling/bubble.mjs','spelling/dictation.mjs','game.mjs','modes.mjs','progress.mjs','ortografia/result-screen.mjs'];
const files=new Map();
let deploymentSHA=process.env.VERCEL_GIT_COMMIT_SHA;try{deploymentSHA||=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{}
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){if(['.git','dist','node_modules','.design-qa','docs','tests','tools'].includes(item.name)||item.name.startsWith('.'))continue;const path=resolve(dir,item.name);if(item.isDirectory()){if(consumer&&relative(root,path)==='assets')continue;await walk(path);}else if(!/\.(md|py)$/.test(path)){files.set(relative(root,path).split('\\').join('/'),await readFile(path));}}}
await walk(root);
files.set('design-system/deployment.json',Buffer.from(JSON.stringify({schemaVersion:1,sha:/^[0-9a-f]{40}$/.test(deploymentSHA||'')?deploymentSHA:null,branch,consumer})));
const localSource=process.env.DS_SOURCE_DIR;
if(consumer)for(const path of centralFiles){if(localSource){files.set(path,await readFile(resolve(localSource,path)));continue;}const response=await fetch(new URL(path,source),{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(`Brak centralnego kontraktu (${response.status}): ${path}`);files.set(path,Buffer.from(await response.arrayBuffer()));}
if(consumer){const app=files.get('app.js')?.toString()||'';if(app.includes('data/words-0')&&!/const parts=await Promise/.test(app))throw Error('Zaktualizuj adapter bazy słów dla tego konsumenta.');}
const catalog=JSON.parse(files.get('design-system/assets.json').toString());
if(catalog.schemaVersion!==1)throw Error('Nieobsługiwany kontrakt assetów.');
const assetBase=consumer?source:'/';
const assetURL=path=>new URL(catalog.aliases[path]||path,consumer?source:'https://local.invalid/').href.replace('https://local.invalid','');
// Convert the old font aliases without changing each renderer's typography role.
function fonts(css){return css.replace(/@font-face\s*\{[^}]*\}\s*/g,'').replace(/font-family\s*:\s*["']?(ResultBody|MN Soft|Flag Body)["']?/g,'font-family:var(--ds-font-body)').replace(/font-family\s*:\s*["']?(ResultDisplay|Spelling)["']?/g,'font-family:var(--ds-font-display)').replace(/font-family\s*:\s*["']?Home Rounded["']?/g,'font-family:var(--ds-font-ui)').replace(/font-family\s*:\s*["']?Flag Display["']?/g,'font-family:var(--ds-font-flag)');}
function canonicalFonts(css){return fonts(css).replace(/font(?:-family)?\s*:[^;{}]+/g,value=>value.replace(/(["']?)(ResultBody|MN Soft|Flag Body|ResultDisplay|Spelling|Home Rounded|Flag Display)\1/g,(_,quote,name)=>`var(--ds-font-${({ResultBody:'body','MN Soft':'body','Flag Body':'body',ResultDisplay:'display',Spelling:'display','Home Rounded':'ui','Flag Display':'flag'})[name]})`));}
function assetReferences(text){return text.replace(/(?:\.\.?\/)*assets\/[^\s"'<>`)}]+\.(?:png|jpe?g|webp|avif|svg|woff2?)(?:\?[^\s"'<>`)}]*)?/g,path=>{
 const clean=path.replace(/^(\.\.?\/)+/,'').split('?')[0];return assetURL(clean);
}).replace(/(['"])(?:\.\.?\/)*assets\/([a-z0-9/-]+\/)\1\s*\+/gi,(_,quote,folder)=>`${quote}${source}assets/${folder}${quote}+`);}
function cssURLs(text,file){return text.replace(/url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/g,(whole,quote,url)=>{
 if(/^(data:|https?:|#)/.test(url))return whole;
 const path=posix.normalize(posix.join(posix.dirname(file),url.split('?')[0]));
 return path.startsWith('assets/')?`url("${assetURL(path)}")`:whole;
});}
function flattenCSS(file,stack=[]){
 file=posix.normalize(file.split('?')[0]);if(stack.includes(file))throw Error(`Zapętlony import CSS: ${file}`);
 const value=files.get(file);if(!value)throw Error(`Brak arkusza CSS: ${file}`);
 let text=canonicalFonts(value.toString());
 text=text.replace(/@import\s+(?:url\()?\s*['"]([^'"]+)['"]\s*\)?\s*;/g,(_,path)=>flattenCSS(posix.join(posix.dirname(file),path),[...stack,file]));
 return cssURLs(text,file);
}
function deduplicateCSS(css){
 const rules=[];let start=0,depth=0,quote='',comment=false;
 for(let i=0;i<css.length;i++){
  const char=css[i],next=css[i+1];
  if(comment){if(char==='*'&&next==='/'){comment=false;i++;}continue;}
  if(quote){if(char===quote&&css[i-1]!=='\\')quote='';continue;}
  if(char==='/'&&next==='*'){comment=true;i++;continue;}if(char==='"'||char==="'"){quote=char;continue;}
  if(char==='{')depth++;else if(char==='}'&&--depth===0){rules.push(css.slice(start,i+1));start=i+1;}
 }
 if(start<css.length)rules.push(css.slice(start));
 const seen=new Set();return rules.reverse().filter(rule=>{const key=rule.replace(/\/\*[\s\S]*?\*\//g,'').trim();if(!key)return true;if(seen.has(key))return false;seen.add(key);return true;}).reverse().join('\n');
}
let bundled=0,removedCSSBytes=0;
for(const [path,bytes] of [...files]){
 if(path.endsWith('.css'))files.set(path,Buffer.from(cssURLs(canonicalFonts(bytes.toString()),path)));
 if(/\.(mjs|js)$/.test(path)&&path!=='sw.js'){
  let text=bytes.toString();
  if(consumer){
   // Keep each consumer's app shell and use the canonical gameplay modules above.
   if(path==='app.js'&&!text.includes("from './shared/design-runtime.mjs'")){
    text="import {designReady} from './shared/design-runtime.mjs';\nimport {loadWords} from './shared/asset-loader.mjs';\n"+text;
    text=text.replace(/const parts=await Promise\.all\(Array\.from\(\{length:8\},async\(_,i\)=>\{[\s\S]*?words=validateWords\(parts\.flat\(\)\);/,'await designReady;words=validateWords(await loadWords());');
   }
   if(path==='app.js'){text=text.replace("if(new URLSearchParams(location.search).has('studio'))void renderStudioScenario();","if(new URLSearchParams(location.search).has('studio')&&studioSourceWords?.length)void renderStudioScenario();").replace("if(new URLSearchParams(location.search).has('studio')){words=validateWords(resolveRules(studioSourceWords));","if(new URLSearchParams(location.search).has('studio')&&studioSourceWords?.length){words=validateWords(resolveRules(studioSourceWords));");}
   if(path==='matematyka/app.js'&&!text.includes('designReady'))text="import {designReady} from '../shared/design-runtime.mjs';\nawait designReady;\n"+text;
   if(!path.startsWith('shared/asset-loader')&&!path.startsWith('design-system/'))text=assetReferences(text);
  }
  if(consumer&&path==='app.js'&&/fetch\(`data\/words-0/.test(text))throw Error('Adapter nie usunął lokalnej bazy słów.');
  files.set(path,Buffer.from(text));
 }
 if(path.endsWith('.html')){
  let html=bytes.toString();const baseMatch=html.match(/<base\s+href=['"]([^'"]+)['"]/),base=baseMatch?posix.normalize(posix.join(posix.dirname(path),baseMatch[1])):posix.dirname(path);
  if(consumer)html=assetReferences(html);
  const links=[...html.matchAll(/<link\b[^>]*rel=['"]stylesheet['"][^>]*>/g)];
  const styles=[];for(const link of links){const href=link[0].match(/href=['"]([^'"]+)['"]/)?.[1];if(href&&!/^https?:/.test(href))styles.push(posix.normalize(posix.join(base,href.split('?')[0])));}
  if(html.includes('id="app"')&&!styles.includes('shared/components.css'))styles.push('shared/components.css');
  if(styles.length){
   const css=styles.map(file=>flattenCSS(file)).join('\n'),unique=deduplicateCSS(css),hash=createHash('sha256').update(unique).digest('hex').slice(0,10),bundle=`styles/${path.replace(/[^a-z0-9]+/gi,'-')}-${hash}.css`;
   files.set(bundle,Buffer.from(unique));removedCSSBytes+=Math.max(0,css.length-unique.length);
   for(const link of links)html=html.replace(link[0],'');html=html.replace('</head>',`<link rel="stylesheet" href="/${bundle}"></head>`);bundled++;
  }
  if(consumer)html=html.replace('</head>',`<script>window.__DS_ASSET_ORIGIN__=${JSON.stringify(source)};window.__DS_CONTENT_ORIGIN__=${JSON.stringify(source)};</script><script type="module" src="/shared/design-runtime.mjs"></script></head>`);
  files.set(path,Buffer.from(html));
 }
}
// Consumer builds contain no duplicate assets or word packs.
if(consumer)for(const path of [...files.keys()])if(/^data\/words-0[1-8]\.json$/.test(path))files.delete(path);
// Fail the build before publishing a module graph with missing relative imports.
for(const [path,bytes] of files){
 if(!/\.(mjs|js)$/.test(path)||path==='sw.js')continue;
 for(const match of bytes.toString().matchAll(/(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["'](\.[^"']+)["']/g)){
  const target=posix.normalize(posix.join(posix.dirname(path),match[1].split('?')[0]));
  if(/\.(mjs|js)$/.test(target)&&!files.has(target))throw Error(`Brak zależności modułu: ${path} → ${target}. Uzupełnij centralFiles.`);
 }
}
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
for(const [path,bytes] of files){const target=resolve(out,path);await mkdir(dirname(target),{recursive:true});await writeFile(target,bytes);}
const buildDigest=createHash('sha256');for(const [path,bytes]of files)if(path!=='sw.js'&&!path.startsWith('assets/'))buildDigest.update(path).update(bytes);const buildHash=buildDigest.digest('hex').slice(0,12);
const core=[...files.keys()].filter(path=>/\.(html|css|mjs|js|json|webmanifest)$/.test(path)&&path!=='sw.js');
const assetsToCache=catalog.assets.filter(asset=>!/\.txt$|\.md$/.test(asset.path)).map(asset=>assetURL(asset.path));
if(consumer){assetsToCache.push(new URL('design-system/rules.json',source).href,new URL('design-system/config.json',source).href,new URL('design-system/assets.json',source).href);for(let batch=1;batch<=8;batch++)assetsToCache.push(new URL(`data/words-0${batch}.json`,source).href);}
const sw=`const CACHE='mala-nauka-ds-${buildHash}';\nconst CORE=${JSON.stringify(core.map(path=>'/'+path))};\nconst ASSETS=${JSON.stringify(assetsToCache)};\nself.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);for(let start=0;start<CORE.length;start+=12)await Promise.all(CORE.slice(start,start+12).map(async url=>{const response=await fetch(url);if(!response.ok)throw Error(url);await cache.put(url,response);}));for(let start=0;start<ASSETS.length;start+=12)await Promise.allSettled(ASSETS.slice(start,start+12).map(async url=>{const response=await fetch(url);if(response.ok)await cache.put(url,response);}));self.skipWaiting();})()));\nself.addEventListener('activate',event=>event.waitUntil((async()=>{for(const name of await caches.keys())if(name.startsWith('mala-nauka-')&&name!==CACHE)await caches.delete(name);await self.clients.claim();})()));\nself.addEventListener('fetch',event=>{const request=event.request,url=new URL(request.url);if(request.method!=='GET'||!(url.origin===location.origin||url.href.startsWith(${JSON.stringify(consumer?source:'https://raw.githubusercontent.com/marcinhubicki-coder/mala-nauka/')})))return;if(/\\/design-system\\/|\\/shared\\/.*\\.mjs$|\\/data\\/words-0[1-8]\\.json$/.test(url.pathname)){event.respondWith(fetch(request).then(async response=>{if(!response.ok)throw Error(url.href);const cache=await caches.open(CACHE);await cache.put(request,response.clone());return response;}).catch(()=>caches.match(request,{ignoreSearch:true})));return;}if(request.mode==='navigate'){event.respondWith(fetch(request).catch(async()=>await caches.match(url.pathname.endsWith('/')?url.pathname+'index.html':url.pathname)||await caches.match('/index.html')));return;}event.respondWith(caches.match(request,{ignoreSearch:true}).then(cached=>cached||fetch(request).then(async response=>{if(response.ok){const cache=await caches.open(CACHE);await cache.put(request,response.clone());}return response;})));});`;
await writeFile(resolve(out,'sw.js'),sw);
console.log(JSON.stringify({branch,consumer,assetOrigin:assetBase,files:files.size,bundledPages:bundled,removedRepeatedCSSBytes:removedCSSBytes,sourceAssetCopies:consumer?0:catalog.assets.length,buildHash}));
