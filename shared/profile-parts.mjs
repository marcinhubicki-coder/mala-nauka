// Profile primitives shared by gameplay and the isolated building-block library.
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const avatars='abcdefghijkl';
export function profileAvatar(player={},extra='',assetURL=path=>path){
 let key=player.avatarId;
 if(typeof key!=='string'||key.length!==1||!avatars.includes(key)){const sum=[...String(player.id||player.nickname||'a')].reduce((n,c)=>n+c.charCodeAt(0),0);key=avatars[sum%4];}
 const src=escape(assetURL('assets/brand/avatars/'+key+'.webp'));
 return `<span class="player-avatar-art ${escape(extra)}" data-avatar="${key}" style="--player-avatar-src:url(&quot;${src}&quot;)" aria-hidden="true"></span>`;
}
export function pinModeMarkup(enabled=true,name='profilePinMode'){
 return `<div class="pin-mode" role="radiogroup" aria-label="Ochrona profilu"><span class="pin-mode-indicator" aria-hidden="true"></span>${[['pin','Ustaw PIN'],['none','Bez PIN-u']].map(([value,label],i)=>`<label><input type="radio" name="${escape(name)}" value="${value}" ${enabled===(i===0)?'checked':''}><span>${label}</span></label>`).join('')}</div>`;
}
export function pinDotMarkup(filled=false){return `<span class="${filled?'filled':''}"></span>`;}
export function pinDotsMarkup(count=0){return `<div class="pin-dots" aria-label="Wpisano ${count} z 4 cyfr">${Array.from({length:4},(_,i)=>pinDotMarkup(i<count)).join('')}</div>`;}
export function pinKeyMarkup(value,{disabled=false,submitLabel='Zapisz profil'}={}){
 const back=value==='⌫',submit=value==='✓',action=back?'pin-backspace':submit?'submit-pin':'pin-digit',label=back?'Usuń ostatnią cyfrę':submit?submitLabel:'Cyfra '+value;
 return `<button type="button" class="pin-key${back?' pin-back':submit?' pin-submit':''}" data-action="${action}" ${!back&&!submit?`data-digit="${escape(value)}"`:''} ${disabled?'disabled':''} aria-label="${escape(label)}">${escape(value)}</button>`;
}
export function pinKeypadMarkup(count=0,submitLabel='Zapisz profil'){
 return `<div class="pin-keypad" aria-label="Klawiatura PIN">${[1,2,3,4,5,6,7,8,9,'⌫',0,'✓'].map(n=>pinKeyMarkup(n,{disabled:n==='✓'&&count!==4,submitLabel})).join('')}</div>`;
}
