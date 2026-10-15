// Match hosted library rewrites when serving a local compiled preview.
// New library-only illustrations are never copied into the app source/build.
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {ASSET_ORIGIN} from '../design-system/library-publish.mjs';
const root=resolve('dist'),port=Number(process.argv[2]||8765);
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.avif':'image/avif','.woff':'font/woff','.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
createServer(async(req,res)=>{
 try{
  let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname).slice(1);
  if(!path||path.endsWith('/'))path+='index.html';
  const file=resolve(root,path);if(!file.startsWith(root+sep)){res.writeHead(400);res.end();return;}
  let bytes,type=types[extname(file)]||'application/octet-stream';
  try{bytes=await readFile(file);}
  catch(error){
   if(error.code!=='ENOENT'||!/^assets\/(managed|scenes|flags)\//.test(path))throw error;
   const response=await fetch(new URL(path,ASSET_ORIGIN),{signal:AbortSignal.timeout(20000),redirect:'error'});
   if(!response.ok){res.writeHead(response.status);res.end();return;}
   bytes=Buffer.from(await response.arrayBuffer());type=response.headers.get('content-type')||type;
  }
  res.writeHead(200,{'content-type':type});res.end(bytes);
 }catch(error){res.writeHead(error.code==='ENOENT'?404:502);res.end('Preview resource unavailable');}
}).listen(port,'127.0.0.1',()=>console.log('Preview on http://127.0.0.1:'+port));
