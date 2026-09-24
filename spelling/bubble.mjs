let instance = 0;
const TAU = Math.PI * 2;

export function createBubble(host) {
  const id = `soap-${++instance}`;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const seed = Array.from({ length: 6 }, () => Math.random() * TAU);
  host.innerHTML = `<svg class="soap-svg" viewBox="0 0 400 400" focusable="false" aria-hidden="true">
    <defs>
      <path id="${id}-shape" pathLength="100"/>
      <clipPath id="${id}-clip"><use href="#${id}-shape"/></clipPath>
      <linearGradient id="${id}-rainbow" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#d4a8ff"/><stop offset=".14" stop-color="#f6bbf4"/><stop offset=".27" stop-color="#bcf5ff"/><stop offset=".40" stop-color="#c2c7ff"/><stop offset=".53" stop-color="#ffd4ee"/><stop offset=".67" stop-color="#beecff"/><stop offset=".81" stop-color="#e2b2ff"/><stop offset=".93" stop-color="#fff2d3"/><stop offset="1" stop-color="#d4c5ff"/>
      </linearGradient>
      <radialGradient id="${id}-film" cx=".36" cy=".25" r=".86"><stop stop-color="#fff" stop-opacity=".035"/><stop offset=".58" stop-color="#e8f7ff" stop-opacity=".012"/><stop offset=".82" stop-color="#ccbaff" stop-opacity=".09"/><stop offset=".94" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity=".68"/></radialGradient>
      <linearGradient id="${id}-sheen" x1=".12" y1=".08" x2=".88" y2=".94"><stop stop-color="#fff" stop-opacity=".34"/><stop offset=".24" stop-color="#fff" stop-opacity=".03"/><stop offset=".62" stop-color="#c8f2ff" stop-opacity=".02"/><stop offset=".9" stop-color="#f4c9ff" stop-opacity=".14"/></linearGradient>
      <radialGradient id="${id}-shadow" cx=".5" cy=".58" r=".58"><stop offset=".58" stop-color="#4f447c" stop-opacity=".11"/><stop offset=".82" stop-color="#5a4b86" stop-opacity=".055"/><stop offset="1" stop-color="#5a4b86" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-empty"><stop stop-color="#fff8ed" stop-opacity=".72"/><stop offset=".6" stop-color="#d7d9ff" stop-opacity=".24"/><stop offset="1" stop-color="#b3ebf4" stop-opacity=".4"/></radialGradient>
      <radialGradient id="${id}-star"><stop stop-color="#fff"/><stop offset=".27" stop-color="#fff9df" stop-opacity=".85"/><stop offset="1" stop-color="#ffe4a5" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-orb" cx=".3" cy=".22" r=".9"><stop stop-color="#fff" stop-opacity=".9"/><stop offset=".21" stop-color="#f7c5f8" stop-opacity=".55"/><stop offset=".55" stop-color="#c3e7ff" stop-opacity=".1"/><stop offset=".81" stop-color="#9fecfa" stop-opacity=".68"/><stop offset=".94" stop-color="#e6b2fc" stop-opacity=".88"/><stop offset="1" stop-color="#fff"/></radialGradient>
    </defs>
    <ellipse class="soap-shadow" cx="200" cy="216" rx="170" ry="166" fill="url(#${id}-shadow)" opacity=".76"/>
    <use href="#${id}-shape" fill="none" stroke="#a295d5" stroke-width="20" opacity=".06" transform="translate(0 4)"/>
    <g clip-path="url(#${id}-clip)">
      <rect width="400" height="400" fill="url(#${id}-empty)"/>
      <image class="soap-picture soap-picture-a" x="0" y="0" width="400" height="400" preserveAspectRatio="xMidYMid slice"/>
      <image class="soap-picture soap-picture-b" x="0" y="0" width="400" height="400" preserveAspectRatio="xMidYMid slice"/>
      <rect width="400" height="400" fill="url(#${id}-film)"/>
      <rect width="400" height="400" fill="url(#${id}-sheen)" opacity=".78"/>
    </g>
    <use href="#${id}-shape" fill="none" stroke="#756b9c" stroke-width="3.2" opacity=".12" transform="translate(0 1.8)"/>
    <use href="#${id}-shape" fill="none" stroke="url(#${id}-rainbow)" stroke-width="17" opacity=".38"/>
    <use href="#${id}-shape" fill="none" stroke="url(#${id}-rainbow)" stroke-width="8.5" opacity=".82"/>
    <use href="#${id}-shape" fill="none" stroke="white" stroke-width="1.55" opacity=".94"/>
    <use href="#${id}-shape" fill="none" stroke="#fff" stroke-width="2.1" opacity=".52" transform="translate(200 200) scale(.970) translate(-200 -200)"/>
    <use href="#${id}-shape" class="soap-arc" pathLength="100" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="8 20 4 26 5 37" opacity=".82"/>
    <g class="soap-glint"><ellipse rx="19" ry="5" fill="white" opacity=".2"/><ellipse rx="14" ry="3.5" fill="white" opacity=".94"/></g>
    <g class="soap-glint"><ellipse rx="15" ry="5" fill="white" opacity=".22"/><ellipse rx="11" ry="3" fill="white" opacity=".91"/></g>
    <g class="soap-atmosphere"></g>
  </svg>`;

  const documentUrl = location.href.split('#')[0];
  const shape = host.querySelector(`#${id}-shape`);
  const pictures = [...host.querySelectorAll('.soap-picture')];
  let activePicture = pictures[0], standbyPicture = pictures[1];
  const glints = [...host.querySelectorAll('.soap-glint')];
  const atmosphere = host.querySelector('.soap-atmosphere');
  const spots = [[41,89,6],[114,27,8],[284,30,5],[363,126,6],[369,263,8],[299,375,7],[75,349,5],[22,256,9],[327,337,4]];
  atmosphere.innerHTML = spots.map(([x,y,r]) => `<g class="soap-star" style="--spark-delay:${-Math.random()*6}s;--spark-duration:${3.8+Math.random()*4.5}s" transform="translate(${x} ${y})"><circle r="${r*2.2}" fill="url(#${id}-star)"/><path d="M0 ${-r} Q${r*.13} ${-r*.13} ${r*.65} 0 Q${r*.13} ${r*.13} 0 ${r} Q${-r*.13} ${r*.13} ${-r*.65} 0 Q${-r*.13} ${-r*.13} 0 ${-r}" fill="#fffef4"/><circle r="1" fill="white"/></g>`).join('') +
    [[63,43,12],[367,188,14],[39,310,10],[262,382,11]].map(([x,y,r],index) => `<g class="soap-satellite" style="--orb-delay:${-index*2.3}s;--orb-duration:${7.2+index*1.9}s" transform="translate(${x} ${y})"><circle r="${r}" fill="url(#${id}-orb)" stroke="#fff" stroke-width=".9"/><ellipse cx="${-r*.3}" cy="${-r*.5}" rx="${r*.26}" ry="${r*.14}" transform="rotate(-24)" fill="white" opacity=".9"/></g>`).join('');

  host.querySelectorAll('use,[clip-path],[filter],[fill],[stroke]').forEach(element => {
    for (const attribute of ['href','clip-path','filter','fill','stroke']) {
      const value = element.getAttribute(attribute);
      if (value?.startsWith('#') && attribute === 'href') element.setAttribute(attribute, documentUrl + value);
      else if (value?.includes('url(#')) element.setAttribute(attribute, value.replace(/url\(#([^)]*)\)/g, (_,name) => `url("${documentUrl}#${name}")`));
    }
  });

  let frame = 0, elapsed = Math.random() * 50, last = 0, paused = false, destroyed = false;
  let currentUrl = '', loadToken = 0, transitions = [];

  function point(angle, time) {
    const radius = 169 + (9 + 1.5 * Math.sin(time*.24+seed[4])) * Math.sin(3*angle + .28*Math.sin(time*.22+seed[0]) + seed[1])
      + 4.5*Math.sin(2*angle+time*.31+seed[2]) + 2.5*Math.sin(5*angle-time*.19+seed[3]);
    return [200 + Math.cos(angle)*radius, 200 + Math.sin(angle)*radius];
  }
  function draw(time) {
    const count=18, points = Array.from({length:count}, (_,i) => point(i/count*TAU,time));
    const xy=p=>p.map(v=>v.toFixed(2)).join(' ');
    let contour=`M${xy(points[0])}`;
    for(let i=0;i<count;i++){
      const a=points[(i+count-1)%count],b=points[i],c=points[(i+1)%count],d=points[(i+2)%count];
      contour+=`C${xy([b[0]+(c[0]-a[0])/6,b[1]+(c[1]-a[1])/6])} ${xy([c[0]-(d[0]-b[0])/6,c[1]-(d[1]-b[1])/6])} ${xy(c)}`;
    }
    shape.setAttribute('d',contour+'Z');
    [-1.24,-.52].forEach((angle,index)=>{
      const p=point(angle,time), prev=point(angle-.025,time), next=point(angle+.025,time);
      const rotation=Math.atan2(next[1]-prev[1],next[0]-prev[0])*180/Math.PI;
      glints[index].setAttribute('transform',`translate(${p[0]} ${p[1]}) rotate(${rotation})`);
    });
  }
  function loop(now) {
    frame = 0;
    if (destroyed || paused || document.hidden || reduced.matches) { last = 0; return; }
    if (!last || now-last >= 1000/24) {
      elapsed += last ? Math.min((now-last)/1000,.1) * 2.6 : 0;
      last = now; draw(elapsed);
    }
    frame = requestAnimationFrame(loop);
  }
  function syncMotion() {
    cancelAnimationFrame(frame); frame=0; last=0;
    host.classList.toggle('soap-still', paused || document.hidden || reduced.matches);
    if (!destroyed && !paused && !document.hidden && !reduced.matches) frame=requestAnimationFrame(loop);
  }
  draw(elapsed); syncMotion();
  document.addEventListener('visibilitychange',syncMotion);
  function motionPreferenceChanged() {
    syncMotion();
    if (reduced.matches) transitions.forEach(animation => animation.finish());
  }
  reduced.addEventListener('change',motionPreferenceChanged);

  const imageLoads = new Map();
  function hasPictureSource(picture) { return Boolean(picture?.getAttribute('href')); }
  function setPictureSource(picture, url='') {
    if (url) picture.setAttribute('href', url);
    else picture.removeAttribute('href');
  }
  function setPictureAlignment(picture, alignment='xMidYMid slice') {
    picture.setAttribute('preserveAspectRatio', alignment);
  }
  function waitForImage(url) {
    if (imageLoads.has(url)) return imageLoads.get(url);
    const load = new Promise((resolve,reject)=>{
      const img=new Image();
      img.decoding='async';
      let settled=false;
      const finish=(ok)=>{
        if(settled) return;
        settled=true;
        clearTimeout(timeout);
        if(ok && img.naturalWidth>0 && img.naturalHeight>0) resolve(url);
        else reject(new Error('scene-load-failed'));
      };
      const timeout=setTimeout(()=>finish(false),6000);
      img.onload=()=>img.decode().then(()=>finish(true),()=>finish(false));
      img.onerror=()=>finish(false);
      img.src=url;
      if (img.complete && img.naturalWidth) img.decode().then(()=>finish(true),()=>finish(false));
    }).catch(error=>{ imageLoads.delete(url); throw error; });
    imageLoads.set(url, load);
    return load;
  }
  async function transitionToScene(url, scene, first=false) {
    const token=++loadToken;
    if (url===currentUrl && hasPictureSource(activePicture)) return true;

    if (!url) {
      const old=activePicture;
      currentUrl='';
      if (!hasPictureSource(old)) return true;
      if (reduced.matches) { old.style.opacity='0'; setPictureSource(old); return true; }
      const animation=old.animate([{opacity:1},{opacity:0}],{duration:260,easing:'ease-out',fill:'both'});
      transitions=[animation]; if(paused) animation.pause();
      await animation.finished.catch(()=>{});
      if(token===loadToken){ old.style.opacity='0'; setPictureSource(old); }
      animation.cancel(); transitions=[];
      return true;
    }

    let displayUrl=url;
    try {
      await waitForImage(displayUrl);
    } catch (error) {
      if (destroyed || token!==loadToken) return false;
      console.warn('[spelling-scene] image could not be decoded', { url, scene: scene?.key, error });
      host.dataset.imageState='error';
      // Never teach the wrong association by substituting an unrelated rabbit.
      await transitionToScene('', scene);
      return false;
    }
    if (destroyed || token!==loadToken) return false;
    host.dataset.imageState='ready';

    const next=standbyPicture, old=activePicture;
    setPictureSource(next,displayUrl);
    setPictureAlignment(next, scene?.alignment || 'xMidYMid slice');
    next.style.opacity='0';
    const hasOld=hasPictureSource(old);

    if (reduced.matches) {
      old.style.opacity='0'; setPictureSource(old);
      next.style.opacity='1';
      activePicture=next; standbyPicture=old; currentUrl=displayUrl;
      return true;
    }

    const duration=first || !hasOld ? 380 : 520;
    const incoming=next.animate(
      [{opacity:0},{opacity:.62,offset:.52},{opacity:1}],
      {duration,easing:'cubic-bezier(.22,.61,.36,1)',fill:'both'}
    );
    const outgoing=hasOld ? old.animate(
      [{opacity:1},{opacity:.72,offset:.42},{opacity:0}],
      {duration:Math.round(duration*.92),easing:'cubic-bezier(.22,.61,.36,1)',fill:'both'}
    ) : null;
    transitions=[incoming,...(outgoing?[outgoing]:[])];
    if(paused) transitions.forEach(animation=>animation.pause());
    await Promise.all(transitions.map(animation=>animation.finished.catch(()=>{})));
    if (destroyed || token!==loadToken) {
      transitions.forEach(animation=>animation.cancel()); transitions=[]; return false;
    }
    old.style.opacity='0'; setPictureSource(old);
    next.style.opacity='1';
    transitions.forEach(animation=>animation.cancel()); transitions=[];
    activePicture=next; standbyPicture=old; currentUrl=displayUrl;
    return true;
  }

  return {
    transitionToScene,
    setPaused(value) {
      paused=value; syncMotion();
      transitions.forEach(animation=>value?animation.pause():animation.play());
    },
    destroy() {
      destroyed=true; loadToken++; cancelAnimationFrame(frame);
      transitions.forEach(animation=>animation.cancel()); transitions=[];
      document.removeEventListener('visibilitychange',syncMotion);
      reduced.removeEventListener('change',motionPreferenceChanged);
    },
  };
}
