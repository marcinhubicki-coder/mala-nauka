import {buildServiceWorker} from './service-worker.mjs';
import {pinnedContentSource,usesLocalDesignSnapshot} from './content-source.mjs';
import {readFile,writeFile,readdir,mkdir,rm} from 'node:fs/promises';
import {resolve,relative,dirname,posix} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {selectOfflineBootstrapAssets,offlineAssetBudget} from './offline-cache-policy.mjs';
import {selectOfflineCore} from './offline-core-policy.mjs';
import {FLAG_ARCHIVE_INDEX,isFrozenFlagFile,assertFlagArchive} from './flag-archive-policy.mjs';
import {readPublishedCatalog,assertPublishedAssets} from '../design-system/library-publish.mjs';
import {assertScenicArchive} from './scenic-archive-policy.mjs';
import {VIEW_CONTRACTS,validateViewContract,viewContractFingerprint,resolveDeclaredPart} from '../shared/view-contracts.mjs';
import {SNAPSHOT_CONTRACT_FINGERPRINT,VIEW_SNAPSHOT_IDS,inventorySnapshot} from '../design-system/view-inventory-snapshots.mjs';
const root=process.cwd(),out=resolve(root,'dist'),canonicalBranch='design/system-v1';
let branch=process.env.VERCEL_GIT_COMMIT_REF;try{branch||=execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim();}catch{}
// Pull-request CI checks out a detached merge commit: git has no branch name.
// Use the versioned Studio config as a deterministic fallback for that build.
// Deployment and Studio write targets are distinct: a PR preview must retain
// the versioned V2 target instead of accidentally becoming a V1 consumer.
const declaredStudioBranch=JSON.parse(await readFile(resolve(root,'design-system/config.json'),'utf8')).branch;
branch||=declaredStudioBranch;
const studioV2=declaredStudioBranch.startsWith('refactor/v2-')||declaredStudioBranch==='design/system-v2';
if(studioV2){
 const views=JSON.parse(await readFile(resolve(root,'design-system/registry.json'),'utf8')).views;
 if(new Set(views.map(view=>view.id)).size!==views.length||Object.keys(VIEW_CONTRACTS).length!==views.length)throw Error('Incomplete V2 view contract coverage');
 for(const view of views)validateViewContract(view.id);
 if(SNAPSHOT_CONTRACT_FINGERPRINT!==viewContractFingerprint()||VIEW_SNAPSHOT_IDS.length!==views.length)throw Error('Regenerate the verified V2 contract inventory cache');
 for(const view of views)for(const item of inventorySnapshot(view))if(item.id!=='layout-root'&&!resolveDeclaredPart(view.id,item.id))throw Error('Cached inventory is outside its contract: '+view.id+'/'+item.id);
}
if(branch.startsWith('refactor/v2-')&&!studioV2)throw Error('Niezgodna gałąź Studio V2: '+branch+' / '+declaredStudioBranch);
let generatedReport;try{generatedReport=JSON.parse(await readFile(resolve(root,'design-system/pwa-test-report.json'),'utf8'));}catch{}
const consumer=process.argv.includes('--consumer')||!(studioV2||usesLocalDesignSnapshot(branch,generatedReport));
const source=consumer?await pinnedContentSource({sourceURL:process.env.DS_SOURCE_URL,sourceSHA:process.env.DS_SOURCE_SHA}):'/';
const centralFiles=['shared/story-home.mjs','shared/story-home.css','shared/story-home-assets.mjs','shared/story-home-contract.mjs','shared/home-play-style.mjs','shared/progression.mjs','shared/journey-ui.mjs','shared/journey.css','shared/rule-progress.mjs','shared/reward-assets.mjs','shared/gallery-assets.mjs','shared/award-catalog.mjs','shared/word-card.mjs','shared/word-badge-assets.mjs','shared/test-profiles.mjs','shared/input-lock.mjs','shared/compiled-runtime.mjs','shared/view-contracts.mjs','shared/view-bindings.mjs','shared/view-contract-mount.mjs','shared/pin-parts-contract.mjs','shared/spelling-overlays.mjs','shared/spelling-settings-contract.mjs','shared/element-styles.mjs','shared/type-system.mjs','shared/atom-vocabulary.mjs','shared/runtime-blocks.mjs','shared/english-word-flip.mjs','shared/behaviors.mjs','design-system/behaviors-model.mjs','shared/navigation-parts.mjs','shared/navigation-parts.css','shared/spelling-word.css','spelling/word-reveal.mjs','shared/sound-themes.mjs','shared/mode-host.mjs','module-router.js','matematyka/round-timer.js','ortografia/wizard-v2.mjs','ortografia/wizard-retina.css','czytanie/wizard-v2.mjs','czytanie/wizard-retina.css','angielski/wizard-v2.mjs','angielski/wizard-retina.css','flagi/adventure-game.mjs','flagi/setup-retina.css','shared/atomic-config.mjs','shared/mission-parts.mjs','shared/mission-parts.css','shared/screen-blob-transition.mjs','shared/home-layout.mjs','shared/home-atoms.mjs','shared/profile-parts.mjs','shared/part-recipes.mjs','shared/structure-model.mjs','shared/screen-readiness.mjs','shared/building-blocks.mjs','shared/navigation.mjs','shared/state-motion.mjs','shared/round-result.css','spelling/fireworks.mjs','shared/surface-effects.mjs','shared/surface-effects.css','shared/logo-transition.mjs','boot-ui.mjs','boot-loader.css','boot-overlay.css','shared/element-motion.mjs','spelling/word-particles.mjs','spelling/word-particles.css','spelling/combo-global.mjs','spelling/combo-global.css','shared/rule-groups.mjs','spelling/bubble-dynamics.mjs','shared/element-system.mjs','shared/flow-model.mjs','home-screen.mjs','home-screen.css','progress-screen.mjs','progress-screen.css','design-system/config.json','design-system/word-batches.json','design-system/rules.json','design-system/assets.json','design-system/registry.json','design-system/view-inventory-snapshots.mjs','design-system/audit.json','design-system/model.mjs','design-system/project-model.mjs','shared/discovery-model.mjs','shared/screen-copy.mjs','design-system/preview-model.mjs','design-system/validation.mjs','design-system/bridge.mjs','design-system/studio-bridge.mjs','shared/design-runtime.mjs','shared/asset-loader.mjs','shared/rules-library.mjs','shared/screen-motion.mjs','shared/sound-library.mjs','shared/sound-runtime.mjs','shared/sound-map.mjs','shared/sound-worker.mjs','shared/component-recipes.mjs','shared/components.css','shared/jelly-v4.css','shared/jelly-v4.mjs','shared/mastery.mjs','shared/scroll-edges.mjs','spelling/scenes.mjs','spelling/continue-drag.mjs','spelling/word-pools.mjs','spelling/effect-model.mjs','spelling/performance-model.mjs','spelling/response-effects.mjs','spelling/scoring.mjs','spelling/round.mjs','spelling/art.mjs','spelling/bubble.mjs','spelling/bubble-renderer.mjs','spelling/bubble-html.mjs','spelling/bubble-html.css','spelling/dictation.mjs','game.mjs','modes.mjs','progress.mjs','ortografia/result-screen.mjs','ortografia/result-attempts.mjs','ortografia/result-rules.mjs'];
centralFiles.push('shared/campaign-narrator.mjs','shared/campaign-narrator-model.mjs','shared/campaign-narrator-asset.mjs','shared/campaign-narrator.css','shared/campaign-field-magic.mjs','shared/campaign-field-magic.css','shared/campaign-book.mjs','shared/campaign-book-model.mjs','shared/campaign-book-content.mjs','shared/campaign-book-asset.mjs','shared/campaign-book.css','shared/campaign-light.mjs','shared/campaign-card-motion.mjs','shared/campaign-rating.mjs','shared/campaign-stars.mjs','shared/campaign-stars.css','shared/campaign-story.mjs','shared/campaign-portal.mjs','shared/reward-effects.mjs','shared/reward-effects.css','matematyka/campaign.mjs','shared/campaign-tiles.mjs','shared/campaign-viewport.mjs','shared/campaign-lab.mjs','design-system/edit-session.mjs','shared/campaign-round.mjs','shared/adventure-contract.mjs','shared/isometric-assets.mjs','shared/campaign-layout.mjs','shared/campaign-scene.mjs','shared/campaign-discovery.mjs','shared/campaign-puzzle.mjs','shared/adventure-model.mjs','shared/adventure-ui.mjs','shared/adventure.css','shared/adventure-assets.mjs','shared/discovery-cards.mjs','shared/responsive-geometry.mjs','shared/game-chrome.css','shared/map-coverage.mjs','design-system/studio-adventure.mjs','design-system/studio-adventure.css','shared/scenic-contract.mjs','shared/map-overrides.mjs','data/flags/capitals-en.mjs',...(await readdir(resolve(root,'flagi'))).filter(name=>name.startsWith('scenic-')).map(name=>'flagi/'+name));
// A consumer must receive the page renderer and its new atlas dependencies together.
centralFiles.push('shared/campaign-peek-assets.mjs','shared/campaign-book-magic.mjs','shared/campaign-book-ink.mjs','shared/campaign-manuscript.mjs','shared/campaign-manuscript-assets.mjs');
const files=new Map();
let deploymentSHA=process.env.VERCEL_GIT_COMMIT_SHA;try{deploymentSHA||=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();}catch{}
async function walk(dir){for(const item of await readdir(dir,{withFileTypes:true})){if(['.git','dist','node_modules','outputs','.design-qa','docs','tests','tools'].includes(item.name)||item.name.startsWith('.'))continue;const path=resolve(dir,item.name);if(item.isDirectory()){if(consumer&&relative(root,path)==='assets')continue;await walk(path);}else if(!/\.(md|py)$/.test(path)){files.set(relative(root,path).split('\\').join('/'),await readFile(path));}}}
await walk(root);
// Scene archive is frozen on assets/library-v1 and hosted separately.
// Do not package its 400+ unchanged illustrations into every UI preview.
// CI tests use a plain local HTTP server with no Vercel rewrites, so their
// compiled preview must include scenes. Only an actual hosted V2 deployment
// removes them and serves the archive via the configured Vercel rewrite.
const externalSceneLibrary=studioV2&&Boolean(process.env.VERCEL);
const externalFlagLibrary=studioV2&&Boolean(process.env.VERCEL);
if(externalFlagLibrary){
 const response=await fetch(FLAG_ARCHIVE_INDEX,{cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('Biblioteka SVG flag nie odpowiada: HTTP '+response.status);
 // Compare 256 paths and hashes against the actual immutable archive.
 // Never ship a missing flag behind an optimistic Vercel rewrite.
 assertFlagArchive(JSON.parse(files.get('design-system/assets.json').toString()),await response.json());
}
// Immutable managed graphics are released on the asset branch before their
// V2 metadata commit. Verify the actual CDN catalog at build time.
if(externalSceneLibrary){
 const archive=await readPublishedCatalog();
 assertScenicArchive(JSON.parse(await readFile(resolve(root,'design-system/scenic-assets.json'),'utf8')),archive);
 const current=JSON.parse(files.get('design-system/assets.json').toString());
 assertPublishedAssets(current.assets.filter(asset=>/\.(?:png|jpe?g|webp|avif|svg|woff2?)$/i.test(asset.path)),archive);
}
if(externalSceneLibrary)for(const path of [...files.keys()])if(path.startsWith('assets/scenes/'))files.delete(path);
if(externalSceneLibrary)for(const path of [...files.keys()])if(path.startsWith('assets/managed/'))files.delete(path);
if(externalFlagLibrary)for(const path of [...files.keys()])if(isFrozenFlagFile(path))files.delete(path);
// Every graphic is served by the one archive. Local plain-HTTP QA retains copies.
if(externalSceneLibrary)for(const path of [...files.keys()])if(/^assets\/.+\.(?:png|jpe?g|webp|avif|svg)$/i.test(path))files.delete(path);
files.set('design-system/deployment.json',Buffer.from(JSON.stringify({schemaVersion:1,builtAt:new Date().toISOString(),sha:/^[0-9a-f]{40}$/.test(deploymentSHA||'')?deploymentSHA:null,branch,studioBranch:studioV2?declaredStudioBranch:null,consumer,assetLibraryOrigin:externalSceneLibrary?'https://mala-nauka-assets.vercel.app/':null,contentSource:consumer?source:null,deploymentUrl:process.env.VERCEL_URL||null,branchUrl:process.env.VERCEL_BRANCH_URL||null})));
const localSource=process.env.DS_SOURCE_DIR;
if(consumer)for(const path of centralFiles){if(localSource){files.set(path,await readFile(resolve(localSource,path)));continue;}const response=await fetch(new URL(path,source),{signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error(`Brak centralnego kontraktu (${response.status}): ${path}`);files.set(path,Buffer.from(await response.arrayBuffer()));}
if(consumer){const app=files.get('app.js')?.toString()||'';if(app.includes('data/words-0')&&!/const parts=await Promise/.test(app))throw Error('Zaktualizuj adapter bazy słów dla tego konsumenta.');}
const catalog=JSON.parse(files.get('design-system/assets.json').toString());
if(catalog.schemaVersion!==1)throw Error('Nieobsługiwany kontrakt assetów.');
const assetBase=consumer?source:'/';
const assetURL=path=>new URL(catalog.aliases[path]||path,consumer?source:'https://local.invalid/').href.replace('https://local.invalid','');
// Convert the old font aliases without changing each renderer's typography role.
function fonts(css){return css.replace(/@font-face\s*\{[^}]*\}\s*/g,face=>/font-family:\s*(?:Scenic|CampaignQuill)/.test(face)?face:'').replace(/font-family\s*:\s*["']?(ResultBody|MN Soft|Flag Body)["']?/g,'font-family:var(--ds-font-body)').replace(/font-family\s*:\s*["']?(ResultDisplay|Spelling)["']?/g,'font-family:var(--ds-font-display)').replace(/font-family\s*:\s*["']?Home Rounded["']?/g,'font-family:var(--ds-font-ui)').replace(/font-family\s*:\s*["']?Flag Display["']?/g,'font-family:var(--ds-font-flag)');}
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
  let html=bytes.toString();
  if(branch==='studio/pwa-test'&&JSON.parse(files.get('design-system/config.json').toString()).testing?.includeProfiles)html=html.replace('</head>','<script>window.__MN_TEST_PROFILES__=true</script></head>');const baseMatch=html.match(/<base\s+href=['"]([^'"]+)['"]/),base=baseMatch?posix.normalize(posix.join(posix.dirname(path),baseMatch[1])):posix.dirname(path);
  if(consumer)html=assetReferences(html);
  if(path==='design-system/index.html'&&studioV2)
   html=html.replace('</head>','<script>window.__DS_STUDIO_BRANCH__='+JSON.stringify(declaredStudioBranch)+'</script></head>');
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
const core=selectOfflineCore([...files.keys()].filter(path=>path!=='sw.js'),path=>files.get(path)?.toString());
const coreCacheBytes=core.reduce((sum,path)=>sum+(files.get(path)?.byteLength||0),0);
const assetBudget=offlineAssetBudget(catalog.assets);
// Cache only a small starting kit; lesson illustrations enter the cache on demand.
const assetsToCache=selectOfflineBootstrapAssets(catalog.assets).map(asset=>assetURL(asset.path));
if(consumer){assetsToCache.push(new URL('design-system/rules.json',source).href,new URL('design-system/config.json',source).href,new URL('design-system/assets.json',source).href);for(let batch=1;batch<=8;batch++)assetsToCache.push(new URL(`data/words-0${batch}.json`,source).href);}
const sw=buildServiceWorker({hash:buildHash,core:core.map(path=>'/'+path),bootstrap:assetsToCache,networkFirst:branch==='studio/pwa-test',contentOrigin:consumer?source:''});
await writeFile(resolve(out,'sw.js'),sw);
console.log(JSON.stringify({branch,consumer,assetOrigin:assetBase,files:files.size,bundledPages:bundled,removedRepeatedCSSBytes:removedCSSBytes,sourceAssetCopies:[...files.keys()].filter(path=>path.startsWith('assets/')).length,externalSceneLibrary,externalFlagLibrary,offlineBootstrapCount:assetBudget.bootstrapCount,offlineBootstrapBytes:assetBudget.bootstrapBytes,offlineDeferredBytes:assetBudget.deferredBytes,coreCacheFiles:core.length,coreCacheBytes,buildHash}));
