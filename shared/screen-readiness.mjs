// Decode each visible asset once; do not inspect layout on animation frames.
const readyImages=new Map();
const urls=value=>[...String(value||'').matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(m=>m[1]).filter(url=>!url.startsWith('data:'));
export function decodeImage(url){
 if(!url)return Promise.resolve();if(readyImages.has(url))return readyImages.get(url);
 const promise=new Promise(resolve=>{const image=new Image();image.onload=()=>{Promise.resolve(image.decode?.()).catch(()=>{}).then(resolve);};image.onerror=resolve;image.src=url;});
 if(readyImages.size>100)readyImages.delete(readyImages.keys().next().value);readyImages.set(url,promise);return promise;
}
export async function screenReady(root){
 if(!root)return;
 await root.mnScreenReady;
 // Wait for the renderers/asset resolver to finish their current mutation batch.
 await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
 const paths=new Set();
 for(const node of [document.documentElement,document.body,root,...root.querySelectorAll('img,image,[class*="background"],[class*="canvas"],[class*="visual"],[class*="art"],.wizard-intro,.question-card')]){
  if(node instanceof HTMLImageElement){if(node.currentSrc||node.src)paths.add(node.currentSrc||node.src);}
  else if(node.tagName.toLowerCase()==='image'){const url=node.href?.baseVal;if(url)paths.add(new URL(url,document.baseURI).href);}
  for(const url of urls(getComputedStyle(node).backgroundImage))paths.add(new URL(url,document.baseURI).href);
 }
 await Promise.all([document.fonts?.ready,...[...paths].map(decodeImage)]);
}
