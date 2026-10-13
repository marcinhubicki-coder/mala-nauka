// A deliberately infrequent, asset-only release: normal PWA previews do not rebuild this archive.
import {cp,rm,mkdir,readdir,stat,readFile,writeFile} from 'node:fs/promises';
import {join,relative,dirname} from 'node:path';
import {createHash} from 'node:crypto';
const root=process.cwd(),out=join(root,'dist');
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
await cp(join(root,'assets'),join(out,'assets'),{recursive:true});
const rows=[];
async function walk(folder){for(const entry of await readdir(folder,{withFileTypes:true})){const path=join(folder,entry.name);if(entry.isDirectory())await walk(path);else if(entry.isFile()){const contents=await readFile(path);const rel=relative(out,path).replaceAll('\\','/');rows.push({path:rel,size:contents.length,sha256:createHash('sha256').update(contents).digest('hex')});}}}
await walk(join(out,'assets'));rows.sort((a,b)=>a.path.localeCompare(b.path));
const manifest={schemaVersion:1,sourceCommit:process.env.VERCEL_GIT_COMMIT_SHA||null,files:rows};
await writeFile(join(out,'asset-catalog.json'),JSON.stringify(manifest));
console.log(JSON.stringify({assetOnly:true,fileCount:rows.length,bytes:rows.reduce((sum,r)=>sum+r.size,0)}));
