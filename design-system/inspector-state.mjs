// Re-rendering fields must not act like clicking an accordion summary.
export function inspectorState(root){return {scroll:root.scrollTop,groups:new Map([...root.querySelectorAll('details')].map(d=>[d.querySelector(':scope > summary')?.textContent,d.open]))};}
export function restoreInspector(root,state){for(const d of root.querySelectorAll('details')){const key=d.querySelector(':scope > summary')?.textContent;if(state.groups.has(key))d.open=state.groups.get(key);}root.scrollTop=state.scroll;}
