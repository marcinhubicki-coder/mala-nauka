// Physical radii stay constant through height animation. Two rounded steps
// separate navigation from the task label without moving the map camera.
export function campaignCardShape(width,height,radius=24){
 const r=Math.min(radius,width/6,height/5),s=Math.min(14,r),tab=Math.min(112,width*.30),title=width*.45,top=s*4;
 const x=n=>(n/width).toFixed(6),y=n=>(n/height).toFixed(6),arc=(a,sweep,px,py)=>`A${x(a)} ${y(a)} 0 0 ${sweep} ${x(px)} ${y(py)}`;
 return `M${x(r)} 0H${x(tab-s)}${arc(s,1,tab,s)}${arc(s,0,tab+s,s*2)}H${x(title-s)}${arc(s,1,title,s*3)}${arc(s,0,title+s,top)}H${x(width-r)}${arc(r,1,width,top+r)}V${y(height-r)}${arc(r,1,width-r,height)}H${x(r)}${arc(r,1,0,height-r)}V${y(r)}${arc(r,1,r,0)}Z`;
}
export function syncCampaignCardShape(card,box){
 const frame=card?.querySelector('.campaign-card-frame');if(!frame)return;
 const width=box?.inlineSize??card.offsetWidth,height=box?.blockSize??card.offsetHeight;
 if(!width||!height)return;
 const radius=parseFloat(getComputedStyle(card).borderTopLeftRadius)||24,path=campaignCardShape(width,height,radius);
 for(const node of frame.querySelectorAll('path'))if(node.getAttribute('d')!==path)node.setAttribute('d',path);
 const tab=Math.min(14,radius)*4+'px';if(card.style.getPropertyValue('--campaign-tab-height')!==tab)card.style.setProperty('--campaign-tab-height',tab);
}
