import {createBubble} from './bubble.mjs';
import {createHTMLBubble} from './bubble-html.mjs';
import {DEFAULT_EFFECTS,normalizeEffectsConfig} from './effect-model.mjs';

// Game, Studio scenarios and word/rule dialogs honour the same saved choice.
export function createConfiguredBubble(host,options={}){
 const config=normalizeEffectsConfig(globalThis.__MALA_NAUKA_DESIGN__?.effects||DEFAULT_EFFECTS);
 return config.bubble.renderer==='classic'?createBubble(host,options):createHTMLBubble(host);
}
