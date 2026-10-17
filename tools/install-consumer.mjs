import {readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {execFileSync} from 'node:child_process';
const sourceRoot=resolve(new URL('../',import.meta.url).pathname),target=resolve(process.argv[2]||'');
if(!process.argv[2]||target===sourceRoot)throw Error('Podaj osobny checkout brancha konsumenta.');
const branch=execFileSync('git',['branch','--show-current'],{cwd:target,encoding:'utf8'}).trim();
if(branch==='design/system-v1'||branch==='main')throw Error('Integrator jest przeznaczony dla branchy roboczych. Main integrowany jest osobnym przeglądem.');
for(const file of ['tools/build-design.mjs','vercel.json']){await mkdir(dirname(resolve(target,file)),{recursive:true});await writeFile(resolve(target,file),await readFile(resolve(sourceRoot,file)));}
await writeFile(resolve(target,'package.json'),JSON.stringify({name:'mala-nauka-consumer',private:true,type:'module',scripts:{build:'node tools/build-design.mjs', 'design:check':'node tools/build-design.mjs --consumer'}},null,2)+'\n');
await mkdir(resolve(target,'design-system'),{recursive:true});
await writeFile(resolve(target,'design-system/consumer.json'),JSON.stringify({schemaVersion:1,sourceBranch:'design/system-v1',sourceURL:'https://raw.githubusercontent.com/marcinhubicki-coder/mala-nauka/design/system-v1/',liveConfig:true,localAssets:false,liveRules:true,screenMotion:true,automaticPools:true,responseEffects:true,scoring:true,categoryDifficulties:true,componentRecipes:true},null,2)+'\n');
await rm(resolve(target,'assets'),{recursive:true,force:true});
for(let batch=1;batch<=8;batch++)await rm(resolve(target,`data/words-0${batch}.json`),{force:true});
let ignore='';try{ignore=await readFile(resolve(target,'.gitignore'),'utf8');}catch{}
for(const line of ['dist/','node_modules/'])if(!ignore.split('\n').includes(line))ignore+='\n'+line;
await writeFile(resolve(target,'.gitignore'),ignore.trim()+'\n');
console.log(JSON.stringify({branch,centralSource:'design/system-v1',removedLocalAssets:true}));
