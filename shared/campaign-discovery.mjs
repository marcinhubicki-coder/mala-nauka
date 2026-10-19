// Deterministic puzzle cells. Shared by the player scene and Studio's laboratory.
export const DISCOVERY_DEFAULTS={enabled:true,fogEnabled:true,puzzleEnabled:true,shape:'world',density:12,duration:1500,intensity:.82,fog:.62,spread:.12,lookAhead:1,teleportDuration:1900};
export const DISCOVERY_SHAPES=['world','triangles','diamonds','squares'];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function discoverySettings(config={}){const v=config.discovery||config;return {...DISCOVERY_DEFAULTS,...Object.fromEntries(Object.keys(DISCOVERY_DEFAULTS).filter(k=>v[k]!==undefined).map(k=>[k,v[k]]))};}
export function validateDiscovery(value){const c=discoverySettings(value);if(['enabled','fogEnabled','puzzleEnabled'].some(k=>typeof c[k]!=='boolean')||!DISCOVERY_SHAPES.includes(c.shape))throw Error('Sprawdź efekt odkrywania mapy.');for(const[k,a,b]of[['density',6,18],['duration',300,4000],['intensity',0,1],['fog',0,1],['spread',.06,.3],['lookAhead',0,2],['teleportDuration',800,4000]])if(!Number.isFinite(c[k])||c[k]<a||c[k]>b)throw Error('Sprawdź parametr mapy: '+k);if(!Number.isInteger(c.density)||!Number.isInteger(c.lookAhead))throw Error('Gęstość i wyprzedzenie muszą być całkowite.');return c;}
export function puzzleShape(realm,settings){return settings.shape==='world'?({city:'diamonds',jungle:'triangles',caves:'diamonds',fairies:'triangles',space:'squares',heavens:'diamonds',underwater:'triangles'})[realm]||'triangles':settings.shape;}
export function puzzleCells(shape='triangles',density=12){const cells=[],rows=Math.round(density*1.25),w=1/density,h=1/rows,add=(points,i)=>cells.push({id:i,points,x:points.reduce((n,p)=>n+p[0],0)/points.length,y:points.reduce((n,p)=>n+p[1],0)/points.length,angle:((i*7%5)+1)*Math.PI/3*(i%2?1:-1)});
 for(let y=0;y<rows;y++)for(let x=0;x<density;x++){const a=x*w,b=y*h,i=y*density+x;if(shape==='triangles'){add([[a,b],[a+w,b],[a+w,b+h]],i*2);add([[a,b],[a+w,b+h],[a,b+h]],i*2+1);}else if(shape==='diamonds'){const mx=a+w/2,my=b+h/2;add([[mx,b],[a+w,my],[mx,b+h],[a,my]],i*5);add([[a,b],[mx,b],[a,my]],i*5+1);add([[mx,b],[a+w,b],[a+w,my]],i*5+2);add([[a+w,my],[a+w,b+h],[mx,b+h]],i*5+3);add([[a,my],[mx,b+h],[a,b+h]],i*5+4);}else add([[a,b],[a+w,b],[a+w,b+h],[a,b+h]],i);}
 return cells;
}
function segmentDistance(p,a,b){const dx=b.x-a.x,dy=(b.y-a.y)*1.25,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*1.25*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-t*dx,(p.y-a.y)*1.25-t*dy);}
export function puzzleReveal(cell,index,route,settings=DISCOVERY_DEFAULTS){
 if(!settings.enabled||index>=14)return 1;
 index=clamp(index,0,15);const stage=Math.floor(index/5),radius=settings.spread+stage*.035+index*.002;
 let near=Math.hypot(cell.x-route[0].x,(cell.y-route[0].y)*1.25);
 // Reveal the visited surroundings and at most two fields ahead. Distant path
 // segments are terrain like everything else, including during animation.
 for(let i=0;i<Math.min(route.length-1,index+Math.min(2,settings.lookAhead));i++)near=Math.min(near,segmentDistance(cell,route[i],route[i+1]));
 const local=clamp((radius+.065-near)/.09,0,1),regional=clamp((index+1)/5-stage,0,1)*.2;
 const band=cell.y>route[Math.min(15,(stage+1)*5)].y?stage*.25+regional:0;
 const visited=route.slice(0,index+1),frontier=Math.min(...visited.map(p=>p.y));
 const behind=clamp((cell.y-frontier+settings.spread*.2)/Math.max(.04,settings.spread*.65),0,1);
 return Math.max(local,behind,band,stage*.08);
}
export function campaignTileChoices(progress,realm,config){const done=new Set(progress?.journey?.adventure?.campaign?.completed||[]),steps=config.steps.filter(s=>s.realm===realm.id);let furthest=0;for(const s of steps){if(!done.has(s.id))break;furthest++;}return steps.slice(0,15).map((step,index)=>({step,index,enabled:index<=furthest,complete:done.has(step.id)}));}
