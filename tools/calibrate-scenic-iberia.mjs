// Calibrate the illustration's UV coordinates against the canonical coastline.
// This does not change country geometry or repaint/replace the artwork.
import sharp from 'sharp';
import fs from 'node:fs/promises';
const W=1360,H=1000,s=2;
const svg=(await fs.readFile('assets/maps/europe-atlas-v26.svg','utf8')).replace('viewBox="0 0 680 500"',`width="${W}" height="${H}" viewBox="0 0 680 500"`).replace('fill="#dfe7ef" stroke="#fff"','fill="#fff" stroke="none"');
const canonical=await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer();
const art=await sharp('assets/maps/europe-painted-v27.webp').resize(W,H).removeAlpha().raw().toBuffer();
const target=new Uint8Array(W*H),water=new Uint8Array(W*H),queue=new Int32Array(W*H);
for(let i=0;i<water.length;i++){target[i]=canonical[i*4+3]>128?1:0;const [r,g,b]=art.subarray(i*3,i*3+3);water[i]=b>r*.95&&b>g*.84?1:0;}
const sea=new Uint8Array(W*H);let start=0,end=0;
function visit(i){if(i>=0&&i<water.length&&water[i]&&!sea[i]){sea[i]=1;queue[end++]=i;}}
for(let x=0;x<W;x++){visit(x);visit((H-1)*W+x);}for(let y=0;y<H;y++){visit(y*W);visit(y*W+W-1);}
while(start<end){const i=queue[start++];if(i%W)visit(i-1);if(i%W<W-1)visit(i+1);visit(i-W);visit(i+W);}
const source=[],dest=[];
for(let y=322*s;y<446*s;y++)for(let x=118*s;x<244*s;x++){
 const i=y*W+x;
 if(!sea[i]&&[i-1,i+1,i-W,i+W].some(j=>sea[j]))source.push([x/s,y/s]);
 if(target[i]&&[i-1,i+1,i-W,i+W].some(j=>!target[j]))dest.push([x/s,y/s]);
}
const pairs=[],used=[];
for(const p of dest){
 if(used.some(q=>Math.hypot(p[0]-q[0],p[1]-q[1])<4))continue;
 let q,best=18**2;
 for(const candidate of source){const d=(candidate[0]-p[0])**2+(candidate[1]-p[1])**2;if(d<best){best=d;q=candidate;}}
 if(!q)continue;
 used.push(p);pairs.push({to:p,from:q});
}
// Fixed outer anchors keep France, North Africa, and the rest of the atlas stable.
for(let x=110;x<=260;x+=15)for(const y of [312,457])pairs.push({to:[x,y],from:[x,y]});
for(let y=327;y<457;y+=15)for(const x of [110,260])pairs.push({to:[x,y],from:[x,y]});
const calibration={version:28,source:'europe-painted-v27.webp',reference:'europe-atlas-v26.svg',region:{x:110,y:312,w:150,h:145},method:'Coastline landmark UV registration; canonical geometry unchanged',pairs};
await fs.writeFile('assets/maps/europe-iberia-registration-v28.json',JSON.stringify(calibration));
console.log({coastLandmarks:used.length,fixedAnchors:pairs.length-used.length,maxDisplacement:Math.max(...pairs.map(p=>Math.hypot(p.to[0]-p.from[0],p.to[1]-p.from[1])))});
