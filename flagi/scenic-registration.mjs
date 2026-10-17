// Local texture registration: one decoded image, one prepared UV mesh, reused
// by both cameras. All overlays keep the canonical Natural Earth coordinates.
const kernel=(x,y)=>{const r=x*x+y*y;return r?r*Math.log(r):0;};
function coefficients(pairs){
 const n=pairs.length,m=n+3,rows=pairs.map((p,i)=>[...pairs.map(q=>kernel(p.to[0]-q.to[0],p.to[1]-q.to[1])),1,...p.to,p.from[0]-p.to[0],p.from[1]-p.to[1]]);
 for(let j=0;j<3;j++)rows.push([...pairs.map(p=>j?p.to[j-1]:1),0,0,0,0,0]);
 for(let i=0;i<n;i++)rows[i][i]+=.5;
 for(let k=0;k<m;k++){
  let pivot=k;for(let j=k+1;j<m;j++)if(Math.abs(rows[j][k])>Math.abs(rows[pivot][k]))pivot=j;
  [rows[k],rows[pivot]]=[rows[pivot],rows[k]];const value=rows[k][k];
  for(let j=k;j<m+2;j++)rows[k][j]/=value;
  for(let i=0;i<m;i++)if(i!==k){const f=rows[i][k];for(let j=k;j<m+2;j++)rows[i][j]-=f*rows[k][j];}
 }
 return (x,y)=>{const v=[...pairs.map(p=>kernel(x-p.to[0],y-p.to[1])),1,x,y];return [x+v.reduce((s,v,i)=>s+v*rows[i][m],0),y+v.reduce((s,v,i)=>s+v*rows[i][m+1],0)];};
}
export function registerAtlasImage(image,{pairs,region}){
 const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;const c=canvas.getContext('2d'),sx=canvas.width/680,sy=canvas.height/500,uv=coefficients(pairs);
 c.drawImage(image,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 function triangle(points){
  const dst=points.map(([x,y])=>[x*sx,y*sy]),src=points.map(p=>{const q=uv(...p);return [q[0]*sx,q[1]*sy];});
  const [[x0,y0],[x1,y1],[x2,y2]]=src,[[u0,v0],[u1,v1],[u2,v2]]=dst;
  const d=x0*(y1-y2)+x1*(y2-y0)+x2*(y0-y1);
  const a=(u0*(y1-y2)+u1*(y2-y0)+u2*(y0-y1))/d,b=(v0*(y1-y2)+v1*(y2-y0)+v2*(y0-y1))/d;
  const cc=(u0*(x2-x1)+u1*(x0-x2)+u2*(x1-x0))/d,dd=(v0*(x2-x1)+v1*(x0-x2)+v2*(x1-x0))/d;
  const e=u0-a*x0-cc*y0,f=v0-b*x0-dd*y0;
  c.save();c.beginPath();const center=[(u0+u1+u2)/3,(v0+v1+v2)/3];dst.forEach(([x,y],i)=>{const d=Math.hypot(x-center[0],y-center[1]),p=[x+(x-center[0])/d*.45,y+(y-center[1])/d*.45];if(i)c.lineTo(...p);else c.moveTo(...p);});c.closePath();c.clip();c.setTransform(a,b,cc,dd,e,f);c.drawImage(image,0,0);c.restore();
 }
 const step=4;
 for(let y=region.y;y<region.y+region.h;y+=step)for(let x=region.x;x<region.x+region.w;x+=step){const right=Math.min(x+step,region.x+region.w),bottom=Math.min(y+step,region.y+region.h);triangle([[x,y],[right,y],[right,bottom]]);triangle([[x,y],[right,bottom],[x,bottom]]);}
 Object.defineProperties(canvas,{naturalWidth:{value:canvas.width},naturalHeight:{value:canvas.height}});return canvas;
}
