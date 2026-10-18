// Cameras preserve the viewport ratio. Near views are centered on the main
// country polygon; overview covers the painted continent instead of containing
// it in a larger transparent rectangle.
export function nearAtlasFrame(box,width,height){
 const ratio=width/height;
 const w=Math.max(box.w*1.64,box.h*ratio*1.64,box.w<5?56:88),h=w/ratio;
 return {x:box.x+box.w/2-w/2,y:box.y+box.h/2-h/2,w,h};
}
export function fullAtlasFrame(width,height,focus){
 const ratio=width/height,w=Math.min(600,443*ratio);
 const h=w/ratio;
 const center=focus?{x:focus.x+focus.w/2,y:focus.y+focus.h/2}:{x:35+w/2,y:12+h/2};
 return {x:Math.max(12,Math.min(668-w,center.x-w/2)),y:Math.max(10,Math.min(490-h,center.y-h/2)),w,h};
}
export function boundAtlasFrame(frame,bounds){
 const ratio=frame.w/frame.h,scale=Math.min(1,bounds.w/frame.w,bounds.h/frame.h),w=frame.w*scale,h=w/ratio;
 return {x:Math.max(bounds.x,Math.min(bounds.x+bounds.w-w,frame.x+(frame.w-w)/2)),y:Math.max(bounds.y,Math.min(bounds.y+bounds.h-h,frame.y+(frame.h-h)/2)),w,h};
}
export function readableAtlasFrames(focus,width,height,headerTop,bounds,wholeCountry){
 const mainHeight=height-headerTop,near=nearAtlasFrame(focus,width,mainHeight),ratio=width/height;
 const close=boundAtlasFrame({...near,y:near.y-headerTop*near.w/width,h:near.w/ratio},bounds);
 let overview;
 if(wholeCountry){
  const w=Math.max(wholeCountry.w*1.1,wholeCountry.h*ratio*1.15,close.w);
  overview=boundAtlasFrame({x:wholeCountry.x+wholeCountry.w/2-w/2,y:wholeCountry.y+wholeCountry.h/2-w/ratio/2,w,h:w/ratio},bounds);
 }else{
  const w=Math.max(close.w,Math.min(740,bounds.w*.88,bounds.h*ratio*.94)),point={x:focus.x+focus.w/2,y:focus.y+focus.h/2};
  overview=boundAtlasFrame({x:point.x-(point.x-close.x)/close.w*w,y:point.y-(point.y-close.y)/close.h*w/ratio,w,h:w/ratio},bounds);
 }
 return {near:close,full:overview};
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
