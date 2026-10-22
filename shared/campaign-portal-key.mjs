import {CAMPAIGN_PORTAL_SPIRIT_ART} from './campaign-portal-assets.mjs';
import {campaignArtifact} from './campaign-artifacts.mjs';
import {assetUrl} from './asset-loader.mjs';
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const portalKeyUrl=(realm='city')=>assetUrl(campaignArtifact(realm).art.path);
export const portalSpiritUrl=()=>assetUrl(CAMPAIGN_PORTAL_SPIRIT_ART.path);
export function portalKeyState(progress,config,realmId){
 const realm=config.realms.find(r=>r.id===realmId)||config.realms[0],next=config.realms[config.realms.indexOf(realm)+1],artifact=campaignArtifact(realm),steps=config.steps.filter(s=>s.realm===realm.id),done=new Set(progress?.journey?.adventure?.campaign?.completed||[]),parts=artifact.parts.map((name,i)=>({name,step:(i+1)*5,found:steps.slice(0,(i+1)*5).every(s=>done.has(s.id))}));
 return {realm:realm.id,name:artifact.name,final:artifact.final===true,url:portalKeyUrl(realm),next:next?.name||'Zakończenie opowieści',art:next?.art||next?.id||realm.art||realm.id,parts,count:parts.filter(p=>p.found).length};
}
export function portalKeyPassage(number,nextWorld,realm='city'){
 const artifact=campaignArtifact(realm),destination=nextWorld?`do krainy „${nextWorld}”`:'do ostatniej bramy opowieści';
 if(number===5)return `Pierwszy kamień odsłania część przedmiotu: ${artifact.parts[0].toLocaleLowerCase('pl')}. Powstaje ${artifact.name}. Potrzebujesz jeszcze dwóch części. To ślad prowadzący ${destination}.`;
 if(number===10)return `Drugi kamień oddaje kolejną część: ${artifact.parts[1]}. Dwa fragmenty pasują do siebie. Ich blask przypomina świat, który czeka po drugiej stronie bramy.`;
 if(number===15)return artifact.final?`Trzecia część — ${artifact.parts[2]} — łączy wszystkie barwy. ${artifact.name} jest gotowe. Duch Portalu strzeże już ostatniej strony księgi. Czas pożegnać przyjaciół i połączyć światła całej wyprawy.`:`Ostatni kamień odsłania część: ${artifact.parts[2]}. Przedmiot jest gotowy: ${artifact.name}. Żegnasz przyjaciół tej krainy. Duch Portalu rozpoznaje jego światło. „Odkrycia otworzyły drogę ${destination}. Wejdź, gdy zechcesz”.`;
 return '';
}
export function portalKeyBookMarkup(state){return `<section class="book-portal-key" aria-label="Przedmiot tej krainy"><div class="book-key-image" data-key-parts="${state.count}" aria-hidden="true">${Array.from({length:3},(_,i)=>`<img src="${esc(state.url)}" alt="" width="512" height="768" data-key-piece="${i}" class="key-piece key-piece-${i} ${state.parts[i].found?'is-found':''}">`).join('')}</div><div><h3>${esc(state.name)}</h3><p>${state.count} z 3 części · ${esc(state.next)}</p><ol>${state.parts.map((p,i)=>`<li data-key-part="${i}" class="${p.found?'is-found':''}">${p.found?'✓':'◇'} ${esc(p.name)} <small>kamień ${p.step/5}</small></li>`).join('')}</ol></div></section>`;}
