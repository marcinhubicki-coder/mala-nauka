// Editable vector atoms. The home illustration is never used for controls.
// Each SVG has its own gradient IDs, so Design Studio can render all modes.
const svg=(id,body,defs='',viewBox='0 0 140 140')=>`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" aria-hidden="true" focusable="false"><defs>${defs}</defs>${body}</svg>`;
const linear=(id,top,bottom)=>`<linearGradient id="${id}" x1="0" y1="0" x2=".65" y2="1" gradientUnits="objectBoundingBox"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`;
const gloss=(id,opacity)=>`<linearGradient id="${id}" x1="0" y1="0" x2=".65" y2="1"><stop stop-color="white" stop-opacity="${opacity}"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient>`;
const star='M70 18 Q73 16 76 24 L88 48 L114 52 Q122 54 117 61 L98 80 L102 108 Q103 116 95 113 L70 100 L45 113 Q37 116 38 108 L42 80 L23 61 Q18 54 26 52 L52 48 L64 24 Q67 16 70 18Z';

export function homeTileSurface(mode){
 return svg(mode,`<rect x="1.5" y="1.5" width="253" height="243" rx="26" fill="url(#home-${mode}-surface)"/><rect x="2.5" y="2.5" width="251" height="241" rx="25" fill="url(#home-${mode}-light)" stroke="white" stroke-opacity=".26" stroke-width="3"/>`,`${linear(`home-${mode}-surface`,'var(--tile-light)','var(--tile-dark)')}<radialGradient id="home-${mode}-light" cx=".18" cy=".03" r="1"><stop stop-color="white" stop-opacity=".1"/><stop offset=".55" stop-color="white" stop-opacity="0"/><stop offset="1" stop-color="var(--tile-shade)" stop-opacity=".08"/></radialGradient>`,'0 0 256 246').replace('<svg ','<svg preserveAspectRatio="none" ');
}

// Decoration coordinates use the actual tile size. Square stars keep the same
// silhouette in the wide Reading tile and the compact Orthography tile.
export const HOME_TILE_SIZES={spelling:[257,245],math:[253,245],english:[255,245],flags:[386,250],reading:[386,250]};
export function homeDecorationStar(){return svg('decoration-star',`<path d="${star}" fill="white" opacity=".27"/>`);}
export function homeDecorationAtoms(mode){
 const atom=(id,label,x,y,width,height,art)=>({id,label,x,y,width,height,svg:art});
 const starAtom=(id,x,y,size)=>atom(id,'Gwiazda dekoracyjna',x,y,size,size,homeDecorationStar());
 const plus=svg('plus','<path d="M70 30v80M30 70h80" fill="none" stroke="white" opacity=".29" stroke-width="25" stroke-linecap="round"/>');
 const rays=svg('rays','<path d="m18 27 17-21M19 52l28-7" fill="none" stroke="#fff5a2" stroke-width="9" stroke-linecap="round"/>','','0 0 56 64');
 const cloud=svg('cloud','<path d="M0 82C-1 60 13 45 32 47C38 19 62 9 83 23C98 1 125 1 144 18V114H0Z" fill="#ffed74" opacity=".28"/>','','0 0 144 114');
 const mountains=svg('mountains','<path d="M0 117 77 12Q84 2 91 12L123 56 137 40Q145 31 152 43L195 117 154 101 137 116 103 73 64 101Z" fill="url(#home-mountain)"/><path d="m0 117 64-16 39-28 34 43 17-15 41 16-43-74-15-3-14 16-32-44Z" fill="#64e88b" opacity=".12"/>',linear('home-mountain','#96efa1','#17ae67'),'0 0 195 120');
 return ({
  spelling:[starAtom('star',181,51,70)],
  math:[atom('plus-1','Plus · duży',180,35,38,38,plus),atom('plus-2','Plus · mały',195,96,34,34,plus)],
  english:[atom('rays','Promienie',196,33,56,64,rays),atom('cloud','Chmurka',180,113,144,114,cloud)],
  flags:[atom('mountains','Góry',169,87,195,120,mountains)],
  reading:[starAtom('star-1',223,25,70),starAtom('star-2',295,57,65),starAtom('star-3',253,120,62)]
 })[mode]||[];
}
// Composite export for artwork previews; production exposes each atom separately.
export function homeTileDecoration(mode){
 const [w,h]=HOME_TILE_SIZES[mode]||[256,246];
 return svg(mode,homeDecorationAtoms(mode).map(a=>a.svg.replace('<svg ',`<svg x="${a.x}" y="${a.y}" width="${a.width}" height="${a.height}" `)).join(''),'',`0 0 ${w} ${h}`);
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

export function homeStatBacking(kind){
 return svg(kind,`<circle cx="70" cy="70" r="62" fill="url(#home-${kind}-halo)"/>`,kind==='star'?linear('home-star-halo','#fffcea','#fff2c6'):linear('home-target-halo','#fff8fc','#ffdeea'));
}
export function homeStatSymbol(kind){
 if(kind==='star')return svg(kind,`<path d="${star}" fill="url(#home-star-gold)" stroke="#ffe263" stroke-width="1.5" transform="translate(70 70) scale(.84) translate(-70 -65)"/>`,`<linearGradient id="home-star-gold" x1=".15" y1="0" x2=".8" y2="1"><stop stop-color="#fff34a"/><stop offset=".42" stop-color="#ffd51a"/><stop offset="1" stop-color="#f39100"/></linearGradient>`);
 if(kind==='chevron')return svg(kind,'<path d="m58 44 27 26-27 26" fill="none" stroke="white" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>');
 return svg(kind,`<circle cx="70" cy="70" r="40" fill="url(#home-target-pink)"/><circle cx="70" cy="70" r="27" fill="#fff5fa"/><circle cx="70" cy="70" r="16" fill="#ee2184"/><circle cx="70" cy="70" r="7" fill="#ffe2ee"/><path d="m72 70 36-37" stroke="#46209c" stroke-width="10" stroke-linecap="round"/><path d="m72 66 36-37" stroke="url(#home-arrow-purple)" stroke-width="7" stroke-linecap="round"/><path d="m92 40 3-25q1-8 6-5l11 16 18 4q6 2 1 7l-21 14Z" fill="url(#home-arrow-purple)"/><path d="m95 37 6-24 10 16Z" fill="#dd9bff" opacity=".8"/>`,linear('home-target-pink','#ff7bb6','#f01b76')+linear('home-arrow-purple','#c472ff','#7135d8'));
}
export function homeStatIcon(kind){
 if(kind==='chevron')return homeStatSymbol(kind);
 return svg(kind,[homeStatBacking(kind),homeStatSymbol(kind)].map(a=>a.replace('<svg ','<svg width="140" height="140" ')).join(''));
}
