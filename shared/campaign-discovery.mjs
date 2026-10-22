// Deterministic puzzle cells. Shared by the player scene and Studio's laboratory.
export const DISCOVERY_DEFAULTS={enabled:true,fogEnabled:true,puzzleEnabled:true,shape:'world',density:12,duration:1500,intensity:.82,fog:.62,spread:.12,stepRevealScale:1,milestoneRevealScale:2,lookAhead:1,teleportDuration:1900,ambientEnabled:true,ambientInterval:2200,ambientDuration:4600,ambientCells:12,ambientMaxChains:7,ambientStagger:1800,ambientStrength:1.2,ambientReveal:.8,ambientEdgeReveal:.3,glowEnabled:true,glowIntensity:1.4,globalGlowEnabled:true,globalGlowIntensity:1.2,globalGlowSpeed:1,globalGlowCount:3};
export const DISCOVERY_SHAPES=['world','triangles','diamonds','squares'];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function discoverySettings(config={}){const v=config.discovery||config;return {...DISCOVERY_DEFAULTS,...Object.fromEntries(Object.keys(DISCOVERY_DEFAULTS).filter(k=>v[k]!==undefined).map(k=>[k,v[k]]))};}
export function validateDiscovery(value){const c=discoverySettings(value);if(['enabled','fogEnabled','puzzleEnabled','ambientEnabled','glowEnabled','globalGlowEnabled'].some(k=>typeof c[k]!=='boolean')||!DISCOVERY_SHAPES.includes(c.shape))throw Error('Sprawdź efekt odkrywania mapy.');for(const[k,a,b]of[['density',6,18],['duration',300,4000],['intensity',0,1],['fog',0,1],['spread',.06,.3],['stepRevealScale',.5,3],['milestoneRevealScale',1,4],['lookAhead',0,2],['teleportDuration',800,4000],['ambientInterval',80,30000],['ambientDuration',400,16000],['ambientCells',2,24],['ambientMaxChains',0,12],['ambientStagger',0,6000],['ambientStrength',0,3],['ambientReveal',0,1],['ambientEdgeReveal',0,1],['glowIntensity',0,4],['globalGlowIntensity',0,4],['globalGlowSpeed',.2,3],['globalGlowCount',1,6]])if(!Number.isFinite(c[k])||c[k]<a||c[k]>b)throw Error('Sprawdź parametr mapy: '+k);if(!Number.isInteger(c.density)||!Number.isInteger(c.lookAhead)||!Number.isInteger(c.ambientCells)||!Number.isInteger(c.ambientMaxChains)||!Number.isInteger(c.globalGlowCount))throw Error('Gęstość i wyprzedzenie muszą być całkowite.');return c;}
export function puzzleShape(realm,settings){return settings.shape==='world'?({city:'diamonds',jungle:'triangles',caves:'diamonds',fairies:'triangles',space:'squares',heavens:'diamonds',underwater:'triangles'})[realm]||'triangles':settings.shape;}
export function puzzleCells(shape='triangles',density=12){const cells=[],rows=Math.round(density*1.25),w=1/density,h=1/rows,add=(points,i)=>cells.push({id:i,points,x:points.reduce((n,p)=>n+p[0],0)/points.length,y:points.reduce((n,p)=>n+p[1],0)/points.length,angle:((i*7%5)+1)*Math.PI/3*(i%2?1:-1)});
 for(let y=0;y<rows;y++)for(let x=0;x<density;x++){const a=x*w,b=y*h,i=y*density+x;if(shape==='triangles'){add([[a,b],[a+w,b],[a+w,b+h]],i*2);add([[a,b],[a+w,b+h],[a,b+h]],i*2+1);}else if(shape==='diamonds'){const mx=a+w/2,my=b+h/2;add([[mx,b],[a+w,my],[mx,b+h],[a,my]],i*5);add([[a,b],[mx,b],[a,my]],i*5+1);add([[mx,b],[a+w,b],[a+w,my]],i*5+2);add([[a+w,my],[a+w,b+h],[mx,b+h]],i*5+3);add([[a,my],[mx,b+h],[a,b+h]],i*5+4);}else add([[a,b],[a+w,b],[a+w,b+h],[a,b+h]],i);}
 return cells;
}
function segmentDistance(p,a,b){const dx=b.x-a.x,dy=(b.y-a.y)*1.25,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*1.25*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-t*dx,(p.y-a.y)*1.25-t*dy);}
export function puzzleReveal(cell,index,route,settings=DISCOVERY_DEFAULTS){
 if(!settings.enabled||index>=14)return 1;
 index=clamp(index,0,15);const stage=Math.floor(index/5),radius=(settings.spread+stage*.035+index*.002)*(settings.stepRevealScale??1);
 let near=Math.hypot(cell.x-route[0].x,(cell.y-route[0].y)*1.25);
 // Reveal the visited surroundings and at most two fields ahead. Distant path
 // segments are terrain like everything else, including during animation.
 for(let i=0;i<Math.min(route.length-1,index+Math.min(2,settings.lookAhead));i++)near=Math.min(near,segmentDistance(cell,route[i],route[i+1]));
 const local=clamp((radius+.065-near)/.09,0,1),regional=clamp((index+1)/5-stage,0,1)*.2;
 const band=cell.y>route[Math.min(15,(stage+1)*5)].y?stage*.25+regional:0;
 const visited=route.slice(0,index+1),frontier=Math.min(...visited.map(p=>p.y));
 const behind=clamp((cell.y-frontier+settings.spread*.2)/Math.max(.04,settings.spread*.65),0,1);
 let milestone=0;for(let n=5;n<=index;n+=5){const p=route[n];if(!p)continue;const distance=Math.hypot(cell.x-p.x,(cell.y-p.y)*1.25),r=(settings.spread+Math.floor(n/5)*.035+n*.002)*(settings.milestoneRevealScale??2);milestone=Math.max(milestone,clamp((r+.065-distance)/.09,0,1));}
 return Math.max(local,behind,band,stage*.08,milestone);
}
export function campaignTileChoices(progress,realm,config){const done=new Set(progress?.journey?.adventure?.campaign?.completed||[]),steps=config.steps.filter(s=>s.realm===realm.id);let furthest=0;for(const s of steps){if(!done.has(s.id))break;furthest++;}return steps.slice(0,15).map((step,index)=>({step,index,enabled:index<=furthest,complete:done.has(step.id)}));}

// Edges are indexed once. A chain can only cross a shared edge, never jump
// diagonally over unrelated pieces or cross into discovered terrain.
const adjacencyCache=new WeakMap();
function adjacentCells(cells){
 if(adjacencyCache.has(cells))return adjacencyCache.get(cells);
 const edges=new Map(),adjacent=cells.map(()=>[]),point=p=>p.map(n=>n.toFixed(6)).join(',');
 cells.forEach((cell,i)=>cell.points.forEach((a,n)=>{const b=cell.points[(n+1)%cell.points.length],edge=[point(a),point(b)].sort().join('|');if(edges.has(edge)){const j=edges.get(edge);adjacent[i].push(j);adjacent[j].push(i);}else edges.set(edge,i);}));
 adjacencyCache.set(cells,adjacent);return adjacent;
}
export function puzzleChain(cells,reveals,seed,count=6,random=Math.random){
 const hidden=cells.map((c,i)=>({c,i})).filter(({i})=>reveals[i]<.5);
 if(!hidden.length)return [];
 const adjacent=adjacentCells(cells);
 let current=hidden.reduce((a,b)=>Math.hypot(b.c.x-seed.x,b.c.y-seed.y)<Math.hypot(a.c.x-seed.x,a.c.y-seed.y)?b:a).i;
 const chain=[current],remaining=new Set(hidden.map(r=>r.i));remaining.delete(current);
 while(chain.length<Math.min(24,count)){
  const candidates=adjacent[current].filter(i=>remaining.has(i));if(!candidates.length)break;
  current=candidates[Math.min(candidates.length-1,Math.floor(random()*candidates.length))];chain.push(current);remaining.delete(current);
 }
 return chain;
}

// Two complete rings belong to every river; overlap never creates a second
// renderer for the same shard. Bound core paths and their halo separately.
export const CAMPAIGN_LIVE_PIECE_LIMIT=384;
export function puzzleNeighborhood(cells,seeds,radius=2){
 const adjacent=adjacentCells(cells),found=new Map(seeds.map((index,order)=>[index,{index,ring:0,order}]));let frontier=[...seeds];
 for(let ring=1;ring<=radius;ring++){const next=[];for(const index of frontier)for(const neighbor of adjacent[index])if(!found.has(neighbor)){found.set(neighbor,{index:neighbor,ring,order:found.get(index).order});next.push(neighbor);}frontier=next;}
 return [...found.values()];
}
const cellArea=c=>Math.abs(c.points.reduce((sum,p,i)=>{const q=c.points[(i+1)%c.points.length];return sum+p[0]*q[1]-q[0]*p[1];},0))/2;
export function puzzleActivityBudget(cells,reveals,firstReveals,settings=DISCOVERY_DEFAULTS){
 const area=rows=>cells.reduce((sum,c,i)=>sum+(rows[i]<.5?cellArea(c):0),0),firstArea=area(firstReveals),remainingArea=area(reveals),fraction=firstArea?Math.min(1,remainingArea/firstArea):0;
 const chains=remainingArea&&settings.ambientEnabled?Math.min(settings.ambientMaxChains,Math.max(1,Math.round(settings.ambientMaxChains*fraction))):0;
 return {chains,cellsPerChain:chains?Math.min(settings.ambientCells,Math.floor(192/chains)):0,fraction};
}
