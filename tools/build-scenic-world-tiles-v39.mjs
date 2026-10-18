import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const {default:sharp}=await import(process.env.SCENIC_SHARP_MODULE||'sharp');
// Usage: node tools/build-scenic-world-tiles-v39.mjs AUTHOR_DIRECTORY OUTPUT_DIRECTORY WATER_SOURCE
const dir=process.argv[2],target=process.argv[3],waterSource=process.argv[4];
if(!dir||!target||!waterSource)throw Error('Provide author directory (master-land.png and hd-jobs.json), output directory and painted water source');
const spec=JSON.parse(await fs.readFile(dir+'/hd-jobs.json'));
const {width,height,pixelScale,origin}=spec,tileSize=512,gutter=2;
await fs.mkdir(target,{recursive:true});
// Exact periodic edges, without mirror motifs. This is technical packaging
// of the painted water source, not repeated land artwork.
const size=512,water=await sharp(waterSource).resize(size,size).removeAlpha().raw().toBuffer();
for(let y=0;y<size;y++)for(let c=0;c<3;c++){const left=water[(y*size)*3+c],right=water[(y*size+size-1)*3+c],delta=right-left;for(let x=0;x<size;x++)water[(y*size+x)*3+c]=Math.max(0,Math.min(255,water[(y*size+x)*3+c]-(x/(size-1)-.5)*delta));}
for(let x=0;x<size;x++)for(let c=0;c<3;c++){const top=water[x*3+c],bottom=water[((size-1)*size+x)*3+c],delta=bottom-top;for(let y=0;y<size;y++)water[(y*size+x)*3+c]=Math.max(0,Math.min(255,water[(y*size+x)*3+c]-(y/(size-1)-.5)*delta));}
await sharp(water,{raw:{width:size,height:size,channels:3}}).webp({quality:76,effort:6}).toFile(target+'/water.webp');
if(process.argv.includes('--water-only'))process.exit(0);
const manifest={version:39,base:'assets/maps/atlas-world-v39/',projection:'equirectangular, identical coordinates to atlas-world-v39.data',width,height,pixelScale,origin,tileSize,gutter,levels:[],files:{},masterSHA256:crypto.createHash('sha256').update(await fs.readFile(dir+'/master-land.png')).digest('hex')};
let totalBytes=0,totalTiles=0;
for(let id=0;id<=4;id++){
 const factor=2**(4-id),w=width/factor,h=height/factor,level={id,scale:pixelScale/factor,width:w,height:h,cols:Math.ceil(w/tileSize),rows:Math.ceil(h/tileSize),available:[]};
 await fs.mkdir(target+'/'+id,{recursive:true});const image=await sharp(dir+'/master-land.png').resize(w,h).ensureAlpha().raw().toBuffer();
 const jobs=[];
 for(let y=0;y<level.rows;y++)for(let x=0;x<level.cols;x++){
  const cx=x*tileSize,cy=y*tileSize,cw=Math.min(tileSize,w-cx),ch=Math.min(tileSize,h-cy);let land=false;
  for(let yy=cy;yy<cy+ch&&!land;yy++)for(let xx=cx;xx<cx+cw;xx++)if(image[(yy*w+xx)*4+3]){land=true;break;}if(!land)continue;
  const left=Math.max(0,cx-gutter),top=Math.max(0,cy-gutter),right=Math.min(w,cx+cw+gutter),bottom=Math.min(h,cy+ch+gutter),tw=right-left,th=bottom-top,key=x+'-'+y;
  level.available.push(key);jobs.push({key,left,top,width:tw,height:th});
 }
 for(let i=0;i<jobs.length;i+=4)await Promise.all(jobs.slice(i,i+4).map(async j=>{
  const filename=id+'/'+j.key+'.webp',buffer=await sharp(image,{raw:{width:w,height:h,channels:4}}).extract({left:j.left,top:j.top,width:j.width,height:j.height}).webp({quality:id===4?83:79,alphaQuality:100,effort:6}).toBuffer();
  await fs.writeFile(target+'/'+filename,buffer);manifest.files[filename]={bytes:buffer.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex')};totalBytes+=buffer.length;totalTiles++;
 }));
 manifest.levels.push(level);console.log('level',id,level.available.length,'land tiles');
}
manifest.totalBytes=totalBytes;manifest.totalTiles=totalTiles;
await fs.writeFile(target+'/manifest.json',JSON.stringify(manifest));console.log(JSON.stringify({tiles:totalTiles,bytes:totalBytes}));
