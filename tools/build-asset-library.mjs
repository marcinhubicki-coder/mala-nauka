// Asset branch build: publish only images and their verified public index.
import {cp,rm,mkdir,readdir,readFile,writeFile} from 'node:fs/promises';
import {join,relative,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

export async function buildAssetLibrary(root,out=join(root,'dist'),sourceCommit=process.env.VERCEL_GIT_COMMIT_SHA||null){
 let source;
 try{source=JSON.parse(await readFile(join(root,'asset-catalog.json'),'utf8'));}
 catch(error){if(error.code!=='ENOENT')throw error;source={schemaVersion:1,files:[]};}
 if(source.schemaVersion!==1||!Array.isArray(source.files))throw Error('Nieprawidłowy indeks biblioteki.');
 const metadata=new Map(source.files.map(file=>[file.path,file]));
 if(metadata.size!==source.files.length)throw Error('Powtórzona ścieżka w indeksie biblioteki.');
 await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
 await cp(join(root,'assets'),join(out,'assets'),{recursive:true});
 const files=[];
 async function walk(folder){for(const entry of await readdir(folder,{withFileTypes:true})){
  const path=join(folder,entry.name);
  if(entry.isDirectory())await walk(path);
  else if(entry.isFile()){
   const contents=await readFile(path),name=relative(out,path).replaceAll('\\','/');
   const sha256=createHash('sha256').update(contents).digest('hex'),record={path:name,size:contents.length,sha256};
   const managed=/^assets\/managed\/([0-9a-f]{64})\./.exec(name);
   if(managed&&managed[1]!==sha256)throw Error('Niezgodny hash pliku biblioteki: '+name);
   const meta=metadata.get(name);
   if(meta){
    if(meta.sha256!==sha256||meta.size!==record.size)throw Error('Niezgodny indeks biblioteki: '+name);
    if(Number.isInteger(meta.width)&&meta.width>0&&Number.isInteger(meta.height)&&meta.height>0)Object.assign(record,{width:meta.width,height:meta.height});
   }
   files.push(record);
  }
 }}
 await walk(join(out,'assets'));files.sort((a,b)=>a.path.localeCompare(b.path));
 const actual=new Set(files.map(file=>file.path));
 for(const path of metadata.keys())if(!actual.has(path))throw Error('Brak pliku z indeksu biblioteki: '+path);
 const manifest={schemaVersion:1,sourceCommit,files};
 await writeFile(join(out,'asset-catalog.json'),JSON.stringify(manifest));
 return manifest;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const manifest=await buildAssetLibrary(process.cwd());
 console.log(JSON.stringify({assetOnly:true,fileCount:manifest.files.length,bytes:manifest.files.reduce((sum,file)=>sum+file.size,0)}));
}
