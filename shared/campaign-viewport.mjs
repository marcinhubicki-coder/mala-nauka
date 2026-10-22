// The campaign family is a full-screen shell. Map children remain freely editable.
export const CAMPAIGN_GEOMETRY_FIELDS=['width','height','scale','offsetX','offsetY','originX','originY','margin','marginTop','marginBottom','marginLeft','marginRight','padding','paddingTop','paddingBottom','paddingLeft','paddingRight'];
export const isCampaignViewport=item=>item?.recipe==='container-campaign'||['block-container-campaign','screen-campaign'].includes(item?.blockId)||item?.id==='campaign-screen';
const recipes=['container-campaign','block-container-campaign','screen-campaign'];
export function normalizeCampaignViewport(config){
 if(!config)return config;
 const paths=[];
 for(const id of recipes){paths.push(['elementStyles',id]);for(const mode of Object.keys(config.familyStyles||{}))paths.push(['familyStyles',mode,id]);for(const state of Object.keys(config.recipeStates?.[id]||{}))paths.push(['recipeStates',id,state]);}
 for(const id of ['campaign-screen','layout-root']){paths.push(['elementOverrides','campaign',id]);for(const state of Object.keys(config.elementStates?.campaign||{}))paths.push(['elementStates','campaign',state,id]);}
 const get=(c,p)=>p.reduce((v,k)=>v?.[k],c),styles=paths.filter(p=>CAMPAIGN_GEOMETRY_FIELDS.some(k=>Object.hasOwn(get(config,p)||{},k)));
 const geometry=[['responsiveGeometry','global','container-campaign'],['responsiveGeometry','views','campaign','campaign-screen'],['responsiveGeometry','views','campaign','layout-root']].filter(p=>get(config,p));
 if(!styles.length&&!geometry.length)return config;
 const next=structuredClone(config),prune=p=>{for(let i=p.length;i>0;i--){const path=p.slice(0,i),row=get(next,path);if(row&&Object.keys(row).length===0)delete get(next,path.slice(0,-1))[path.at(-1)];else break;}};for(const p of styles){const row=get(next,p);for(const key of CAMPAIGN_GEOMETRY_FIELDS)delete row[key];prune(p);}for(const p of geometry){delete get(next,p.slice(0,-1))[p.at(-1)];prune(p.slice(0,-1));}return next;
}
