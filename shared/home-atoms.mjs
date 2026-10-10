// Editable vector atoms. The home illustration is never used for controls.
// Each SVG has its own gradient IDs, so Design Studio can render all modes.
const svg=(id,body,defs='',viewBox='0 0 140 140')=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" aria-hidden="true" focusable="false"><defs>${defs}</defs>${body}</svg>`;
const linear=(id,top,bottom)=>`<linearGradient id="${id}" x1="0" y1="0" x2=".65" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`;
const gloss=(id,opacity)=>`<linearGradient id="${id}" x1="0" y1="0" x2=".65" y2="1"><stop stop-color="white" stop-opacity="${opacity}"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient>`;
const star='M70 18 Q73 16 76 24 L88 48 L114 52 Q122 54 117 61 L98 80 L102 108 Q103 116 95 113 L70 100 L45 113 Q37 116 38 108 L42 80 L23 61 Q18 54 26 52 L52 48 L64 24 Q67 16 70 18Z';

export function homeTileSurface(mode){
 return svg(mode,`<rect x="1.5" y="1.5" width="253" height="243" rx="26" fill="url(#home-${mode}-surface)"/><rect x="2.5" y="2.5" width="251" height="241" rx="25" fill="url(#home-${mode}-light)" stroke="white" stroke-opacity=".26" stroke-width="3"/>`,`${linear(`home-${mode}-surface`,'var(--tile-light)','var(--tile-dark)')}<radialGradient id="home-${mode}-light" cx=".18" cy=".03" r="1"><stop stop-color="white" stop-opacity=".1"/><stop offset=".55" stop-color="white" stop-opacity="0"/><stop offset="1" stop-color="var(--tile-shade)" stop-opacity=".08"/></radialGradient>`,'0 0 256 246').replace('<svg ','<svg preserveAspectRatio="none" ');
}

export function homeTileDecoration(mode){
 const stars=positions=>positions.map(([x,y,s,r])=>`<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><path d="${star}" fill="white" opacity=".27"/></g>`).join('');
 const body={
  spelling:stars([[181,51,.5,0]]),
  math:'<g stroke="white" opacity=".29" stroke-width="10" stroke-linecap="round"><path d="M199 41v31m-15-15h30" transform="rotate(-10 199 57)"/><path d="M213 101v27m-14-14h28" transform="rotate(12 213 114)"/></g>',
  english:'<g fill="none" stroke="#fff5a2" stroke-width="9" stroke-linecap="round"><path d="m207 57 14-16m-13 36 22-5"/></g><path d="M191 178q-4-39 22-34 8-29 43-24v126h-65Z" fill="#ffed74" opacity=".24"/>',
  flags:'<path d="m118 202 60-106q6-9 12 0l22 30 10-10q7-9 13 1l36 85-54-21-13 18-27-36-22 21Z" fill="url(#home-mountain)"/><path d="m118 202 60-39 26 36 13-18 54 21-59-76-22-30Z" fill="#64e88b" opacity=".12"/>',
  reading:stars([[137,25,.48,-9],[185,50,.46,4],[156,100,.46,-8]])
 }[mode]||'';
 return svg(mode,body,linear('home-mountain','#96efa1','#17ae67'),'0 0 256 246').replace('<svg ','<svg preserveAspectRatio="none" ');
}

export function homeBadgeSurface(mode){
 return svg(mode,`<rect x="9" y="9" width="122" height="122" rx="36" fill="url(#home-${mode}-badge)"/><rect x="10" y="10" width="120" height="120" rx="35" fill="url(#home-${mode}-badge-light)" stroke="white" stroke-opacity=".12" stroke-width="2"/>`,`${linear(`home-${mode}-badge`,'var(--badge-light)','var(--badge-dark)')}${gloss(`home-${mode}-badge-light`,.17)}`);
}

export function homeModeGlyph(mode){
 if(mode==='english')return svg(mode,`<g clip-path="url(#home-union-clip)"><rect x="24" y="36" width="92" height="69" fill="url(#home-union-blue)"/><path d="m24 36 92 69m0-69-92 69" stroke="white" stroke-width="17"/><path d="m24 36 92 69m0-69-92 69" stroke="#f52245" stroke-width="6"/><path d="M70 36v69M24 70.5h92" stroke="white" stroke-width="25"/><path d="M70 36v69M24 70.5h92" stroke="#ed1740" stroke-width="15"/><rect x="24" y="36" width="92" height="69" fill="url(#home-flag-gloss)"/></g>`,`${linear('home-union-blue','#0879e7','#0746b6')}${gloss('home-flag-gloss',.19)}<clipPath id="home-union-clip"><rect x="24" y="36" width="92" height="69" rx="15"/></clipPath>`);
 if(mode==='reading')return svg(mode,`<path d="M22 38q25-8 48 5 23-13 48-5v76q-23-7-48 4-25-11-48-4Z" fill="#6927ee"/><path d="M19 32q28-8 51 7 23-15 51-7v74q-28-5-51 7-23-12-51-7Z" fill="#b990ff" stroke="#e2caff" stroke-width="3"/><path d="M27 25q24-6 43 10v71q-21-14-43-8Z" fill="url(#home-book-left)" stroke="white" stroke-width="5" stroke-linejoin="round"/><path d="M70 35q19-16 43-10v73q-22-6-43 8Z" fill="url(#home-book-right)" stroke="white" stroke-width="5" stroke-linejoin="round"/><path d="M70 36v67" stroke="white" stroke-width="3"/>`,linear('home-book-left','#f8efff','#dbc4ff')+linear('home-book-right','#fffaff','#e9d8ff'));
 if(mode==='flags')return svg(mode,`<circle cx="70" cy="70" r="52" fill="url(#home-ocean)" stroke="#fbfff4" stroke-width="4"/><g clip-path="url(#home-globe-clip)" fill="url(#home-land)"><path d="M30 29Q40 21 50 25q12 3 7 12l-7 6q11 9 4 15l-11 2q-3 16-12 9l-8-11q-5-16 7-29Z"/><path d="M54 64q10-10 20-3 11-9 17 3 4 6-2 13 19 8 1 19l-8 1q-2 16-8 22-7 10-10-9l-2-9q-16-10-10-23-14-9 2-14Z"/><path d="M76 20q23 0 17 12l-6 5q-2 9 7 11 13-8 26 7 8 10 1 23l-9 5q-9 0-9-12-12-1-10-16-20-11-9-18-12-5-8-17Z"/><path d="M104 97q13-9 22 7-5 13-19 9-16-1-3-16Z"/></g><ellipse cx="57" cy="37" rx="20" ry="9" fill="white" opacity=".25"/><circle cx="70" cy="70" r="51" fill="url(#home-globe-shade)"/>`,`${linear('home-ocean','#13d5ff','#0870d9')}${linear('home-land','#e2fb66','#83da28')}<radialGradient id="home-globe-shade" cx=".3" cy=".25" r=".8"><stop offset=".55" stop-color="#00437d" stop-opacity="0"/><stop offset="1" stop-color="#00437d" stop-opacity=".33"/></radialGradient><clipPath id="home-globe-clip"><circle cx="70" cy="70" r="50"/></clipPath>`);
 return '';
}

export function homeStatIcon(kind){
 if(kind==='star')return svg(kind,`<circle cx="70" cy="70" r="62" fill="url(#home-star-halo)"/><path d="${star}" fill="url(#home-star-gold)" stroke="#ffe263" stroke-width="1.5" transform="translate(0 4)"/>`,linear('home-star-halo','#fffcea','#fff2c6')+linear('home-star-gold','#ffe714','#ffa500'));
 if(kind==='chevron')return svg(kind,'<path d="m58 44 27 26-27 26" fill="none" stroke="white" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>');
 return svg(kind,`<circle cx="64" cy="80" r="60" fill="url(#home-target-halo)"/><circle cx="62" cy="79" r="40" fill="url(#home-target-pink)"/><circle cx="62" cy="79" r="27" fill="#fff5fa"/><circle cx="62" cy="79" r="16" fill="#ee2184"/><circle cx="62" cy="79" r="7" fill="#ffe2ee"/><path d="m65 77 43-44" stroke="#46209c" stroke-width="10" stroke-linecap="round"/><path d="m65 73 43-44" stroke="url(#home-arrow-purple)" stroke-width="7" stroke-linecap="round"/><path d="m92 40 3-25q1-8 6-5l11 16 18 4q6 2 1 7l-21 14Z" fill="url(#home-arrow-purple)"/><path d="m95 37 6-24 10 16Z" fill="#dd9bff" opacity=".8"/>`,linear('home-target-halo','#fff8fc','#ffdeea')+linear('home-target-pink','#ff7bb6','#f01b76')+linear('home-arrow-purple','#c472ff','#7135d8'));
}
