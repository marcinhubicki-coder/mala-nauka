import {CAMPAIGN_MANUSCRIPT_ART} from './campaign-manuscript-assets.mjs';
import {assetUrl} from './asset-loader.mjs';
export const MANUSCRIPT_ALPHABET=[...'AĄBCĆDEĘFGHIJKLŁMNŃOÓPQRSŚTUVWXYZŹŻ★'];
let spriteSequence=0;
const escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function manuscriptAssets(world){return Object.entries(CAMPAIGN_MANUSCRIPT_ART).filter(([id])=>id.endsWith('-'+world)).map(([,a])=>assetUrl(a.path));}
export function manuscriptSprite(world,kind,index=0,{className='',label=''}={}){
 const asset=CAMPAIGN_MANUSCRIPT_ART[kind+'-'+world];if(!asset)return '';
 const cols=kind==='alphabet'?6:kind==='ornaments'?2:1,rows=kind==='alphabet'?6:3,cellW=asset.width/cols,cellH=asset.height/rows,[x,y,w,h]=asset.frames?.[index]||[index%cols*cellW,Math.floor(index/cols)*cellH,cellW,cellH];
 const clip=`manuscript-${world}-${kind}-${index}-${++spriteSequence}`;return `<svg class="manuscript-sprite ${className}" viewBox="${x} ${y} ${w} ${h}" preserveAspectRatio="xMidYMid meet" ${label?`role="img" aria-label="${escape(label)}"`:'aria-hidden="true"'} data-manuscript-kind="${kind}" data-ds-label="${kind==='alphabet'?'Iluminowany inicjał':kind==='miniatures'?'Ilustracja opowieści':'Ornament księgi'}"><defs><clipPath id="${clip}" clipPathUnits="userSpaceOnUse"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath></defs><image href="${escape(assetUrl(asset.path))}" width="${asset.width}" height="${asset.height}" clip-path="url(#${clip})"/></svg>`;
}
export function manuscriptInitial(world,letter=''){const index=MANUSCRIPT_ALPHABET.indexOf(letter.toUpperCase());return index<0?'':manuscriptSprite(world,'alphabet',index,{className:'book-illuminated-initial'});}
