// True anchors stay on their countries. A leader connects a crowded or small
// state to readable text/flag; neither the paint edge nor another name cuts it.
export function layoutAtlasLabels(items,{width,height,measure,blocked=()=>false,allowed=()=>true,near=true,max=8}){
 const placed=[],reserved=[{x:width-91,y:height-43,w:91,h:43}];
 const overlaps=(a,b)=>a.x<b.x+b.w+4&&a.x+a.w+4>b.x&&a.y<b.y+b.h+4&&a.y+a.h+4>b.y;
 const crosses=(ax,ay,bx,by,box)=>{
  let lo=0,hi=1;const dx=bx-ax,dy=by-ay;
  for(const [p,q] of [[-dx,ax-box.x+2],[dx,box.x+box.w+2-ax],[-dy,ay-box.y+2],[dy,box.y+box.h+2-ay]]){
   if(!p){if(q<0)return false;continue;}const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return false;
  }
  return true;
 };
 function* choices(item){
  if(item.ax<8||item.ax>width-8||item.ay<8||item.ay>height-8)return;
  let lines=[item.name];
  if(measure(item.name)>84&&item.name.includes(' ')){
   const words=item.name.split(' ');let best=Infinity;
   for(let i=1;i<words.length;i++){const pair=[words.slice(0,i).join(' '),words.slice(i).join(' ')],score=Math.max(...pair.map(measure));if(score<best){best=score;lines=pair;}}
  }
  const w=Math.max(...lines.map(measure),near&&item.flag?16:0)+8,h=lines.length*11+(near&&item.flag?12:0)+4;
  const offsets=item.capital?[[20,-18],[-20,-18],[0,22],[0,-26],[35,0],[-35,0]]:[[0,-5],[0,-24],[0,22],[-26,0],[26,0],[-38,-24],[38,-24],[-38,24],[38,24],[0,-44],[0,42],[-62,0],[62,0],[-62,-42],[62,-42],[-62,42],[62,42],[0,-64],[0,64]];
  function* positions(){
   yield* offsets;const grid=[];
   for(let y=15+h/2;y<height-h/2-15;y+=10)for(let x=13+w/2;x<width-w/2-13;x+=10)grid.push([x-item.ax,y-item.ay]);
   grid.sort((a,b)=>a[0]*a[0]+a[1]*a[1]-b[0]*b[0]-b[1]*b[1]);yield* grid;
  }
  const seen=new Set();
  for(const [dx,dy] of positions()){
   const box={x:Math.max(13,Math.min(width-w-13,item.ax+dx-w/2)),y:Math.max(15,Math.min(height-h-15,item.ay+dy-h/2)),w,h},key=box.x.toFixed(2)+':'+box.y.toFixed(2);
   if(seen.has(key))continue;seen.add(key);
   if(reserved.some(r=>overlaps(box,r)))continue;
   if(item.capital&&overlaps(box,{x:item.ax-7,y:item.ay-13,w:14,h:17}))continue;
   if(items.some(p=>p.key!==item.key&&p.ax>box.x-3&&p.ax<box.x+box.w+3&&p.ay>box.y-3&&p.ay<box.y+box.h+3))continue;
   if(!item.capital&&!item.selected&&blocked(box))continue;
   if(!allowed(box))continue;
   const x=box.x+w/2,y=box.y+2;
   yield {...item,lines,box,x,y,leader:item.small||Math.hypot(x-item.ax,box.y+h/2-item.ay)>14};
  }
 }
 // Reserve the most constrained genuine neighbours first. A wide country at
 // the cropped edge must not lose its only corridor to a less constrained name.
 const queue=items.map((item,index)=>({item,index,choices:item.required||item.capital?[...choices(item)]:choices(item)}));
 const priority=item=>item.capital?0:item.required?1:2;
 queue.sort((a,b)=>priority(a.item)-priority(b.item)||(a.item.required&&b.item.required?a.choices.length-b.choices.length:0)||a.index-b.index);
 const compatible=(choice,others)=>!others.some(p=>overlaps(choice.box,p.box)||(choice.leader&&crosses(choice.ax,choice.ay,choice.x,choice.y+5,p.box))||(p.leader&&crosses(p.ax,p.ay,p.x,p.y+5,choice.box)));
 const distance=c=>Math.hypot(c.box.x+c.box.w/2-c.ax,c.box.y+c.box.h/2-c.ay);
 const required=queue.filter(e=>e.item.capital||e.item.required).slice(0,max).map(e=>({...e,choices:[...e.choices].sort((a,b)=>distance(a)-distance(b))}));
 // Greedy placement can strand the last neighbour behind an earlier leader.
 // Forward checking revisits that earlier choice instead of silently dropping it.
 let visits=0;
 function solve(remaining,current){
  if(!remaining.length)return current;
  if(++visits>3000)return null;
  const options=remaining.map(e=>({entry:e,choices:e.choices.filter(c=>compatible(c,current))})).sort((a,b)=>a.choices.length-b.choices.length);
  if(!options[0].choices.length)return null;
  const next=options[0],rest=remaining.filter(e=>e!==next.entry);
  for(const choice of next.choices){const result=solve(rest,[...current,choice]);if(result)return result;if(visits>3000)break;}
  return null;
 }
 let complete;
 for(const limit of [45,65,85,110,Infinity]){visits=0;complete=solve(required.map(e=>({...e,choices:e.choices.filter(c=>distance(c)<=limit)})),[]);if(complete)break;}
 if(complete)placed.push(...complete);
 for(const entry of queue){
  if(placed.length>=max)break;
  if(placed.some(p=>p.key===entry.item.key))continue;
  for(const choice of entry.choices)if(compatible(choice,placed)){placed.push(choice);break;}
 }
 return placed;
}
