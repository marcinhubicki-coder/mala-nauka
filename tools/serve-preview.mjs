import {validateWords} from '../game.mjs';
// Local source/compiled preview, external library fallback and narrow map saves.
import {createServer} from 'node:http';
import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {ASSET_ORIGIN} from '../design-system/library-publish.mjs';
import {createHash} from 'node:crypto';
import {validateConfig} from '../design-system/model.mjs';
import {validateAssets} from '../design-system/validation.mjs';
import {validateRules} from '../shared/rules-library.mjs';
import {validateBatches} from '../design-system/batch-model.mjs';
import {validateMapOverrides} from '../shared/map-overrides.mjs';
const root=resolve(process.argv.includes('--source')?'.':'dist'),port=Number(process.argv[2]||8765),assetRoot=process.env.MN_SCENIC_ASSETS?resolve(process.env.MN_SCENIC_ASSETS):null;
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.avif':'image/avif','.woff':'font/woff','.woff2':'font/woff2','.webmanifest':'application/manifest+json','.data':'application/octet-stream'};
async function localMapSave(req,res){
 if(req.method!=='POST'||req.headers.origin&&req.headers.origin!==`http://127.0.0.1:${port}`){res.writeHead(403);res.end();return;}
 let text='';for await(const chunk of req){text+=chunk;if(text.length>65536){res.writeHead(413);res.end();return;}}
 const body=JSON.parse(text);validateMapOverrides({[body.country]:body.entry||{}});const source=resolve('design-system/config.json'),config=JSON.parse(await readFile(source,'utf8'));
 const overrides=structuredClone(config.mapOverrides||{});if(body.entry===null)delete overrides[body.country];else overrides[body.country]=body.entry;
 validateMapOverrides(overrides);config.mapOverrides=overrides;
 const bytes=JSON.stringify(config,null,2)+'\n';await writeFile(source+'.tmp',bytes);await rename(source+'.tmp',source);
 if(resolve(root,'design-system/config.json')!==source)await writeFile(resolve(root,'design-system/config.json'),bytes);
 res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify({saved:true,mapOverrides:overrides}));
}
async function localDesignSave(req,res){
 if(req.method!=='POST'||req.headers.origin&&req.headers.origin!==`http://127.0.0.1:${port}`){res.writeHead(403);res.end();return;}
 let raw='';for await(const chunk of req){raw+=chunk;if(raw.length>64*1048576){res.writeHead(413);res.end();return;}}
 const body=JSON.parse(raw),rows=[['config.json',validateConfig,body.config],['assets.json',validateAssets,body.assets],['rules.json',validateRules,body.rules],['word-batches.json',validateBatches,body.batches]].filter(r=>r[2]);
 if(!body.config)throw Error('Missing local design');for(const [,check,value]of rows)check(value);
 const wordEdits=body.wordEdits||[];if(!Array.isArray(wordEdits)||wordEdits.some(r=>!/^data\/words-0[1-8]\.json$/.test(r.path)||!Array.isArray(r.value)))throw Error('Nieprawidłowa paczka słów.');
 if(wordEdits.length){const packs=await Promise.all(Array.from({length:8},async(_,i)=>{const path='data/words-0'+(i+1)+'.json',edit=wordEdits.find(r=>r.path===path);return edit?.value||JSON.parse(await readFile(path,'utf8'));}));validateWords(packs.flat());}

 for(const upload of body.uploads||[]){if(!/^assets\/managed\/[a-f0-9]{64}\.(png|webp|jpg|avif|svg)$/.test(upload.path)||!Array.isArray(upload.bytes))throw Error('Invalid asset');const bytes=Buffer.from(upload.bytes),sha=createHash('sha256').update(bytes).digest('hex');if(!upload.path.includes(sha)||!body.assets.assets.some(a=>a.path===upload.path&&a.sha===sha&&a.size===bytes.length))throw Error('Asset checksum mismatch');for(const dir of new Set([resolve('.'),root])){const path=resolve(dir,upload.path);await mkdir(resolve(path,'..'),{recursive:true});await writeFile(path,bytes);}}
 for(const [name,,value]of rows){const bytes=JSON.stringify(value,null,2)+'\n';for(const dir of new Set([resolve('.'),root])){const path=resolve(dir,'design-system',name);await writeFile(path+'.tmp',bytes);await rename(path+'.tmp',path);}}
 for(const edit of wordEdits)for(const dir of new Set([resolve('.'),root])){const path=resolve(dir,edit.path);await writeFile(path+'.tmp',JSON.stringify(edit.value,null,2)+'\n');await rename(path+'.tmp',path);}
 res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify({saved:true,revision:body.config.revision}));
}
let queue=Promise.resolve();
const serial=job=>{const result=queue.then(job);queue=result.catch(()=>{});return result;};
createServer(async(req,res)=>{try{
 const pathname=new URL(req.url,'http://localhost').pathname;
 if(pathname==='/__local/map-overrides'){await serial(()=>localMapSave(req,res));return;}
 if(pathname==='/__local/design'){await serial(()=>localDesignSave(req,res));return;}
 let path=decodeURIComponent(pathname).slice(1);if(!path||path.endsWith('/'))path+='index.html';
 const file=resolve(root,path);if(!file.startsWith(root+sep)){res.writeHead(400);res.end();return;}
 let bytes,type=types[extname(file)]||'application/octet-stream';
 try{bytes=await readFile(file);}catch(error){
  if(error.code!=='ENOENT'||!path.startsWith('assets/'))throw error;
  if(assetRoot){const fallback=resolve(assetRoot,path);if(!fallback.startsWith(assetRoot+sep))throw error;try{bytes=await readFile(fallback)}catch(e){if(e.code!=='ENOENT')throw e;}}
  if(!bytes){const response=await fetch(new URL(path,ASSET_ORIGIN),{signal:AbortSignal.timeout(20000),redirect:'error'});if(!response.ok){res.writeHead(response.status);res.end();return;}bytes=Buffer.from(await response.arrayBuffer());type=response.headers.get('content-type')||type;}
 }
 res.writeHead(200,{'content-type':type,'cache-control':'no-cache'});res.end(bytes);
}catch(error){res.writeHead(error.code==='ENOENT'?404:400);res.end('Preview resource unavailable');}}).listen(port,'127.0.0.1',()=>console.log('Preview on http://127.0.0.1:'+port+' (map saves: local only)'));
