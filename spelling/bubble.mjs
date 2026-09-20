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
      <radialGradient id="${id}-film" cx=".38" cy=".27" r=".8"><stop stop-color="#fff" stop-opacity=".08"/><stop offset=".64" stop-color="#d5efff" stop-opacity="0"/><stop offset=".86" stop-color="#d5c4ff" stop-opacity=".12"/><stop offset="1" stop-color="#fff" stop-opacity=".65"/></radialGradient>
      <radialGradient id="${id}-empty"><stop stop-color="#fff8ed" stop-opacity=".72"/><stop offset=".6" stop-color="#d7d9ff" stop-opacity=".24"/><stop offset="1" stop-color="#b3ebf4" stop-opacity=".4"/></radialGradient>
      <filter id="${id}-soft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation=".75"/></filter>
      <radialGradient id="${id}-star"><stop stop-color="#fff"/><stop offset=".27" stop-color="#fff9df" stop-opacity=".85"/><stop offset="1" stop-color="#ffe4a5" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-orb" cx=".3" cy=".22" r=".9"><stop stop-color="#fff" stop-opacity=".9"/><stop offset=".21" stop-color="#f7c5f8" stop-opacity=".55"/><stop offset=".55" stop-color="#c3e7ff" stop-opacity=".1"/><stop offset=".81" stop-color="#9fecfa" stop-opacity=".68"/><stop offset=".94" stop-color="#e6b2fc" stop-opacity=".88"/><stop offset="1" stop-color="#fff"/></radialGradient>
    </defs>
    <use href="#${id}-shape" fill="none" stroke="#a295d5" stroke-width="24" opacity=".075" transform="translate(0 5)"/>
    <g clip-path="url(#${id}-clip)">
      <rect width="400" height="400" fill="url(#${id}-empty)"/>
      <foreignObject class="soap-picture soap-picture-a" x="8" y="8" width="384" height="384">
        <div xmlns="http://www.w3.org/1999/xhtml" class="soap-picture-frame"><img class="soap-picture-img" alt="" draggable="false" decoding="async"/></div>
      </foreignObject>
      <foreignObject class="soap-picture soap-picture-b" x="8" y="8" width="384" height="384">
        <div xmlns="http://www.w3.org/1999/xhtml" class="soap-picture-frame"><img class="soap-picture-img" alt="" draggable="false" decoding="async"/></div>
      </foreignObject>
      <rect width="400" height="400" fill="url(#${id}-film)"/>
    </g>
    <use href="#${id}-shape" fill="none" stroke="url(#${id}-rainbow)" stroke-width="20" opacity=".42"/>
    <use href="#${id}-shape" fill="none" stroke="url(#${id}-rainbow)" stroke-width="10" opacity=".83"/>
    <use href="#${id}-shape" fill="none" stroke="white" stroke-width="1.65" opacity=".93"/>
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
    const radius = 164 + (12 + 2 * Math.sin(time*.19+seed[4])) * Math.sin(3*angle + .23*Math.sin(time*.17+seed[0]) + seed[1])
      + 6*Math.sin(2*angle+time*.23+seed[2]) + 3*Math.sin(5*angle-time*.13+seed[3]);
    return [200 + Math.cos(angle)*radius, 200 + Math.sin(angle)*radius];
  }
  function draw(time) {
    const count=24, points = Array.from({length:count}, (_,i) => point(i/count*TAU,time));
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
      elapsed += last ? Math.min((now-last)/1000,.1) * 1.28 : 0;
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

  const FALLBACK_URL = new URL('../assets/scenes/bunny.webp', import.meta.url).href;
  const imageLoads = new Map();
  function pictureImage(picture) { return picture?.querySelector('.soap-picture-img'); }
  function hasPictureSource(picture) { return Boolean(pictureImage(picture)?.getAttribute('src')); }
  function setPictureSource(picture, url='') {
    const img = pictureImage(picture);
    if (!img) return;
    if (url) img.src = url;
    else img.removeAttribute('src');
  }
  function setPictureAlignment(picture, alignment='xMidYMid slice') {
    const img = pictureImage(picture);
    if (!img) return;
    const x = alignment.includes('xMin') ? 'left' : alignment.includes('xMax') ? 'right' : 'center';
    const y = alignment.includes('YMin') ? 'top' : alignment.includes('YMax') ? 'bottom' : 'center';
    img.style.objectPosition = `${x} ${y}`;
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
      img.onload=()=>finish(true);
      img.onerror=()=>finish(false);
      img.src=url;
      if (img.complete) queueMicrotask(()=>finish(Boolean(img.naturalWidth)));
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
      console.warn('[spelling-scene] asset failed, using fallback', { url, scene: scene?.key, error });
      displayUrl=FALLBACK_URL;
      try { await waitForImage(displayUrl); } catch { return false; }
    }
    if (destroyed || token!==loadToken) return false;

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
