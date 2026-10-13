import {SCENIC} from './scenic-config.mjs';

// The three reused paper faces carry slices of the SAME prepared atlas. No
// blank covers, no stretching the entire country into a compressed rectangle.
export async function preparePaper(sheet,mapResult,record) {
  const inner=sheet.querySelector('.scenic-map-inner');
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');
  const width=inner.clientWidth,height=inner.clientHeight;
  canvas.width=width*2;canvas.height=height*2;ctx.scale(2,2);
  ctx.fillStyle='#faebce';ctx.fillRect(0,0,width,height);
  const map=inner.querySelector('.scenic-europe-map'),mapRect=map.getBoundingClientRect(),base=inner.getBoundingClientRect();
  const x=mapRect.left-base.left,y=mapRect.top-base.top,w=map.clientWidth,h=map.clientHeight;
  if(mapResult?.svg){
    // Serialize the real registered SVG, embedding the already decoded raster.
    const svg=mapResult.svg.cloneNode(true);
    svg.setAttribute('width',w*2);svg.setAttribute('height',h*2);
    const bitmap=svg.querySelector('image');
    if(bitmap && mapResult.image){
      const c=document.createElement('canvas');c.width=mapResult.image.naturalWidth;c.height=mapResult.image.naturalHeight;
      c.getContext('2d').drawImage(mapResult.image,0,0);
      bitmap.setAttribute('href',c.toDataURL('image/png'));
    }
    for(const path of svg.querySelectorAll('.country')){
      if(path.dataset.country!==record.id){path.setAttribute('fill','#b9d69c');continue;}
      path.setAttribute('fill','#25a861');path.setAttribute('fill-opacity','.62');
      path.setAttribute('stroke','#faffbb');path.setAttribute('stroke-width','1.7');
    }
    svg.querySelector('.scenic-country-halo')?.remove();
    const blob=new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}),url=URL.createObjectURL(blob),img=new Image();
    try{img.src=url;await img.decode();ctx.drawImage(img,x,y,w,h);}finally{URL.revokeObjectURL(url);}
    ctx.font='800 10px ScenicRound';ctx.textAlign='center';ctx.fillStyle='#284a38';
    for(const label of inner.querySelectorAll('.scenic-map-label')){
      const r=label.getBoundingClientRect();ctx.fillText(label.textContent,r.left-base.left+r.width/2,r.top-base.top+r.height*.8);
    }
  }
  ctx.fillStyle='#fff1d8';ctx.fillRect(0,height-65,width,65);
  ctx.textAlign='left';ctx.fillStyle='#17503c';ctx.font='700 23px ScenicRound';
  ctx.fillText(record.country,14,height-36,width-28);
  ctx.fillStyle='#456754';ctx.font='700 14px ScenicRound';ctx.fillText('Stolica: '+record.capital,14,height-14,width-28);
  const snapshot=canvas.toDataURL('image/webp',.9);
  for(const leaf of sheet.querySelectorAll('.scenic-fold-leaf'))leaf.style.backgroundImage=`linear-gradient(180deg,#54331020,transparent 14%,#fff8dc16 72%,#69451f26),url("${snapshot}")`;
}

export async function foldPaper(sheet,{opening,timeline,reduced}) {
  sheet.classList.remove('is-open','is-opening','is-closing');
  sheet.classList.add(opening?'is-opening':'is-closing');
  if(reduced){sheet.classList.toggle('is-open',opening);sheet.classList.remove('is-opening','is-closing');return;}
  const duration=opening?SCENIC.openMs:SCENIC.closeMs;
  const leaves=[...sheet.querySelectorAll('.scenic-fold-leaf')];
  const operations=leaves.map((leaf,index)=>{
    const start=index*.23,end=Math.min(.99,start+.48),shift=index*100;
    const flat={transform:'translateY(0) rotateX(0deg)',opacity:1};
    const closed={transform:`translateY(${shift}%) rotateX(${index%2?82:-82}deg)`,opacity:index?0:1};
    const frames=opening?[
      {...closed,offset:0},{...closed,offset:start},
      {transform:'translateY(0) rotateX(3deg)',opacity:1,offset:end},
      {...flat,offset:1}
    ]:[{...flat,offset:0},{...flat,offset:1-end},{...closed,offset:1-start},{...closed,offset:1}];
    return timeline.animate(leaf,frames,{duration,fill:'both',easing:'cubic-bezier(.25,.7,.22,1)'});
  });
  await Promise.all(operations);
  sheet.classList.remove('is-opening','is-closing');sheet.classList.toggle('is-open',opening);
}
