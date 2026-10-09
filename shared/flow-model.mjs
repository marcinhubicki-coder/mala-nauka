export const pairKey=(from,to)=>`${from}--${to}`;
export function flowEdges(registry){
 const ids=new Set(registry.views.map(v=>v.id)),rows=[];
 for(const flow of registry.flows){const origins=flow.from.includes('*')?registry.views.filter(v=>new RegExp('^'+flow.from.replace('*','[a-z]+')+'$').test(v.id)).map(v=>v.id):[flow.from];for(const from of origins)for(const target of flow.to){const to=target.replace('*',from.split('-')[0]);if(ids.has(from)&&ids.has(to)&&from!==to){const key=pairKey(from,to);if(!rows.some(r=>r.key===key))rows.push({key,from,to,action:flow.action,condition:flow.condition,selector:flow.selector||'',state:flow.state===true});}}}
 return rows;
}
export const motionEdges=registry=>flowEdges(registry).filter(e=>!e.state);
export const outgoing=(registry,from)=>flowEdges(registry).filter(e=>e.from===from);
export function userJourney(registry,start='players',mode='spelling'){
 const choices={players:'player-create','players-empty':'player-create','player-create':'player-pin','player-pin':'home',home:mode+'-settings',[mode+'-settings']:mode+'-initial',[mode+'-initial']:mode+'-results',[mode+'-results']:'progress',progress:'collection',collection:'home'};
 const result=[],seen=new Set();let from=start;while(!seen.has(from)){seen.add(from);const edges=outgoing(registry,from),edge=edges.find(e=>e.to===choices[from]);if(!edge)break;result.push(edge);from=edge.to;}return result;
}
