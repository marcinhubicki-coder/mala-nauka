// Cameras preserve the viewport ratio. Near views are centered on the main
// country polygon; overview covers the painted continent instead of containing
// it in a larger transparent rectangle.
export function nearAtlasFrame(box,width,height){
 const ratio=width/height;
 const w=Math.max(box.w*1.64,box.h*ratio*1.64,box.w<5?56:88),h=w/ratio;
 return {x:box.x+box.w/2-w/2,y:box.y+box.h/2-h/2,w,h};
}
export function fullAtlasFrame(width,height){
 const ratio=width/height,w=Math.min(600,443*ratio);
 return {x:35,y:12,w,h:w/ratio};
}
export function clockwiseNeighbors(selected,features,geometry=[]){
 const byId=new Map(features.map(f=>[f.id,f]));
 const center=selected.point;
 const bearing=id=>{let p=byId.get(id)?.point||center;
 const path=geometry.find(g=>g.id===id)?.path;
 if(path){const values=path.match(/-?\d+(?:\.\d+)?/g).map(Number);let distance=Infinity;for(let i=0;i<values.length;i+=2){const d=(values[i]-center[0])**2+(values[i+1]-center[1])**2;if(d<distance){distance=d;p=[values[i],values[i+1]];}}}
 return (Math.atan2(p[0]-center[0],center[1]-p[1])+Math.PI*2)%(Math.PI*2);};
 return [...selected.neighbors].sort((a,b)=>bearing(a)-bearing(b));
}
