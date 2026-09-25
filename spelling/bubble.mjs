let instance = 0;
const TAU = Math.PI * 2;

export const BUBBLE_TUNING_DEFAULTS = Object.freeze({
  speed: 4.4,
  points: 48,
  random: 2.85,
  smoothing: 1.35,
  bounce: .75,
  corners: 2,
});

export const BUBBLE_EFFECT_DEFAULTS = Object.freeze({
  shadow: 1.25,
  depth: 1.15,
  glow: 2,
  sheen: 1.55,
  rainbow: 1.25,
  rim: 1.05,
});

export const BUBBLE_CHAOS_DEFAULTS = Object.freeze({
  amplitude: 1,
  frequency: 1,
  orbit: 1,
  magnet: 0,
  jelly: 1,
  squash: 0,
});

export const BUBBLE_HEAVY_DEFAULTS = Object.freeze({
  blur: 0,
  shadowBlur: 0,
  particles: 0,
  energy: 1,
  refraction: 0,
  bloom: 0,
});

const clampValue=(value,min,max)=>Math.max(min,Math.min(max,value));
function normalizeTuning(input={}){
  const merged={...BUBBLE_TUNING_DEFAULTS,...input};
  const numeric=(value,fallback)=>{
    const parsed=Number(value);
    return Number.isFinite(parsed)?parsed:fallback;
  };
  return {
    speed:clampValue(numeric(merged.speed,BUBBLE_TUNING_DEFAULTS.speed),2.2,6.6),
    points:Math.round(clampValue(numeric(merged.points,BUBBLE_TUNING_DEFAULTS.points),24,72)/4)*4,
    random:clampValue(numeric(merged.random,BUBBLE_TUNING_DEFAULTS.random),0,5.7),
    smoothing:clampValue(numeric(merged.smoothing,BUBBLE_TUNING_DEFAULTS.smoothing),.35,2.35),
    bounce:clampValue(numeric(merged.bounce,BUBBLE_TUNING_DEFAULTS.bounce),.2,1.3),
    corners:clampValue(numeric(merged.corners,BUBBLE_TUNING_DEFAULTS.corners),0,4),
  };
}
function normalizeEffects(input={}){
  const merged={...BUBBLE_EFFECT_DEFAULTS,...input};
  const numeric=(value,fallback)=>{
    const parsed=Number(value);
    return Number.isFinite(parsed)?parsed:fallback;
  };
  return {
    shadow:clampValue(numeric(merged.shadow,BUBBLE_EFFECT_DEFAULTS.shadow),0,2),
    depth:clampValue(numeric(merged.depth,BUBBLE_EFFECT_DEFAULTS.depth),.4,1.6),
    glow:clampValue(numeric(merged.glow,BUBBLE_EFFECT_DEFAULTS.glow),0,2),
    sheen:clampValue(numeric(merged.sheen,BUBBLE_EFFECT_DEFAULTS.sheen),0,2),
    rainbow:clampValue(numeric(merged.rainbow,BUBBLE_EFFECT_DEFAULTS.rainbow),0,2),
    rim:clampValue(numeric(merged.rim,BUBBLE_EFFECT_DEFAULTS.rim),0,2),
  };
}
function normalizeChaos(input={}){
  const merged={...BUBBLE_CHAOS_DEFAULTS,...input};
  const numeric=(value,fallback)=>{
    const parsed=Number(value);
    return Number.isFinite(parsed)?parsed:fallback;
  };
  return {
    amplitude:clampValue(numeric(merged.amplitude,BUBBLE_CHAOS_DEFAULTS.amplitude),-2,4),
    frequency:clampValue(numeric(merged.frequency,BUBBLE_CHAOS_DEFAULTS.frequency),-2,4),
    orbit:clampValue(numeric(merged.orbit,BUBBLE_CHAOS_DEFAULTS.orbit),-2,4),
    magnet:clampValue(numeric(merged.magnet,BUBBLE_CHAOS_DEFAULTS.magnet),-3,3),
    jelly:clampValue(numeric(merged.jelly,BUBBLE_CHAOS_DEFAULTS.jelly),0,2),
    squash:clampValue(numeric(merged.squash,BUBBLE_CHAOS_DEFAULTS.squash),-1,1),
  };
}
function normalizeHeavy(input={}){
  const merged={...BUBBLE_HEAVY_DEFAULTS,...input};
  const numeric=(value,fallback)=>{
    const parsed=Number(value);
    return Number.isFinite(parsed)?parsed:fallback;
  };
  return {
    blur:clampValue(numeric(merged.blur,BUBBLE_HEAVY_DEFAULTS.blur),0,10),
    shadowBlur:clampValue(numeric(merged.shadowBlur,BUBBLE_HEAVY_DEFAULTS.shadowBlur),0,18),
    particles:Math.round(clampValue(numeric(merged.particles,BUBBLE_HEAVY_DEFAULTS.particles),0,48)),
    energy:clampValue(numeric(merged.energy,BUBBLE_HEAVY_DEFAULTS.energy),0,4),
    refraction:clampValue(numeric(merged.refraction,BUBBLE_HEAVY_DEFAULTS.refraction),0,36),
    bloom:clampValue(numeric(merged.bloom,BUBBLE_HEAVY_DEFAULTS.bloom),0,3),
  };
}

export function createBubble(host, options={}) {
  const id = `soap-${++instance}`;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const seed = Array.from({ length: 6 }, () => Math.random() * TAU);
  let tuning = normalizeTuning(options.tuning);
  let effects = normalizeEffects(options.effects);
  let chaos = normalizeChaos(options.chaos);
  let heavy = normalizeHeavy(options.heavy);
  host.innerHTML = `<svg class="soap-svg" viewBox="0 0 400 400" focusable="false" aria-hidden="true">
    <defs>
      <path id="${id}-shape" pathLength="100"/>
      <clipPath id="${id}-clip"><use href="#${id}-shape"/></clipPath>
      <clipPath id="${id}-frame"><rect x="0" y="0" width="400" height="400"/></clipPath>
      <filter id="${id}-pictureFx" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB">
        <feTurbulence class="soap-refraction-noise" type="fractalNoise" baseFrequency=".012 .017" numOctaves="2" seed="11" result="noise"/>
        <feDisplacementMap class="soap-refraction-node" in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="B" result="warped"/>
        <feGaussianBlur class="soap-picture-blur-node" in="warped" stdDeviation="0"/>
      </filter>
      <filter id="${id}-shadowFx" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
        <feGaussianBlur class="soap-shadow-blur-node" stdDeviation="0"/>
      </filter>
      <filter id="${id}-bloomFx" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
        <feGaussianBlur class="soap-bloom-blur-node" stdDeviation="2.5" result="bloomBlur"/>
        <feMerge><feMergeNode in="bloomBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <linearGradient id="${id}-rainbow" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#d4a8ff"/><stop offset=".14" stop-color="#f6bbf4"/><stop offset=".27" stop-color="#bcf5ff"/><stop offset=".40" stop-color="#c2c7ff"/><stop offset=".53" stop-color="#ffd4ee"/><stop offset=".67" stop-color="#beecff"/><stop offset=".81" stop-color="#e2b2ff"/><stop offset=".93" stop-color="#fff2d3"/><stop offset="1" stop-color="#d4c5ff"/>
      </linearGradient>
      <radialGradient id="${id}-film" cx=".36" cy=".25" r=".86"><stop stop-color="#fff" stop-opacity=".035"/><stop offset=".58" stop-color="#e8f7ff" stop-opacity=".012"/><stop offset=".82" stop-color="#ccbaff" stop-opacity=".09"/><stop offset=".94" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity=".68"/></radialGradient>
      <linearGradient id="${id}-sheen" x1=".12" y1=".08" x2=".88" y2=".94"><stop stop-color="#fff" stop-opacity=".34"/><stop offset=".24" stop-color="#fff" stop-opacity=".03"/><stop offset=".62" stop-color="#c8f2ff" stop-opacity=".02"/><stop offset=".9" stop-color="#f4c9ff" stop-opacity=".14"/></linearGradient>
      <radialGradient id="${id}-innerLift" cx=".5" cy=".46" r=".68"><stop offset="0" stop-color="#fff" stop-opacity=".055"/><stop offset=".55" stop-color="#fff" stop-opacity=".02"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-empty"><stop stop-color="#fff8ed" stop-opacity=".72"/><stop offset=".6" stop-color="#d7d9ff" stop-opacity=".24"/><stop offset="1" stop-color="#b3ebf4" stop-opacity=".4"/></radialGradient>
      <radialGradient id="${id}-star"><stop stop-color="#fff"/><stop offset=".27" stop-color="#fff9df" stop-opacity=".85"/><stop offset="1" stop-color="#ffe4a5" stop-opacity="0"/></radialGradient>
      <radialGradient id="${id}-orb" cx=".3" cy=".22" r=".9"><stop stop-color="#fff" stop-opacity=".9"/><stop offset=".21" stop-color="#f7c5f8" stop-opacity=".55"/><stop offset=".55" stop-color="#c3e7ff" stop-opacity=".1"/><stop offset=".81" stop-color="#9fecfa" stop-opacity=".68"/><stop offset=".94" stop-color="#e6b2fc" stop-opacity=".88"/><stop offset="1" stop-color="#fff"/></radialGradient>
    </defs>
    <g class="soap-frame-guard" clip-path="url(#${id}-frame)">
      <g class="soap-shadow-group" filter="url(#${id}-shadowFx)">
        <use href="#${id}-shape" class="soap-shadow soap-shadow-main" fill="#4b3f69" opacity=".085" transform="translate(0 9)"/>
        <use href="#${id}-shape" class="soap-shadow soap-shadow-soft" fill="#6a5a8f" opacity=".035" transform="translate(200 200) scale(.995) translate(-199 -195)"/>
        <use href="#${id}-shape" class="soap-shadow-ring" fill="none" stroke="#a295d5" stroke-width="20" opacity=".06" transform="translate(0 4)"/>
      </g>
      <g clip-path="url(#${id}-clip)">
        <rect width="400" height="400" fill="url(#${id}-empty)"/>
        <image class="soap-picture soap-picture-a" filter="url(#${id}-pictureFx)" x="0" y="0" width="400" height="400" preserveAspectRatio="xMidYMid slice"/>
        <image class="soap-picture soap-picture-b" filter="url(#${id}-pictureFx)" x="0" y="0" width="400" height="400" preserveAspectRatio="xMidYMid slice"/>
        <rect class="soap-film-overlay" width="400" height="400" fill="url(#${id}-film)"/>
        <rect class="soap-sheen-overlay" width="400" height="400" fill="url(#${id}-sheen)" opacity=".78"/>
        <rect class="soap-inner-lift" width="400" height="400" fill="url(#${id}-innerLift)" opacity=".92"/>
        <g class="soap-heavy-particles"></g>
      </g>
      <use href="#${id}-shape" class="soap-heavy-bloom" fill="none" stroke="white" stroke-width="5.5" opacity="0" filter="url(#${id}-bloomFx)"/>
      <use href="#${id}-shape" class="soap-rim-dark" fill="none" stroke="#756b9c" stroke-width="3.2" opacity=".12" transform="translate(0 1.8)"/>
      <use href="#${id}-shape" class="soap-rainbow-outer" fill="none" stroke="url(#${id}-rainbow)" stroke-width="17" opacity=".38"/>
      <use href="#${id}-shape" class="soap-rainbow-inner" fill="none" stroke="url(#${id}-rainbow)" stroke-width="8.5" opacity=".82"/>
      <use href="#${id}-shape" class="soap-rim-main" fill="none" stroke="white" stroke-width="1.7" opacity=".96"/>
      <use href="#${id}-shape" class="soap-rim-soft" fill="none" stroke="#fff7ff" stroke-width="3.4" opacity=".14" transform="translate(200 200) scale(1.004) translate(-200 -200)"/>
      <use href="#${id}-shape" class="soap-rim-inner" fill="none" stroke="#fff" stroke-width="2.1" opacity=".52" transform="translate(200 200) scale(.970) translate(-200 -200)"/>
      <use href="#${id}-shape" class="soap-arc" pathLength="100" fill="none" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-dasharray="8 20 4 26 5 37" opacity=".82"/>
      <g class="soap-glint"><ellipse rx="19" ry="5" fill="white" opacity=".2"/><ellipse rx="14" ry="3.5" fill="white" opacity=".94"/></g>
      <g class="soap-glint"><ellipse rx="15" ry="5" fill="white" opacity=".22"/><ellipse rx="11" ry="3" fill="white" opacity=".91"/></g>
      <g class="soap-atmosphere"></g>
    </g>
  </svg>`;

  const documentUrl = location.href.split('#')[0];
  const shape = host.querySelector(`#${id}-shape`);
  const pictures = [...host.querySelectorAll('.soap-picture')];
  let activePicture = pictures[0], standbyPicture = pictures[1];
  const glints = [...host.querySelectorAll('.soap-glint')];
  const atmosphere = host.querySelector('.soap-atmosphere');
  const particleHost = host.querySelector('.soap-heavy-particles');
  const effectNodes = {
    shadowMain:host.querySelector('.soap-shadow-main'),
    shadowSoft:host.querySelector('.soap-shadow-soft'),
    shadowRing:host.querySelector('.soap-shadow-ring'),
    innerLift:host.querySelector('.soap-inner-lift'),
    sheen:host.querySelector('.soap-sheen-overlay'),
    rainbowOuter:host.querySelector('.soap-rainbow-outer'),
    rainbowInner:host.querySelector('.soap-rainbow-inner'),
    rimDark:host.querySelector('.soap-rim-dark'),
    rimMain:host.querySelector('.soap-rim-main'),
    rimSoft:host.querySelector('.soap-rim-soft'),
    rimInner:host.querySelector('.soap-rim-inner'),
  };
  const heavyNodes = {
    refraction:host.querySelector('.soap-refraction-node'),
    pictureBlur:host.querySelector('.soap-picture-blur-node'),
    shadowBlur:host.querySelector('.soap-shadow-blur-node'),
    bloomBlur:host.querySelector('.soap-bloom-blur-node'),
    bloom:host.querySelector('.soap-heavy-bloom'),
  };
  const spots = [[41,89,6],[114,27,8],[284,30,5],[363,126,6],[369,263,8],[299,375,7],[75,349,5],[22,256,9],[327,337,4]];
  atmosphere.innerHTML = spots.map(([x,y,r]) => `<g class="soap-star" style="--spark-delay:${-Math.random()*6}s;--spark-duration:${3.8+Math.random()*4.5}s" transform="translate(${x} ${y})"><circle r="${r*2.2}" fill="url(#${id}-star)"/><path d="M0 ${-r} Q${r*.13} ${-r*.13} ${r*.65} 0 Q${r*.13} ${r*.13} 0 ${r} Q${-r*.13} ${r*.13} ${-r*.65} 0 Q${-r*.13} ${-r*.13} 0 ${-r}" fill="#fffef4"/><circle r="1" fill="white"/></g>`).join('') +
    [[63,43,12],[367,188,14],[39,310,10],[262,382,11]].map(([x,y,r],index) => `<g class="soap-satellite" style="--orb-delay:${-index*2.3}s;--orb-duration:${7.2+index*1.9}s" transform="translate(${x} ${y})"><circle r="${r}" fill="url(#${id}-orb)" stroke="#fff" stroke-width=".9"/><ellipse cx="${-r*.3}" cy="${-r*.5}" rx="${r*.26}" ry="${r*.14}" transform="rotate(-24)" fill="white" opacity=".9"/></g>`).join('');

  const particleData=Array.from({length:48},(_,index)=>({
    x:28+Math.random()*344,
    y:28+Math.random()*344,
    phase:Math.random()*TAU,
    spin:(.45+Math.random()*1.45)*(index%2?-1:1),
    radius:1.2+Math.random()*2.8,
    opacity:.28+Math.random()*.62,
  }));
  particleHost.innerHTML=particleData.map((particle,index)=>{
    const fill=index%3===0?'#fff3c8':index%3===1?'#ffffff':'#bff5ff';
    return `<circle class="soap-heavy-particle" cx="0" cy="0" r="${particle.radius.toFixed(2)}" fill="${fill}" opacity="0"/>`;
  }).join('');
  const particleNodes=[...particleHost.querySelectorAll('.soap-heavy-particle')];

  host.querySelectorAll('use,[clip-path],[filter],[fill],[stroke]').forEach(element => {
    for (const attribute of ['href','clip-path','filter','fill','stroke']) {
      const value = element.getAttribute(attribute);
      if (value?.startsWith('#') && attribute === 'href') element.setAttribute(attribute, documentUrl + value);
      else if (value?.includes('url(#')) element.setAttribute(attribute, value.replace(/url\(#([^)]*)\)/g, (_,name) => `url("${documentUrl}#${name}")`));
    }
  });

  function applyEffects(){
    const shadow=effects.shadow, depth=effects.depth;
    effectNodes.shadowMain.setAttribute('opacity',(0.085*shadow).toFixed(3));
    effectNodes.shadowSoft.setAttribute('opacity',(0.035*shadow).toFixed(3));
    effectNodes.shadowRing.setAttribute('opacity',(0.06*shadow).toFixed(3));
    effectNodes.shadowMain.setAttribute('transform',`translate(0 ${(9*depth).toFixed(2)})`);
    effectNodes.shadowSoft.setAttribute('transform',`translate(200 200) scale(.995) translate(-199 ${(-200+5*depth).toFixed(2)})`);
    effectNodes.shadowRing.setAttribute('transform',`translate(0 ${(4*depth).toFixed(2)})`);
    effectNodes.innerLift.setAttribute('opacity',(0.92*effects.glow).toFixed(3));
    effectNodes.sheen.setAttribute('opacity',(0.78*effects.sheen).toFixed(3));
    effectNodes.rainbowOuter.setAttribute('opacity',(0.38*effects.rainbow).toFixed(3));
    effectNodes.rainbowInner.setAttribute('opacity',(0.82*effects.rainbow).toFixed(3));
    effectNodes.rimDark.setAttribute('opacity',(0.12*effects.rim).toFixed(3));
    effectNodes.rimMain.setAttribute('opacity',(0.96*effects.rim).toFixed(3));
    effectNodes.rimSoft.setAttribute('opacity',(0.14*effects.rim).toFixed(3));
    effectNodes.rimInner.setAttribute('opacity',(0.52*effects.rim).toFixed(3));
  }
  applyEffects();

  function applyHeavy(){
    heavyNodes.refraction.setAttribute('scale',heavy.refraction.toFixed(2));
    heavyNodes.pictureBlur.setAttribute('stdDeviation',heavy.blur.toFixed(2));
    heavyNodes.shadowBlur.setAttribute('stdDeviation',(heavy.shadowBlur*.5).toFixed(2));
    heavyNodes.bloomBlur.setAttribute('stdDeviation',(2.5+heavy.bloom*3.4).toFixed(2));
    heavyNodes.bloom.setAttribute('opacity',Math.min(.72,heavy.bloom*.18).toFixed(3));
    heavyNodes.bloom.setAttribute('stroke-width',(5.5+heavy.bloom*3.5).toFixed(2));
    particleNodes.forEach((node,index)=>{
      node.style.display=index<heavy.particles?'':'none';
      if(index>=heavy.particles) node.setAttribute('opacity','0');
    });
  }
  applyHeavy();

  let frame = 0, elapsed = options.startAtZero ? 0 : Math.random() * 50, last = 0, paused = false, destroyed = false;
  let currentUrl = '', loadToken = 0, transitions = [];

  const fmt=value=>value.toFixed(2);
  const sign=value=>value<0?-1:1;
  const wave=value=>(Math.sin(value)+1)*.5;
  const cornerAngles=[.25,.75,1.25,1.75].map(value=>value*Math.PI);
  const primaryCorner=Math.floor(seed[0]/TAU*4)%4;
  const secondaryCorner=(primaryCorner+(seed[1]>Math.PI?1:3))%4;
  const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
  const influence=(angle,center,width,power=2)=>{
    const delta=Math.abs(angleDelta(angle,center));
    if(delta>=width)return 0;
    return Math.pow(Math.cos(delta/width*Math.PI*.5),power);
  };
  let membrane=null, membraneVelocity=null;
  const SAFE_EDGE=14;
  const SAFE_MAX=400-SAFE_EDGE;

  function updateParticles(time){
    if(!heavy.particles)return;
    const energy=heavy.energy;
    particleNodes.forEach((node,index)=>{
      if(index>=heavy.particles)return;
      const data=particleData[index];
      const speed=.18+.16*energy+Math.abs(data.spin)*.03;
      const orbit=4+energy*8;
      const x=clampValue(data.x+Math.sin(time*speed+data.phase)*orbit,SAFE_EDGE,SAFE_MAX);
      const y=clampValue(data.y+Math.cos(time*(speed*.83)+data.phase*1.7)*orbit,SAFE_EDGE,SAFE_MAX);
      const pulse=.45+.55*wave(time*(.7+.12*energy)+data.phase);
      node.setAttribute('transform',`translate(${x.toFixed(2)} ${y.toFixed(2)})`);
      node.setAttribute('opacity',(data.opacity*pulse*Math.min(1.4,.45+.28*energy)).toFixed(3));
    });
  }

  // The outline behaves like a softly tensioned membrane rather than an
  // animated rounded rectangle. Three control waves live on both the top and
  // bottom edge; their motion is spread to neighbouring points before the
  // closed Catmull-Rom spline is converted to cubic Beziers.
  function draw(time) {
    const count=tuning.points;
    const irregularity=tuning.random;
    const spatial=chaos.frequency;
    const squashWave=.14*chaos.squash*Math.sin(time*.21+seed[1]);
    const exponent=3.28 + .14*irregularity*Math.sin(time*.15+seed[4]);
    const halfW=(196.4 + .45*irregularity*Math.sin(time*.13+seed[0]))*(1+squashWave);
    const halfH=(196.2 + .42*irregularity*Math.sin(time*.12+seed[1]))*(1-squashWave);
    const orbitDelta=chaos.orbit-1;
    const centerX=200 + 1.45*irregularity*chaos.orbit*Math.sin(time*.16+seed[5])
      +9*orbitDelta*Math.cos(time*.23+seed[0]);
    const centerY=200 + .9*irregularity*chaos.orbit*Math.sin(time*.13+seed[2])
      +7*orbitDelta*Math.sin(time*.19+seed[3]);
    const primaryAngle=cornerAngles[primaryCorner];
    const secondaryAngle=cornerAngles[secondaryCorner];

    const target=Array.from({length:count},(_,i)=>{
      const angle=i/count*TAU;
      const c=Math.cos(angle), s=Math.sin(angle);
      const power=2/exponent;
      const baseX=centerX + halfW*sign(c)*Math.pow(Math.abs(c),power);
      const baseY=centerY + halfH*sign(s)*Math.pow(Math.abs(s),power);
      let dx=0, dy=0;

      // Broad low-frequency breathing around the whole membrane.
      const radial=irregularity*(1.15*Math.sin(angle*2*spatial+time*.12+seed[0])
        +.78*Math.sin(angle*3*spatial-time*.085+seed[3]));
      const drift=irregularity*(.42*Math.sin(time*.09+seed[0]+angle*1.7*spatial)
        +.28*Math.sin(time*.065+seed[1]-angle*2.3*spatial));
      dx+=c*(radial+drift); dy+=s*(radial+drift);

      // Tuned baseline keeps dedicated top/bottom pulses disabled. Broad radial
      // motion plus neighbour smoothing now shape those edges more naturally.

      // Smaller side ripples stop the vertical edges from reading as a frame.
      const leftCenters=[Math.PI-.23,Math.PI+.23];
      const rightCenters=[-.23,.23];
      leftCenters.forEach((center,index)=>{
        dx+=irregularity*( .7+1.75*wave(time*(.12+index*.014)+seed[index+1]) )
          *influence(angle,center,.32,2.1);
      });
      rightCenters.forEach((center,index)=>{
        dx-=irregularity*( .7+1.75*wave(time*(.125+index*.013)+seed[index+3]) )
          *influence(angle,center,.32,2.1);
      });

      // One corner forms a persistent soft bubble lobe; a second corner gets
      // a lighter version. The shoulders are pulled slightly inward so the
      // corner becomes a rounded wave instead of a geometric radius.
      const cornerLobe=(corner,strength,phase)=>{
        const core=influence(angle,corner,.27,1.8);
        const shoulder=influence(angle,corner,.58,2.0)-core*.72;
        const pulse=strength*(.82+.18*Math.sin(time*.14+phase));
        const radialOffset=pulse*core-1.55*strength/6*shoulder;
        dx+=c*radialOffset;
        dy+=s*radialOffset;
      };
      cornerLobe(primaryAngle,12.8*tuning.corners,seed[3]);
      cornerLobe(secondaryAngle,7.8*tuning.corners,seed[4]);

      // A moving local force travels around the perimeter. Positive values make
      // a travelling bulge; negative values pull the film inward like a magnet.
      const magnetAngle=time*.24+seed[5];
      const magnetWeight=influence(angle,magnetAngle,.52,1.65);
      const magnetOffset=chaos.magnet*18*(.72+.28*Math.sin(time*.31+seed[2]))*magnetWeight;
      dx+=c*magnetOffset;
      dy+=s*magnetOffset;

      // Global morph multiplier can even be negative: bulges become dents and
      // the familiar motion turns inside-out.
      dx*=chaos.amplitude;
      dy*=chaos.amplitude;

      return [
        clampValue(baseX+dx,SAFE_EDGE,SAFE_MAX),
        clampValue(baseY+dy,SAFE_EDGE,SAFE_MAX)
      ];
    });

    // Surface tension: each control point shares part of its intended movement
    // with the first and second neighbours. A moving point therefore produces
    // an arc, not a dent.
    const neighbor1=.15*tuning.smoothing;
    const neighbor2=.05*tuning.smoothing;
    const selfWeight=1-2*(neighbor1+neighbor2);
    for(let pass=0;pass<2;pass++){
      const previous=target.map(point=>point.slice());
      for(let i=0;i<count;i++){
        const p=previous[i];
        const p1=previous[(i+count-1)%count], n1=previous[(i+1)%count];
        const p2=previous[(i+count-2)%count], n2=previous[(i+2)%count];
        target[i][0]=p[0]*selfWeight+(p1[0]+n1[0])*neighbor1+(p2[0]+n2[0])*neighbor2;
        target[i][1]=p[1]*selfWeight+(p1[1]+n1[1])*neighbor1+(p2[1]+n2[1])*neighbor2;
      }
    }

    // A damped spring adds the slight delayed response of a real soap film.
    if(!membrane || membrane.length!==count){
      membrane=target.map(point=>point.slice());
      membraneVelocity=target.map(()=>[0,0]);
    }else{
      const baseStiffness=.10+.0495*tuning.bounce;
      const baseDamping=.73+.042*tuning.bounce;
      const stiffness=clampValue(baseStiffness*(1.65-.65*chaos.jelly),.025,.35);
      const damping=clampValue(baseDamping+(chaos.jelly-1)*.11,.48,.94);
      for(let i=0;i<count;i++){
        const point=membrane[i], velocity=membraneVelocity[i], goal=target[i];
        velocity[0]=(velocity[0]+(goal[0]-point[0])*stiffness)*damping;
        velocity[1]=(velocity[1]+(goal[1]-point[1])*stiffness)*damping;
        point[0]=clampValue(point[0]+velocity[0],SAFE_EDGE,SAFE_MAX);
        point[1]=clampValue(point[1]+velocity[1],SAFE_EDGE,SAFE_MAX);
      }
    }

    const points=membrane;
    const xy=p=>p.map(fmt).join(' ');
    const k=1/6;
    let contour=`M${xy(points[0])}`;
    for(let i=0;i<count;i++){
      const a=points[(i+count-1)%count], b=points[i], c=points[(i+1)%count], d=points[(i+2)%count];
      const cp1=[b[0]+(c[0]-a[0])*k,b[1]+(c[1]-a[1])*k];
      const cp2=[c[0]-(d[0]-b[0])*k,c[1]-(d[1]-b[1])*k];
      contour+=`C${xy(cp1)} ${xy(cp2)} ${xy(c)}`;
    }
    shape.setAttribute('d',contour+'Z');
    updateParticles(time);

    [10,22].forEach((pointIndex,index)=>{
      const p=points[pointIndex];
      const prev=points[(pointIndex+count-1)%count];
      const next=points[(pointIndex+1)%count];
      const rotation=Math.atan2(next[1]-prev[1],next[0]-prev[0])*180/Math.PI;
      glints[index].setAttribute('transform',`translate(${fmt(p[0])} ${fmt(p[1])}) rotate(${fmt(rotation)})`);
    });
  }
  function loop(now) {
    frame = 0;
    if (destroyed || paused || document.hidden || reduced.matches) { last = 0; return; }
    if (!last || now-last >= 1000/24) {
      elapsed += last ? Math.min((now-last)/1000,.1) * tuning.speed : 0;
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

  function setTuning(patch={}){
    const previousPoints=tuning.points;
    tuning=normalizeTuning({...tuning,...patch});
    if(tuning.points!==previousPoints){
      membrane=null;
      membraneVelocity=null;
    }
    draw(elapsed);
    return {...tuning};
  }
  function getTuning(){ return {...tuning}; }
  function setEffects(patch={}){
    effects=normalizeEffects({...effects,...patch});
    applyEffects();
    return {...effects};
  }
  function getEffects(){ return {...effects}; }
  function setChaos(patch={}){
    chaos=normalizeChaos({...chaos,...patch});
    draw(elapsed);
    return {...chaos};
  }
  function getChaos(){ return {...chaos}; }
  function setHeavy(patch={}){
    heavy=normalizeHeavy({...heavy,...patch});
    applyHeavy();
    draw(elapsed);
    return {...heavy};
  }
  function getHeavy(){ return {...heavy}; }

  return {
    transitionToScene,
    setTuning,
    getTuning,
    setEffects,
    getEffects,
    setChaos,
    getChaos,
    setHeavy,
    getHeavy,
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
