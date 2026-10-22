import {ADVENTURE_ART} from './adventure-assets.mjs';
import {assetUrl} from './asset-loader.mjs';
// One plane behind the glyph and one in front: the question enters the portal.
export function portalEmblemMarkup(){
 const url=assetUrl(ADVENTURE_ART['teleport-ring'].path);
 return `<span class="portal-emblem" aria-hidden="true"><img class="portal-emblem-back" src="${url}" alt=""><span class="portal-emblem-question">?</span><img class="portal-emblem-front" src="${url}" alt=""></span>`;
}
