import {createJellyV4} from './jelly-v4.mjs';

export function homePlayStyleMarkup(style='story'){
 return `<footer class="home-play-style"><div class="home-style-jelly" data-ds-key="home-play-style" data-ds-recipe="control-jelly" data-ds-kind="toggle" role="radiogroup" aria-label="Sposób gry"><span class="home-style-indicator" aria-hidden="true"></span>${[['story','Fabularny'],['free','Swobodny']].map(([value,label])=>`<label data-ds-key="home-style-${value}" data-ds-recipe="jelly-option" data-ds-kind="text"><input type="radio" name="homePlayStyle" value="${value}" ${style===value?'checked':''}><span>${label}</span></label>`).join('')}</div></footer>`;
}

// Keep the real Jelly and its gesture state mounted while only the content changes.
export function mountHomePlayStyle(root,{style,onChange}){
 const abort=new AbortController(),jelly=createJellyV4({indicatorSelector:'.home-style-indicator'}),control=root.querySelector('.home-style-jelly');let selected=style,suppressUntil=0;
 const select=value=>{if(value===selected)return;selected=value;control.querySelectorAll('input').forEach(i=>i.checked=i.value===value);jelly.update(control,value==='story'?0:1,{animate:true});void onChange(value);};
 jelly.update(control,style==='story'?0:1,{animate:false});
 jelly.setupDrag(control,{captureOnDrag:true,getActiveIndex:()=>selected==='story'?0:1,commitIndex:i=>select(i?'free':'story'),suppressClick:ms=>suppressUntil=performance.now()+ms});
 control.addEventListener('click',event=>{if(performance.now()<suppressUntil)event.preventDefault();},{signal:abort.signal,capture:true});
 control.addEventListener('change',event=>{if(event.target.matches('input'))select(event.target.value);},{signal:abort.signal});
 const resize=new ResizeObserver(()=>{if(!control.classList.contains('jelly-v4-moving'))jelly.update(control,selected==='story'?0:1,{animate:false});});resize.observe(control);
 return {destroy(){abort.abort();resize.disconnect();for(const a of control.getAnimations?.({subtree:true})||[])a.cancel();}};
}
