// Editor guide; accepted paintings use their own four-corner calibration below.
import {tracedTileQuad,quadCenter} from './campaign-tiles.mjs';
export const CAMPAIGN_GRID={width:1200,height:1500,x:.008125,y:.00325,originX:.5,originY:.08};
const guide=[[.306,.833],[.368,.896],[.431,.837],[.496,.775],[.563,.716],[.496,.657],[.431,.598],[.368,.539],[.433,.480],[.496,.422],[.563,.479],[.629,.420],[.694,.362],[.759,.302],[.694,.242],[.759,.168]];
export function snapCampaignPoint(x,y){const g=CAMPAIGN_GRID,u=Math.round(((x-g.originX)/g.x+(y-g.originY)/g.y)/2),v=Math.round(((y-g.originY)/g.y-(x-g.originX)/g.x)/2);return {u,v,x:g.originX+(u-v)*g.x,y:g.originY+(u+v)*g.y};}
export const CAMPAIGN_ROUTE=guide.map(([x,y])=>snapCampaignPoint(x,y));
export const LEGACY_CAMPAIGN_ROUTE=[[0.305,0.8079999999999999],[0.37,0.8859999999999999],[0.435,0.8079999999999999],[0.5,0.7559999999999999],[0.565,0.704],[0.5,0.6519999999999999],[0.435,0.6],[0.37,0.522],[0.435,0.47],[0.5,0.418],[0.565,0.47],[0.63,0.418],[0.6950000000000001,0.366],[0.76,0.288],[0.6950000000000001,0.236],[0.76,0.184]];
const samePoint=(a,b)=>Math.abs(a.x-b.x)<.000001&&Math.abs(a.y-b.y)<.000001;
export function realmRoute(realm){
 const route=realm?.route?.length===16?realm.route:CAMPAIGN_ROUTE;
 // Existing deliberate position edits survive. Untouched guides follow the painting.
 return route.map((p,i)=>!samePoint(p,CAMPAIGN_ROUTE[i])?p:quadCenter(tracedTileQuad(realm,i)));
}
export function realmTileQuad(realm,index){
 const quad=tracedTileQuad(realm,index),center=quadCenter(quad),point=realmRoute(realm)[index],dx=point.x-center.x,dy=point.y-center.y;
 return quad.map(p=>({x:p.x+dx,y:p.y+dy}));
}
export function campaignPosition(progress,realm,config){const done=new Set(progress?.journey?.adventure?.campaign?.completed||[]),steps=config.steps.filter(s=>s.realm===realm.id);let index=0;for(const step of steps){if(!done.has(step.id))break;index++;}index=Math.min(15,index);return {index,...realmRoute(realm)[index]};}
// Profile gender is the only player-facing source. Old traveller preferences stay
// readable in progress backups but never override the avatar.
export function campaignTraveller(progress,player){return ['a','d','e','g','i','k'].includes(player?.avatarId)?'girl':'boy';}
export function campaignFacing(route,index){const a=route[Math.min(index,14)],b=route[Math.min(index+1,15)];return b.x<a.x?'left':'right';}
