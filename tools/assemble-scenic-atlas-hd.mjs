// Authoring only: join overlapping imagegen detail reconstructions into ONE
// registered atlas. Runtime never requests individual tiles.
import sharp from 'sharp';
import {readFile} from 'node:fs/promises';
const [manifestPath,output]=process.argv.slice(2);
if(!manifestPath||!output)throw Error('Usage: node tools/assemble-scenic-atlas-hd.mjs manifest.json output.webp');
const {W,H,tiles}=JSON.parse(await readFile(manifestPath,'utf8')),scale=2.5,width=Math.round(W*scale),height=Math.round(H*scale);
const sum=new Float32Array(width*height*3),weights=new Float32Array(width*height);
for(const tile of tiles){
 const left=Math.round(tile.x*scale),top=Math.round(tile.y*scale),w=Math.round((tile.x+tile.w)*scale)-left,h=Math.round((tile.y+tile.h)*scale)-top;
 const pixels=await sharp(tile.image).resize(w,h,{fit:'fill'}).removeAlpha().raw().toBuffer();
 const featherX=w*.25,featherY=h*.25;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const wx=Math.min(1,tile.col?Math.max(.001,x/featherX):1,tile.col<2?Math.max(.001,(w-1-x)/featherX):1),wy=Math.min(1,tile.row?Math.max(.001,y/featherY):1,tile.row<2?Math.max(.001,(h-1-y)/featherY):1),weight=wx*wy,p=(top+y)*width+left+x,k=p*3,j=(y*w+x)*3;
  weights[p]+=weight;for(let c=0;c<3;c++)sum[k+c]+=pixels[j+c]*weight;
 }
}
const data=Buffer.alloc(width*height*3);
for(let p=0;p<weights.length;p++){if(!weights[p])throw Error('Uncovered atlas pixel');for(let c=0;c<3;c++)data[p*3+c]=Math.round(sum[p*3+c]/weights[p]);}
await sharp(data,{raw:{width,height,channels:3}}).webp({quality:96,effort:6}).toFile(output);
console.log(JSON.stringify({width,height,tiles:tiles.length,output}));
