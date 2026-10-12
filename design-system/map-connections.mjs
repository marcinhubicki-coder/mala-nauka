// Orthogonal routes are shared by the screen map and the sound map. The
// routing grid follows the clear space between cards, never their interiors.
const distance=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
const bounds=r=>({left:r.left,top:r.top,right:r.right??r.left+r.width,bottom:r.bottom??r.top+r.height});
export function segmentHitsRect(a,b,r){
 r=bounds(r);
 if(a.x===b.x)return a.x>r.left&&a.x<r.right&&Math.max(a.y,b.y)>r.top&&Math.min(a.y,b.y)<r.bottom;
 if(a.y===b.y)return a.y>r.top&&a.y<r.bottom&&Math.max(a.x,b.x)>r.left&&Math.min(a.x,b.x)<r.right;
 return true;
}
class Heap{
 constructor(){this.rows=[];}
 push(row){const a=this.rows;a.push(row);let i=a.length-1;while(i){const p=(i-1)>>1;if(a[p].score<=row.score)break;a[i]=a[p];i=p;}a[i]=row;}
 pop(){const a=this.rows,first=a[0],last=a.pop();if(a.length){let i=0;while(i*2+1<a.length){let c=i*2+1;if(c+1<a.length&&a[c+1].score<a[c].score)c++;if(a[c].score>=last.score)break;a[i]=a[c];i=c;}a[i]=last;}return first;}
}
export function orthogonalRoute(from,to,rectangles,{clearance=12,portOffset=0}={}){
 from=bounds(from);to=bounds(to);const right=(to.left+to.right)/2>=(from.left+from.right)/2;
 const y1=Math.max(from.top+16,Math.min(from.bottom-16,(from.top+from.bottom)/2+portOffset));
 const y2=Math.max(to.top+16,Math.min(to.bottom-16,(to.top+to.bottom)/2+portOffset));
 const anchor={x:right?from.right:from.left,y:y1},end={x:right?to.left:to.right,y:y2};
 const start={x:anchor.x+(right?clearance:-clearance),y:y1},goal={x:end.x+(right?-clearance:clearance),y:y2};
 // Same-column links use one side's corridor, rather than crossing a card.
 if(from.left===to.left){anchor.x=from.right;start.x=from.right+clearance;end.x=to.right;goal.x=to.right+clearance;}
 const raw=rectangles.map(bounds),obstacles=raw.map(r=>({left:r.left-5,right:r.right+5,top:r.top-5,bottom:r.bottom+5}));
 const xs=[...new Set([start.x,goal.x,...raw.flatMap(r=>[r.left-clearance,r.right+clearance])])].sort((a,b)=>a-b);
 const ys=[...new Set([start.y,goal.y,...raw.flatMap(r=>[r.top-clearance,r.bottom+clearance])])].sort((a,b)=>a-b);
 const nx=xs.length,ix=xs.indexOf(start.x),iy=ys.indexOf(start.y),gx=xs.indexOf(goal.x),gy=ys.indexOf(goal.y);
 const point=id=>({x:xs[id%nx],y:ys[Math.floor(id/nx)]});
 const startId=iy*nx+ix,goalId=gy*nx+gx,heap=new Heap(),cost=new Map(),previous=new Map();
 const begin=startId*3;cost.set(begin,0);heap.push({key:begin,score:distance(start,goal)});let found;
 while(heap.rows.length){
  const {key}=heap.pop(),id=Math.floor(key/3),dir=key%3;if(id===goalId){found=key;break;}
  const x=id%nx,y=Math.floor(id/nx),a=point(id);
  for(const [dx,dy,nextDir] of [[1,0,1],[-1,0,1],[0,1,2],[0,-1,2]]){
   const xx=x+dx,yy=y+dy;if(xx<0||xx>=nx||yy<0||yy>=ys.length)continue;
   const nextId=yy*nx+xx,b=point(nextId);if(obstacles.some(r=>segmentHitsRect(a,b,r)))continue;
   const nextKey=nextId*3+nextDir,nextCost=cost.get(key)+distance(a,b)+(dir&&dir!==nextDir?18:0);
   if(nextCost>=(cost.get(nextKey)??Infinity))continue;
   cost.set(nextKey,nextCost);previous.set(nextKey,key);heap.push({key:nextKey,score:nextCost+distance(b,goal)});
  }
 }
 if(found===undefined)return [];
 const points=[];for(let key=found;key!==undefined;key=previous.get(key))points.unshift(point(Math.floor(key/3)));
 const all=[anchor,...points,end],simple=[];
 for(const p of all){if(simple.length&&distance(simple.at(-1),p)===0)continue;while(simple.length>1){const a=simple.at(-2),b=simple.at(-1);if((a.x===b.x&&b.x===p.x)||(a.y===b.y&&b.y===p.y))simple.pop();else break;}simple.push(p);}
 return simple;
}
export function roundedRoute(points,radius=6){
 if(!points.length)return '';let d=`M ${points[0].x} ${points[0].y}`;
 for(let i=1;i<points.length-1;i++){
  const a=points[i-1],b=points[i],c=points[i+1],r=Math.min(radius,distance(a,b)/2,distance(b,c)/2);
  const before={x:b.x+Math.sign(a.x-b.x)*r,y:b.y+Math.sign(a.y-b.y)*r},after={x:b.x+Math.sign(c.x-b.x)*r,y:b.y+Math.sign(c.y-b.y)*r};
  d+=` L ${before.x} ${before.y} Q ${b.x} ${b.y} ${after.x} ${after.y}`;
 }
 const end=points.at(-1);return d+` L ${end.x} ${end.y}`;
}
const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function drawMapConnections({map,svg,cardSelector,keyAttribute,links,selected,markerId='map-arrow'}){
 const origin=map.getBoundingClientRect(),cards=[...map.querySelectorAll(cardSelector)],rects=cards.map(n=>{const r=n.getBoundingClientRect();return {id:n.getAttribute(keyAttribute),left:r.left-origin.left,top:r.top-origin.top,width:r.width,height:r.height};});
 svg.setAttribute('viewBox',`0 0 ${map.scrollWidth} ${map.scrollHeight}`);svg.setAttribute('width',map.scrollWidth);svg.setAttribute('height',map.scrollHeight);
 const rows=links.map((link,index)=>{
  const from=rects.find(r=>r.id===link.from),to=rects.find(r=>r.id===link.to);if(!from||!to||from.id===to.id)return '';
  const points=orthogonalRoute(from,to,rects,{portOffset:(index%5-2)*5});if(!points.length)return '';
  const d=roundedRoute(points),active=link.key===selected;
  return `<g class="map-connection ${active?'is-selected':''}" data-map-connection="${escape(link.key)}" role="button" tabindex="0" aria-label="${escape(link.label||link.key)}" aria-pressed="${active}"><title>${escape(link.label||link.key)}</title><path class="map-line" d="${d}" marker-end="url(#${markerId})"/><path class="map-hit" d="${d}"/></g>`;
 });
 svg.innerHTML=`<defs><marker id="${markerId}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="m2 2 6 3-6 3" fill="none" stroke="context-stroke" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></marker></defs>`+rows.join('');
}
export function focusConnectionControl(control){
 if(!control)return;const details=control.closest('details');if(details)details.open=true;
 control.closest('.flow-route,.sound-binding')?.classList.add('is-selected');
 control.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'nearest'});
 control.focus({preventScroll:true});
}
